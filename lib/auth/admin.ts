import { cookies } from "next/headers";
import "server-only";
import {
  type PermissionKey,
  SYSTEM_ROLES,
  hasAnyPermission,
  hasPermission,
} from "@/lib/rbac";
import { getUserAccess } from "@/lib/rbac-data";
import { auth } from "./server";

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  rbacRole: string;
  rbacRoleName: string;
  isSuperAdmin: boolean;
  permissions: PermissionKey[];
};

export type AdminSessionResult = {
  authenticated: boolean;
  isAdmin: boolean;
  user: AdminUser | null;
};

/** Checks whether a Better Auth role string grants admin portal access. */
export function isAdminRole(role: unknown): boolean {
  if (typeof role !== "string") return false;
  return role
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .some((part) => part === "admin" || part === "super_admin");
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

/** Reads the verified Neon Auth session from cookies and hydrates RBAC permissions. */
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

  const rawSession = data?.session as { id?: unknown } | null | undefined;
  const sessionId =
    typeof rawSession?.id === "string" ? rawSession.id : null;

  let liveRole = typeof rawUser.role === "string" ? rawUser.role : "user";
  let liveBanned = rawUser.banned === true;

  let access = {
    exists: true,
    banned: liveBanned,
    authRole: liveRole,
    sessionActive: true,
    roleSlug: SYSTEM_ROLES.ADMIN as string,
    roleName: "Admin",
    isSuperAdmin: false,
    permissions: [] as PermissionKey[],
  };

  try {
    access = await getUserAccess(rawUser.id, sessionId);
    if (!access.exists || !access.sessionActive) {
      return { authenticated: false, isAdmin: false, user: null };
    }
    liveRole = access.authRole;
    liveBanned = access.banned;
  } catch {
    // Fallback to cookie claims with zero permissions if RBAC tables are unavailable.
  }

  const isAdmin = isAdminRole(liveRole) && !liveBanned;

  const user: AdminUser = {
    id: rawUser.id,
    email: typeof rawUser.email === "string" ? rawUser.email : "",
    name: typeof rawUser.name === "string" ? rawUser.name : null,
    role: liveRole,
    rbacRole: isAdmin ? access.roleSlug : liveRole,
    rbacRoleName: isAdmin ? access.roleName : liveRole,
    isSuperAdmin: isAdmin && access.isSuperAdmin,
    permissions: isAdmin ? access.permissions : [],
  };

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

/** Authorizes an admin API handler requiring a specific RBAC permission. */
export async function requireAdminPermission(
  permission: PermissionKey,
): Promise<{ user: AdminUser } | { response: Response }> {
  const gate = await requireAdminApi();
  if ("response" in gate) return gate;

  if (!hasPermission(gate.user.permissions, permission, gate.user.isSuperAdmin)) {
    return {
      response: Response.json(
        { error: `Forbidden: missing permission "${permission}"` },
        { status: 403 },
      ),
    };
  }
  return gate;
}

/** Authorizes an admin API handler requiring at least one of the specified permissions. */
export async function requireAdminAnyPermission(
  permissions: readonly PermissionKey[],
): Promise<{ user: AdminUser } | { response: Response }> {
  const gate = await requireAdminApi();
  if ("response" in gate) return gate;

  if (
    !hasAnyPermission(
      gate.user.permissions,
      permissions,
      gate.user.isSuperAdmin,
    )
  ) {
    return {
      response: Response.json(
        {
          error: `Forbidden: requires one of [${permissions.join(", ")}]`,
        },
        { status: 403 },
      ),
    };
  }
  return gate;
}
