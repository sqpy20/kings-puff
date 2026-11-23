import { cookies } from "next/headers";
import "server-only";
import { auth } from "./server";

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export type AdminSessionResult = {
  authenticated: boolean;
  isAdmin: boolean;
  user: AdminUser | null;
};

/** Checks whether a Better Auth role string contains the `"admin"` role. */
export function isAdminRole(role: unknown): boolean {
  if (typeof role !== "string") return false;
  return role
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .includes("admin");
}

/** Ensures post-login redirects stay strictly inside the `/admin` portal. */
export function sanitizeAdminRedirect(raw: string | null | undefined): string {
  if (!raw) return "/admin";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/admin")) return "/admin";
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return "/admin";
  if (trimmed === "/admin/login" || trimmed.startsWith("/admin/login?")) {
    return "/admin";
  }
  return trimmed;
}

/** Reads the verified Neon Auth session from cookies and checks admin role membership. */
export async function getAdminSession(): Promise<AdminSessionResult> {
  // Trigger the Next.js dynamic cookie boundary before Neon Auth's internal cache check.
  await cookies();
  const { data } = await auth.getSession();
  const rawUser = data?.user as
    | {
        id?: unknown;
        email?: unknown;
        name?: unknown;
        role?: unknown;
        banned?: unknown;
      }
    | null
    | undefined;

  if (!data?.session || !rawUser || typeof rawUser.id !== "string") {
    return { authenticated: false, isAdmin: false, user: null };
  }

  const role = typeof rawUser.role === "string" ? rawUser.role : "user";
  const user: AdminUser = {
    id: rawUser.id,
    email: typeof rawUser.email === "string" ? rawUser.email : "",
    name: typeof rawUser.name === "string" ? rawUser.name : null,
    role,
  };

  const isAdmin = isAdminRole(role) && rawUser.banned !== true;

  return {
    authenticated: true,
    isAdmin,
    user,
  };
}

/** Authorizes admin API handlers, returning a 401/403 JSON response when denied. */
export async function requireAdminApi(): Promise<
  { user: AdminUser } | { response: Response }
> {
  const session = await getAdminSession();
  if (!session.authenticated || !session.user) {
    return {
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!session.isAdmin) {
    return {
      response: Response.json(
        { error: "Forbidden: administrator access required" },
        { status: 403 },
      ),
    };
  }
  return { user: session.user };
}
