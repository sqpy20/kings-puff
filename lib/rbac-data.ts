import "server-only";
import { getPool } from "./db";
import {
  ALL_PERMISSION_KEYS,
  type AdminRole,
  type AdminUserRecord,
  type PermissionKey,
  SYSTEM_ROLES,
  normalizePermissions,
} from "./rbac";

type RoleRow = {
  slug: string;
  name: string;
  description: string;
  permissions: unknown;
  is_system: boolean;
  user_count?: number | string;
  created_at: Date | string;
  updated_at: Date | string;
};

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  auth_role: string | null;
  banned: boolean | null;
  ban_reason: string | null;
  active_sessions: number | string | null;
  created_at: Date | string;
  role_slug: string | null;
  role_name: string | null;
  role_permissions: unknown;
};

export type UserAccess = {
  exists: boolean;
  banned: boolean;
  authRole: string;
  sessionActive: boolean;
  roleSlug: string;
  roleName: string;
  isSuperAdmin: boolean;
  permissions: PermissionKey[];
};

export class RbacError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const ROLE_SLUG_RE = /^[a-z0-9][a-z0-9_-]{1,47}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toIso(value: Date | string | null | undefined): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return "";
}

function mapRoleRow(row: RoleRow): AdminRole {
  const isSuperAdmin = row.slug === SYSTEM_ROLES.SUPER_ADMIN;
  return {
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    permissions: isSuperAdmin
      ? [...ALL_PERMISSION_KEYS]
      : normalizePermissions(row.permissions),
    isSystem: Boolean(row.is_system),
    userCount: Number(row.user_count ?? 0),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapUserRow(
  row: UserRow,
  defaultAdminRole: { slug: string; name: string; permissions: PermissionKey[] },
): AdminUserRecord {
  const roleSlug = row.role_slug ?? defaultAdminRole.slug;
  const isSuperAdmin = roleSlug === SYSTEM_ROLES.SUPER_ADMIN;
  const roleName =
    row.role_name ??
    (isSuperAdmin ? "Super Admin" : defaultAdminRole.name);
  const permissions = isSuperAdmin
    ? [...ALL_PERMISSION_KEYS]
    : row.role_slug
      ? normalizePermissions(row.role_permissions)
      : [...defaultAdminRole.permissions];

  return {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    authRole: row.auth_role ?? "user",
    banned: Boolean(row.banned),
    banReason: row.ban_reason ?? null,
    activeSessions: Number(row.active_sessions ?? 0),
    rbacRole: roleSlug,
    rbacRoleName: roleName,
    permissions,
    createdAt: toIso(row.created_at),
  };
}

function extractPgCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

/** Parses a JSON request body into a plain object, throwing RbacError(400) if invalid. */
export async function parseRbacJsonBody(
  request: Request,
): Promise<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    throw new RbacError(400, "Invalid JSON request body.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new RbacError(400, "Expected a JSON object body.");
  }
  return parsed as Record<string, unknown>;
}

/** Maps RBAC validation/persistence errors to structured HTTP responses. */
export function rbacErrorResponse(err: unknown): Response {
  if (err instanceof RbacError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  const code = extractPgCode(err);
  if (code === "23505") {
    return Response.json(
      { error: "A record with this identifier already exists." },
      { status: 409 },
    );
  }
  if (code === "23001" || code === "23503") {
    return Response.json(
      {
        error:
          "Cannot delete a role while users are assigned to it. Reassign those users first.",
      },
      { status: 409 },
    );
  }
  return Response.json(
    { error: "Unexpected error processing user or role request." },
    { status: 500 },
  );
}

/** Resolves live Neon Auth user state, session validity, RBAC role, and permissions. */
export async function getUserAccess(
  userId: string,
  sessionId?: string | null,
): Promise<UserAccess> {
  if (!UUID_RE.test(userId)) {
    return {
      exists: false,
      banned: true,
      authRole: "user",
      sessionActive: false,
      roleSlug: SYSTEM_ROLES.ADMIN,
      roleName: "Admin",
      isSuperAdmin: false,
      permissions: [],
    };
  }

  const db = getPool();
  const validSessionId =
    typeof sessionId === "string" && UUID_RE.test(sessionId) ? sessionId : null;

  const userRes = await db.query<{
    banned: boolean | null;
    auth_role: string | null;
    session_active: boolean;
    role_slug: string | null;
    role_name: string | null;
    role_permissions: unknown;
  }>(
    `SELECT
       COALESCE(u.banned, false) AS banned,
       COALESCE(u.role, 'user') AS auth_role,
       CASE
         WHEN $2::uuid IS NOT NULL THEN EXISTS (
           SELECT 1
           FROM neon_auth.session s
           WHERE s.id = $2::uuid
             AND s."userId" = u.id
             AND s."expiresAt" > NOW()
         )
         ELSE EXISTS (
           SELECT 1
           FROM neon_auth.session s
           WHERE s."userId" = u.id
             AND s."expiresAt" > NOW()
         )
       END AS session_active,
       aur.role_slug,
       ar.name AS role_name,
       ar.permissions AS role_permissions
     FROM neon_auth."user" u
     LEFT JOIN public.admin_user_roles aur ON aur.user_id = u.id
     LEFT JOIN public.admin_roles ar ON ar.slug = aur.role_slug
     WHERE u.id = $1::uuid`,
    [userId, validSessionId],
  );

  if ((userRes.rowCount ?? 0) === 0) {
    return {
      exists: false,
      banned: true,
      authRole: "user",
      sessionActive: false,
      roleSlug: SYSTEM_ROLES.ADMIN,
      roleName: "Admin",
      isSuperAdmin: false,
      permissions: [],
    };
  }

  const row = userRes.rows[0];
  const banned = Boolean(row.banned);
  const authRole = row.auth_role ?? "user";
  const sessionActive = Boolean(row.session_active);

  if (row.role_slug) {
    const isSuperAdmin = row.role_slug === SYSTEM_ROLES.SUPER_ADMIN;
    return {
      exists: true,
      banned,
      authRole,
      sessionActive,
      roleSlug: row.role_slug,
      roleName: row.role_name ?? (isSuperAdmin ? "Super Admin" : "Admin"),
      isSuperAdmin,
      permissions: isSuperAdmin
        ? [...ALL_PERMISSION_KEYS]
        : normalizePermissions(row.role_permissions),
    };
  }

  const fallbackRes = await db.query<{
    slug: string;
    name: string;
    permissions: unknown;
  }>(
    `SELECT slug, name, permissions
     FROM public.admin_roles
     WHERE slug = $1`,
    [SYSTEM_ROLES.ADMIN],
  );

  if ((fallbackRes.rowCount ?? 0) > 0) {
    const fallback = fallbackRes.rows[0];
    return {
      exists: true,
      banned,
      authRole,
      sessionActive,
      roleSlug: fallback.slug,
      roleName: fallback.name,
      isSuperAdmin: false,
      permissions: normalizePermissions(fallback.permissions),
    };
  }

  return {
    exists: true,
    banned,
    authRole,
    sessionActive,
    roleSlug: SYSTEM_ROLES.ADMIN,
    roleName: "Admin",
    isSuperAdmin: false,
    permissions: [],
  };
}

/** Lists all configured admin roles ordered by system hierarchy then creation date. */
export async function listRoles(): Promise<AdminRole[]> {
  const db = getPool();
  const res = await db.query<RoleRow>(`
    SELECT
      ar.slug,
      ar.name,
      ar.description,
      ar.permissions,
      ar.is_system,
      COUNT(aur.user_id)::int AS user_count,
      ar.created_at,
      ar.updated_at
    FROM public.admin_roles ar
    LEFT JOIN public.admin_user_roles aur ON aur.role_slug = ar.slug
    GROUP BY ar.slug
    ORDER BY
      CASE ar.slug
        WHEN 'super_admin' THEN 0
        WHEN 'admin' THEN 1
        ELSE 2
      END,
      ar.created_at ASC
  `);

  return res.rows.map(mapRoleRow);
}

/** Creates a custom (non-system) role in Lakebase Postgres. */
export async function createRole(
  raw: Record<string, unknown>,
): Promise<AdminRole> {
  const slug =
    typeof raw.slug === "string" ? raw.slug.trim().toLowerCase() : "";
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const description =
    typeof raw.description === "string" ? raw.description.trim() : "";

  if (!ROLE_SLUG_RE.test(slug)) {
    throw new RbacError(
      400,
      "Role slug must be 2–48 lowercase letters, digits, hyphens, or underscores.",
    );
  }
  if (!name || name.length > 80) {
    throw new RbacError(
      400,
      "Role name is required and must be 80 characters or fewer.",
    );
  }
  if (description.length > 300) {
    throw new RbacError(
      400,
      "Role description must be 300 characters or fewer.",
    );
  }

  const permissions = normalizePermissions(raw.permissions);
  const db = getPool();

  try {
    const res = await db.query<RoleRow>(
      `INSERT INTO public.admin_roles (slug, name, description, permissions, is_system)
       VALUES ($1, $2, $3, $4::jsonb, false)
       RETURNING slug, name, description, permissions, is_system, 0::int AS user_count, created_at, updated_at`,
      [slug, name, description, JSON.stringify(permissions)],
    );
    return mapRoleRow(res.rows[0]);
  } catch (err) {
    if (extractPgCode(err) === "23505") {
      throw new RbacError(409, `Role "${slug}" already exists.`);
    }
    throw err;
  }
}

/** Updates permissions and metadata on an existing role. */
export async function updateRole(
  slug: string,
  raw: Record<string, unknown>,
): Promise<AdminRole> {
  const cleanSlug = slug.trim().toLowerCase();
  const db = getPool();

  const existingRes = await db.query<RoleRow>(
    `SELECT
       ar.slug,
       ar.name,
       ar.description,
       ar.permissions,
       ar.is_system,
       COUNT(aur.user_id)::int AS user_count,
       ar.created_at,
       ar.updated_at
     FROM public.admin_roles ar
     LEFT JOIN public.admin_user_roles aur ON aur.role_slug = ar.slug
     WHERE ar.slug = $1
     GROUP BY ar.slug`,
    [cleanSlug],
  );

  if ((existingRes.rowCount ?? 0) === 0) {
    throw new RbacError(404, `Role "${cleanSlug}" was not found.`);
  }

  const current = existingRes.rows[0];
  let nextPermissions = normalizePermissions(current.permissions);

  if (raw.permissions !== undefined) {
    if (!Array.isArray(raw.permissions)) {
      throw new RbacError(400, "permissions must be an array of keys.");
    }
    const normalized = normalizePermissions(raw.permissions);
    if (
      cleanSlug === SYSTEM_ROLES.SUPER_ADMIN &&
      normalized.length !== ALL_PERMISSION_KEYS.length
    ) {
      throw new RbacError(
        403,
        "Super Admin always has all permissions and cannot be restricted.",
      );
    }
    nextPermissions =
      cleanSlug === SYSTEM_ROLES.SUPER_ADMIN
        ? [...ALL_PERMISSION_KEYS]
        : normalized;
  }

  let nextName = current.name;
  if (!current.is_system && raw.name !== undefined) {
    const candidateName =
      typeof raw.name === "string" ? raw.name.trim() : "";
    if (!candidateName || candidateName.length > 80) {
      throw new RbacError(
        400,
        "Role name is required and must be 80 characters or fewer.",
      );
    }
    nextName = candidateName;
  }

  let nextDescription = current.description ?? "";
  if (raw.description !== undefined) {
    if (typeof raw.description !== "string") {
      throw new RbacError(400, "Role description must be a string.");
    }
    const candidateDesc = raw.description.trim();
    if (candidateDesc.length > 300) {
      throw new RbacError(
        400,
        "Role description must be 300 characters or fewer.",
      );
    }
    nextDescription = candidateDesc;
  }

  await db.query(
    `UPDATE public.admin_roles
     SET name = $2,
         description = $3,
         permissions = $4::jsonb,
         updated_at = NOW()
     WHERE slug = $1`,
    [cleanSlug, nextName, nextDescription, JSON.stringify(nextPermissions)],
  );

  const updatedRes = await db.query<RoleRow>(
    `SELECT
       ar.slug,
       ar.name,
       ar.description,
       ar.permissions,
       ar.is_system,
       COUNT(aur.user_id)::int AS user_count,
       ar.created_at,
       ar.updated_at
     FROM public.admin_roles ar
     LEFT JOIN public.admin_user_roles aur ON aur.role_slug = ar.slug
     WHERE ar.slug = $1
     GROUP BY ar.slug`,
    [cleanSlug],
  );

  return mapRoleRow(updatedRes.rows[0]);
}

/** Deletes a custom role when no users are assigned to it. */
export async function deleteRole(slug: string): Promise<{ deleted: string }> {
  const cleanSlug = slug.trim().toLowerCase();
  const db = getPool();

  const existingRes = await db.query<{ is_system: boolean }>(
    `SELECT is_system FROM public.admin_roles WHERE slug = $1`,
    [cleanSlug],
  );
  if ((existingRes.rowCount ?? 0) === 0) {
    throw new RbacError(404, `Role "${cleanSlug}" was not found.`);
  }
  if (existingRes.rows[0].is_system) {
    throw new RbacError(403, "System roles cannot be deleted.");
  }

  try {
    await db.query(`DELETE FROM public.admin_roles WHERE slug = $1`, [
      cleanSlug,
    ]);
    return { deleted: cleanSlug };
  } catch (err) {
    const code = extractPgCode(err);
    if (code === "23001" || code === "23503") {
      throw new RbacError(
        409,
        "Cannot delete a role while users are assigned to it. Reassign those users first.",
      );
    }
    throw err;
  }
}

/** Lists all Neon Auth users joined with their RBAC role, permissions, and active sessions. */
export async function listAdminUsers(): Promise<AdminUserRecord[]> {
  const db = getPool();
  const [adminDefaultRes, usersRes] = await Promise.all([
    db.query<{ slug: string; name: string; permissions: unknown }>(
      `SELECT slug, name, permissions FROM public.admin_roles WHERE slug = $1`,
      [SYSTEM_ROLES.ADMIN],
    ),
    db.query<UserRow>(`
      SELECT
        u.id,
        u.email,
        u.name,
        u.role AS auth_role,
        u.banned,
        u."banReason" AS ban_reason,
        (
          SELECT COUNT(*)::int
          FROM neon_auth.session s
          WHERE s."userId" = u.id
            AND s."expiresAt" > NOW()
        ) AS active_sessions,
        u."createdAt" AS created_at,
        aur.role_slug,
        ar.name AS role_name,
        ar.permissions AS role_permissions
      FROM neon_auth."user" u
      LEFT JOIN public.admin_user_roles aur ON aur.user_id = u.id
      LEFT JOIN public.admin_roles ar ON ar.slug = aur.role_slug
      ORDER BY u."createdAt" ASC
    `),
  ]);

  const defaultAdminRow = adminDefaultRes.rows[0];
  const defaultAdminRole = {
    slug: defaultAdminRow?.slug ?? SYSTEM_ROLES.ADMIN,
    name: defaultAdminRow?.name ?? "Admin",
    permissions: defaultAdminRow
      ? normalizePermissions(defaultAdminRow.permissions)
      : [],
  };

  return usersRes.rows.map((row) => mapUserRow(row, defaultAdminRole));
}

async function getAdminUserById(userId: string): Promise<AdminUserRecord> {
  const users = await listAdminUsers();
  const found = users.find((u) => u.id === userId);
  if (!found) {
    throw new RbacError(404, "User record could not be loaded.");
  }
  return found;
}

/** Creates a new admin team user via Neon Auth and assigns their initial RBAC role. */
export async function createAdminUser(
  raw: Record<string, unknown>,
  actorUserId: string,
  origin: string,
): Promise<AdminUserRecord> {
  const email =
    typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  const password = typeof raw.password === "string" ? raw.password : "";
  const rawName = typeof raw.name === "string" ? raw.name.trim() : "";
  const name = rawName || email.split("@")[0] || "";
  const roleSlug =
    typeof raw.roleSlug === "string" && raw.roleSlug.trim()
      ? raw.roleSlug.trim().toLowerCase()
      : SYSTEM_ROLES.ADMIN;

  if (!EMAIL_RE.test(email)) {
    throw new RbacError(400, "Please enter a valid email address.");
  }
  if (password.length < 8) {
    throw new RbacError(400, "Password must be at least 8 characters long.");
  }
  if (!name || name.length > 120) {
    throw new RbacError(
      400,
      "Name must be between 1 and 120 characters.",
    );
  }
  if (!ROLE_SLUG_RE.test(roleSlug)) {
    throw new RbacError(400, "Invalid role slug.");
  }

  const db = getPool();
  const [roleRes, existingUserRes] = await Promise.all([
    db.query<{ slug: string }>(
      `SELECT slug FROM public.admin_roles WHERE slug = $1`,
      [roleSlug],
    ),
    db.query<{ id: string }>(
      `SELECT id FROM neon_auth."user" WHERE lower(email) = lower($1)`,
      [email],
    ),
  ]);

  if ((roleRes.rowCount ?? 0) === 0) {
    throw new RbacError(404, `Role "${roleSlug}" was not found.`);
  }
  if ((existingUserRes.rowCount ?? 0) > 0) {
    throw new RbacError(
      409,
      `A user with email "${email}" already exists.`,
    );
  }

  const authBaseUrl = process.env.NEON_AUTH_BASE_URL?.replace(/\/+$/, "");
  if (!authBaseUrl) {
    throw new RbacError(500, "NEON_AUTH_BASE_URL is not configured.");
  }

  const requestOrigin =
    origin.trim() || process.env.ADMIN_ORIGIN || "http://localhost:3000";

  const signUpRes = await fetch(`${authBaseUrl}/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: requestOrigin,
    },
    body: JSON.stringify({ email, password, name }),
  });

  if (!signUpRes.ok) {
    const body = (await signUpRes.json().catch(() => ({}))) as {
      code?: unknown;
      message?: unknown;
    };
    const code = typeof body?.code === "string" ? body.code : "";
    const message = typeof body?.message === "string" ? body.message : "";
    const alreadyExists =
      signUpRes.status === 409 ||
      signUpRes.status === 422 ||
      code === "USER_ALREADY_EXISTS" ||
      /already exists|already registered/i.test(message);

    if (alreadyExists) {
      throw new RbacError(
        409,
        `A user with email "${email}" already exists.`,
      );
    }

    throw new RbacError(
      502,
      `Neon Auth sign-up failed (${signUpRes.status}): ${message || code || "Unknown error"}`,
    );
  }

  const validActor = UUID_RE.test(actorUserId) ? actorUserId : null;
  const updRes = await db.query<{ id: string }>(
    `UPDATE neon_auth."user"
     SET role = 'admin',
         "emailVerified" = true,
         name = $2,
         "updatedAt" = NOW()
     WHERE lower(email) = lower($1)
     RETURNING id`,
    [email, name],
  );

  if ((updRes.rowCount ?? 0) === 0) {
    throw new RbacError(
      500,
      "User was created in Neon Auth but could not be located in neon_auth.user.",
    );
  }

  const userId = updRes.rows[0].id;
  await db.query(
    `INSERT INTO public.admin_user_roles (user_id, role_slug, assigned_by, updated_at)
     VALUES ($1::uuid, $2, $3::uuid, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       role_slug = EXCLUDED.role_slug,
       assigned_by = EXCLUDED.assigned_by,
       updated_at = NOW()`,
    [userId, roleSlug, validActor],
  );

  return getAdminUserById(userId);
}

/** Updates a user's profile name, RBAC role, and/or ban/suspension state. */
export async function updateAdminUser(
  targetUserId: string,
  raw: Record<string, unknown>,
  actorUserId: string,
): Promise<AdminUserRecord> {
  const cleanUserId = targetUserId.trim();
  if (!UUID_RE.test(cleanUserId)) {
    throw new RbacError(400, "Invalid user ID.");
  }

  let nextName: string | undefined;
  if (raw.name !== undefined) {
    if (typeof raw.name !== "string") {
      throw new RbacError(400, "Name must be a string.");
    }
    const trimmed = raw.name.trim();
    if (!trimmed || trimmed.length > 120) {
      throw new RbacError(400, "Name must be between 1 and 120 characters.");
    }
    nextName = trimmed;
  }

  let nextRoleSlug: string | undefined;
  if (raw.roleSlug !== undefined) {
    if (typeof raw.roleSlug !== "string") {
      throw new RbacError(400, "roleSlug must be a string.");
    }
    const trimmed = raw.roleSlug.trim().toLowerCase();
    if (!ROLE_SLUG_RE.test(trimmed)) {
      throw new RbacError(400, "Invalid role slug.");
    }
    nextRoleSlug = trimmed;
  }

  let nextBanned: boolean | undefined;
  if (raw.banned !== undefined) {
    if (typeof raw.banned !== "boolean") {
      throw new RbacError(400, "banned must be a boolean.");
    }
    nextBanned = raw.banned;
  }

  let nextBanReason: string | null | undefined;
  if (raw.banReason !== undefined) {
    if (raw.banReason === null) {
      nextBanReason = null;
    } else if (typeof raw.banReason === "string") {
      const trimmed = raw.banReason.trim();
      if (trimmed.length > 240) {
        throw new RbacError(400, "Ban reason must be 240 characters or fewer.");
      }
      nextBanReason = trimmed || null;
    } else {
      throw new RbacError(400, "banReason must be a string or null.");
    }
  }

  const db = getPool();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const userRes = await client.query<{
      id: string;
      name: string | null;
      banned: boolean | null;
      ban_reason: string | null;
      role_slug: string | null;
    }>(
      `SELECT u.id, u.name, u.banned, u."banReason" AS ban_reason, aur.role_slug
       FROM neon_auth."user" u
       LEFT JOIN public.admin_user_roles aur ON aur.user_id = u.id
       WHERE u.id = $1::uuid`,
      [cleanUserId],
    );

    if ((userRes.rowCount ?? 0) === 0) {
      throw new RbacError(404, "Target user was not found.");
    }

    const current = userRes.rows[0];
    const currentRole = current.role_slug ?? SYSTEM_ROLES.ADMIN;

    if (nextRoleSlug) {
      const roleRes = await client.query<{ slug: string }>(
        `SELECT slug FROM public.admin_roles WHERE slug = $1`,
        [nextRoleSlug],
      );
      if ((roleRes.rowCount ?? 0) === 0) {
        throw new RbacError(404, `Role "${nextRoleSlug}" was not found.`);
      }
    }

    if (cleanUserId === actorUserId && nextBanned === true) {
      throw new RbacError(400, "You cannot suspend your own account.");
    }

    if (
      cleanUserId === actorUserId &&
      currentRole === SYSTEM_ROLES.SUPER_ADMIN &&
      nextRoleSlug &&
      nextRoleSlug !== SYSTEM_ROLES.SUPER_ADMIN
    ) {
      throw new RbacError(400, "You cannot remove your own Super Admin role.");
    }

    const removesSuperAdminPrivilege =
      currentRole === SYSTEM_ROLES.SUPER_ADMIN &&
      !current.banned &&
      ((nextRoleSlug !== undefined &&
        nextRoleSlug !== SYSTEM_ROLES.SUPER_ADMIN) ||
        nextBanned === true);

    if (removesSuperAdminPrivilege) {
      const otherActiveSupers = await client.query<{ total: number }>(
        `SELECT COUNT(*)::int AS total
         FROM public.admin_user_roles aur
         JOIN neon_auth."user" u ON u.id = aur.user_id
         WHERE aur.role_slug = $1
           AND aur.user_id <> $2::uuid
           AND COALESCE(u.banned, false) = false`,
        [SYSTEM_ROLES.SUPER_ADMIN, cleanUserId],
      );
      if ((otherActiveSupers.rows[0]?.total ?? 0) < 1) {
        throw new RbacError(
          400,
          "At least one active Super Admin account must remain.",
        );
      }
    }

    const finalName = nextName !== undefined ? nextName : current.name;
    const finalBanned =
      nextBanned !== undefined ? nextBanned : Boolean(current.banned);
    const finalBanReason =
      nextBanned === false
        ? null
        : nextBanReason !== undefined
          ? nextBanReason
          : current.ban_reason;

    await client.query(
      `UPDATE neon_auth."user"
       SET name = $2,
           banned = $3,
           "banReason" = $4,
           role = CASE
             WHEN lower(COALESCE(role, '')) LIKE '%admin%' THEN role
             ELSE 'admin'
           END,
           "updatedAt" = NOW()
       WHERE id = $1::uuid`,
      [cleanUserId, finalName, finalBanned, finalBanReason],
    );

    if (nextRoleSlug) {
      const validActor = UUID_RE.test(actorUserId) ? actorUserId : null;
      await client.query(
        `INSERT INTO public.admin_user_roles (user_id, role_slug, assigned_by, updated_at)
         VALUES ($1::uuid, $2, $3::uuid, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           role_slug = EXCLUDED.role_slug,
           assigned_by = EXCLUDED.assigned_by,
           updated_at = NOW()`,
        [cleanUserId, nextRoleSlug, validActor],
      );
    }

    if (nextBanned === true) {
      await client.query(
        `DELETE FROM neon_auth.session WHERE "userId" = $1::uuid`,
        [cleanUserId],
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }

  return getAdminUserById(cleanUserId);
}

/** Deletes an admin user and cleans up their sessions, accounts, and RBAC assignment. */
export async function deleteAdminUser(
  targetUserId: string,
  actorUserId: string,
): Promise<{ deleted: string }> {
  const cleanUserId = targetUserId.trim();
  if (!UUID_RE.test(cleanUserId)) {
    throw new RbacError(400, "Invalid user ID.");
  }
  if (cleanUserId === actorUserId) {
    throw new RbacError(400, "You cannot delete your own account.");
  }

  const db = getPool();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const userRes = await client.query<{
      id: string;
      banned: boolean | null;
      role_slug: string | null;
    }>(
      `SELECT u.id, u.banned, aur.role_slug
       FROM neon_auth."user" u
       LEFT JOIN public.admin_user_roles aur ON aur.user_id = u.id
       WHERE u.id = $1::uuid`,
      [cleanUserId],
    );

    if ((userRes.rowCount ?? 0) === 0) {
      throw new RbacError(404, "Target user was not found.");
    }

    const current = userRes.rows[0];
    if (current.role_slug === SYSTEM_ROLES.SUPER_ADMIN && !current.banned) {
      const otherActiveSupers = await client.query<{ total: number }>(
        `SELECT COUNT(*)::int AS total
         FROM public.admin_user_roles aur
         JOIN neon_auth."user" u ON u.id = aur.user_id
         WHERE aur.role_slug = $1
           AND aur.user_id <> $2::uuid
           AND COALESCE(u.banned, false) = false`,
        [SYSTEM_ROLES.SUPER_ADMIN, cleanUserId],
      );
      if ((otherActiveSupers.rows[0]?.total ?? 0) < 1) {
        throw new RbacError(
          400,
          "At least one active Super Admin account must remain.",
        );
      }
    }

    await client.query(
      `DELETE FROM public.admin_user_roles WHERE user_id = $1::uuid`,
      [cleanUserId],
    );
    await client.query(
      `DELETE FROM neon_auth.session WHERE "userId" = $1::uuid`,
      [cleanUserId],
    );
    await client.query(
      `DELETE FROM neon_auth.account WHERE "userId" = $1::uuid`,
      [cleanUserId],
    );
    await client.query(
      `DELETE FROM neon_auth."user" WHERE id = $1::uuid`,
      [cleanUserId],
    );

    await client.query("COMMIT");
    return { deleted: cleanUserId };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** Assigns an RBAC role to a Neon Auth user while guarding against Super Admin lockout. */
export async function assignUserRole(
  targetUserId: string,
  roleSlug: string,
  actorUserId: string,
): Promise<AdminUserRecord> {
  return updateAdminUser(targetUserId, { roleSlug }, actorUserId);
}
