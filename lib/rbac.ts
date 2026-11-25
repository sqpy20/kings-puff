export const SYSTEM_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
} as const;

export const PERMISSIONS = [
  {
    key: "overview.view",
    group: "Overview",
    label: "View overview",
    description:
      "View store KPIs, collections snapshot, and low-stock alerts",
  },
  {
    key: "catalog.read",
    group: "Catalog",
    label: "View catalogs",
    description: "View collections and category taxonomy",
  },
  {
    key: "catalog.write",
    group: "Catalog",
    label: "Manage catalogs",
    description: "Create, edit, and delete storefront catalogs",
  },
  {
    key: "inventory.read",
    group: "Inventory",
    label: "View inventory",
    description: "View products, pricing, and stock levels",
  },
  {
    key: "inventory.write",
    group: "Inventory",
    label: "Manage inventory",
    description:
      "Create, edit, publish/unpublish, adjust stock, upload images, and delete products",
  },
  {
    key: "users.read",
    group: "Users",
    label: "View users",
    description:
      "View admin user directory, role assignments, and session status",
  },
  {
    key: "users.write",
    group: "Users",
    label: "Manage users",
    description:
      "Create users, edit profiles/roles, suspend/unban accounts, and delete users",
  },
  {
    key: "roles.read",
    group: "Roles",
    label: "View roles & permissions",
    description: "View roles and the permission matrix",
  },
  {
    key: "roles.write",
    group: "Roles",
    label: "Manage roles & permissions",
    description:
      "Edit role metadata and permissions, and create/delete custom roles",
  },
  {
    key: "config.view",
    group: "Config",
    label: "View infrastructure config",
    description:
      "View Lakebase Postgres health, Neon Auth status, media/mail config, and API endpoints",
  },
] as const;

export type PermissionDef = (typeof PERMISSIONS)[number];
export type PermissionKey = PermissionDef["key"];

export const ALL_PERMISSION_KEYS: readonly PermissionKey[] = PERMISSIONS.map(
  (p) => p.key,
);

export const PERMISSION_GROUPS: readonly string[] = [
  "Overview",
  "Catalog",
  "Inventory",
  "Users",
  "Roles",
  "Config",
];

const VALID_PERMISSION_SET = new Set<string>(ALL_PERMISSION_KEYS);

export type AdminRole = {
  slug: string;
  name: string;
  description: string;
  permissions: PermissionKey[];
  isSystem: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserRecord = {
  id: string;
  email: string;
  name: string | null;
  authRole: string;
  banned: boolean;
  banReason: string | null;
  activeSessions: number;
  rbacRole: string;
  rbacRoleName: string;
  permissions: PermissionKey[];
  createdAt: string;
};

/** Filters an arbitrary permission value to valid, deduplicated PermissionKey entries. */
export function normalizePermissions(raw: unknown): PermissionKey[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<PermissionKey>();
  const result: PermissionKey[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const key = item.trim();
    if (!VALID_PERMISSION_SET.has(key)) continue;
    const typed = key as PermissionKey;
    if (!seen.has(typed)) {
      seen.add(typed);
      result.push(typed);
    }
  }
  return result;
}

/** Checks whether the caller holds a specific permission (Super Admins always pass). */
export function hasPermission(
  permissions: readonly string[],
  required: PermissionKey,
  isSuperAdmin = false,
): boolean {
  if (isSuperAdmin) return true;
  return permissions.includes(required);
}

/** Checks whether the caller holds at least one of the listed permissions. */
export function hasAnyPermission(
  permissions: readonly string[],
  required: readonly PermissionKey[],
  isSuperAdmin = false,
): boolean {
  if (isSuperAdmin) return true;
  return required.some((perm) => permissions.includes(perm));
}
