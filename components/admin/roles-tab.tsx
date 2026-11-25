"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  ALL_PERMISSION_KEYS,
  type AdminRole,
  type AdminUserRecord,
  type PermissionKey,
  SYSTEM_ROLES,
} from "@/lib/rbac";

type ModuleRow = {
  id: string;
  title: string;
  subtitle: string;
  badgeColor: string;
  viewKey: PermissionKey;
  viewLabel: string;
  manageKey?: PermissionKey;
  manageLabel?: string;
};

const MODULE_ROWS: readonly ModuleRow[] = [
  {
    id: "overview",
    title: "Overview",
    subtitle: "Storefront KPIs, collections summary, and low-stock alerts",
    badgeColor: "bg-lime",
    viewKey: "overview.view",
    viewLabel: "View",
  },
  {
    id: "catalog",
    title: "Catalog",
    subtitle: "Storefront collections, slugs, sort order, and accent themes",
    badgeColor: "bg-pink",
    viewKey: "catalog.read",
    viewLabel: "View",
    manageKey: "catalog.write",
    manageLabel: "Manage",
  },
  {
    id: "inventory",
    title: "Inventory",
    subtitle: "Products, GBP pricing, stock quantities, publishing & Cloudinary images",
    badgeColor: "bg-teal",
    viewKey: "inventory.read",
    viewLabel: "View",
    manageKey: "inventory.write",
    manageLabel: "Manage",
  },
  {
    id: "users",
    title: "Users",
    subtitle: "Team directory, account provisioning, role assignment & suspension",
    badgeColor: "bg-sand",
    viewKey: "users.read",
    viewLabel: "View",
    manageKey: "users.write",
    manageLabel: "Manage",
  },
  {
    id: "roles",
    title: "Roles",
    subtitle: "Custom role creation, role metadata, and permission matrix access",
    badgeColor: "bg-cream",
    viewKey: "roles.read",
    viewLabel: "View",
    manageKey: "roles.write",
    manageLabel: "Manage",
  },
  {
    id: "config",
    title: "Config",
    subtitle: "Lakebase Postgres health, Neon Auth, Cloudinary, SMTP & API surface",
    badgeColor: "bg-white",
    viewKey: "config.view",
    viewLabel: "View",
  },
];

const READ_ONLY_KEYS: PermissionKey[] = [
  "overview.view",
  "catalog.read",
  "inventory.read",
  "users.read",
  "roles.read",
  "config.view",
];

const STORE_MANAGER_KEYS: PermissionKey[] = [
  "overview.view",
  "catalog.read",
  "catalog.write",
  "inventory.read",
  "inventory.write",
];

type RoleDraft = {
  name?: string;
  description?: string;
  permissions?: PermissionKey[];
};

function slugifyRole(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "");
}

function getInitials(name: string | null, email: string): string {
  const source = (name || email).trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function ToggleSwitch({
  checked,
  disabled,
  label,
  onToggle,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`group inline-flex items-center gap-2 rounded-full border-2 border-ink px-2.5 py-1 text-xs font-extrabold transition ${
        disabled ? "cursor-not-allowed opacity-75" : "cursor-pointer"
      } ${
        checked
          ? "bg-lime text-ink shadow-[2px_2px_0_var(--color-ink)]"
          : "bg-sand/70 text-ink/70 hover:bg-white"
      }`}
    >
      <span
        className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border border-ink transition-colors ${
          checked ? "bg-ink" : "bg-white"
        }`}
      >
        <span
          className={`inline-block size-2.5 rounded-full transition-transform ${
            checked ? "translate-x-3.5 bg-lime" : "translate-x-0.5 bg-ink/45"
          }`}
        />
      </span>
      <span>{label}</span>
    </button>
  );
}

function toggleModulePermission(
  current: PermissionKey[],
  mod: ModuleRow,
  kind: "view" | "manage",
): PermissionKey[] {
  const next = new Set<PermissionKey>(current);
  if (kind === "view") {
    if (next.has(mod.viewKey)) {
      next.delete(mod.viewKey);
      if (mod.manageKey) next.delete(mod.manageKey);
    } else {
      next.add(mod.viewKey);
    }
  } else if (mod.manageKey) {
    if (next.has(mod.manageKey)) {
      next.delete(mod.manageKey);
    } else {
      next.add(mod.manageKey);
      next.add(mod.viewKey);
    }
  }
  return ALL_PERMISSION_KEYS.filter((k) => next.has(k));
}

export default function RolesTab({
  roles,
  users,
  canWrite,
  onMutated,
  onFlash,
}: {
  roles: AdminRole[];
  users: AdminUserRecord[];
  canWrite: boolean;
  onMutated: () => Promise<void>;
  onFlash: (kind: "success" | "error", text: string) => void;
}) {
  const [selectedSlug, setSelectedSlug] = useState<string>(
    roles[0]?.slug ?? SYSTEM_ROLES.SUPER_ADMIN,
  );
  const [creatingMode, setCreatingMode] = useState(false);

  const [drafts, setDrafts] = useState<Record<string, RoleDraft>>({});
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [savingRoleSlug, setSavingRoleSlug] = useState<string | null>(null);
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(
    null,
  );
  const [deletingRoleSlug, setDeletingRoleSlug] = useState<string | null>(null);

  const [slugLocked, setSlugLocked] = useState(true);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createPermissions, setCreatePermissions] = useState<PermissionKey[]>(
    [],
  );
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const activeRole = useMemo(() => {
    return roles.find((r) => r.slug === selectedSlug) ?? roles[0] ?? null;
  }, [roles, selectedSlug]);

  const usersByRole = useMemo(() => {
    const map = new Map<string, AdminUserRecord[]>();
    for (const u of users) {
      const list = map.get(u.rbacRole) ?? [];
      list.push(u);
      map.set(u.rbacRole, list);
    }
    return map;
  }, [users]);

  function getDraft(role: AdminRole) {
    const entry = drafts[role.slug];
    return {
      name: entry?.name ?? role.name,
      description: entry?.description ?? role.description,
      permissions:
        role.slug === SYSTEM_ROLES.SUPER_ADMIN
          ? [...ALL_PERMISSION_KEYS]
          : (entry?.permissions ?? role.permissions),
    };
  }

  function hasRoleUnsavedChanges(role: AdminRole): boolean {
    if (role.slug === SYSTEM_ROLES.SUPER_ADMIN) return false;
    const draft = getDraft(role);
    const permDiff =
      draft.permissions.length !== role.permissions.length ||
      draft.permissions.some((p) => !role.permissions.includes(p));
    const metaDiff =
      (!role.isSystem && draft.name !== role.name) ||
      draft.description !== role.description;
    return permDiff || metaDiff;
  }

  function updateDraft(slug: string, patch: Partial<RoleDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [slug]: { ...(prev[slug] ?? {}), ...patch },
    }));
  }

  function resetDraft(slug: string) {
    setDrafts((prev) => {
      const copy = { ...prev };
      delete copy[slug];
      return copy;
    });
  }

  function openCreateMode() {
    setCreateError(null);
    setCreateName("");
    setCreateSlug("");
    setCreateDesc("");
    setCreatePermissions([]);
    setSlugLocked(true);
    setConfirmDeleteSlug(null);
    setCreatingMode(true);
  }

  function selectRole(slug: string) {
    setCreatingMode(false);
    setConfirmDeleteSlug(null);
    setDetailsExpanded(false);
    setSelectedSlug(slug);
  }

  async function handleSaveRole(role: AdminRole) {
    if (!canWrite || role.slug === SYSTEM_ROLES.SUPER_ADMIN) return;
    const draft = getDraft(role);
    setSavingRoleSlug(role.slug);

    try {
      const res = await fetch(
        `/api/admin/roles/${encodeURIComponent(role.slug)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(role.isSystem ? {} : { name: draft.name.trim() }),
            description: draft.description.trim(),
            permissions: draft.permissions,
          }),
        },
      );
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        role?: AdminRole;
      };
      if (!res.ok) {
        onFlash("error", json.error || `Failed to update "${role.name}".`);
        return;
      }

      resetDraft(role.slug);
      setDetailsExpanded(false);
      await onMutated();
      onFlash(
        "success",
        `Saved "${json.role?.name ?? draft.name}" (${draft.permissions.length}/${ALL_PERMISSION_KEYS.length} permissions active).`,
      );
    } catch {
      onFlash("error", "Network error saving role.");
    } finally {
      setSavingRoleSlug(null);
    }
  }

  async function handleCreateRole(e: FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setCreateError(null);
    setCreating(true);

    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          slug: createSlug.trim(),
          description: createDesc.trim(),
          permissions: createPermissions,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        role?: AdminRole;
      };
      if (!res.ok) {
        setCreateError(json.error || `Failed to create role (${res.status}).`);
        return;
      }

      const createdSlug = json.role?.slug ?? createSlug.trim();
      setCreatingMode(false);
      setSelectedSlug(createdSlug);
      await onMutated();
      onFlash("success", `Created role "${json.role?.name ?? createName}".`);
    } catch {
      setCreateError("Network error creating role.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteRole(role: AdminRole) {
    if (!canWrite || role.isSystem) return;
    setDeletingRoleSlug(role.slug);

    try {
      const res = await fetch(
        `/api/admin/roles/${encodeURIComponent(role.slug)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        onFlash("error", json.error || `Could not delete "${role.name}".`);
        setConfirmDeleteSlug(null);
        return;
      }

      setConfirmDeleteSlug(null);
      resetDraft(role.slug);
      setSelectedSlug(SYSTEM_ROLES.SUPER_ADMIN);
      await onMutated();
      onFlash("success", `Deleted custom role "${role.name}".`);
    } catch {
      onFlash("error", "Network error deleting role.");
    } finally {
      setDeletingRoleSlug(null);
    }
  }

  const activeDraft = activeRole ? getDraft(activeRole) : null;
  const isActiveSuperAdmin = activeRole?.slug === SYSTEM_ROLES.SUPER_ADMIN;
  const activeDirty = activeRole ? hasRoleUnsavedChanges(activeRole) : false;
  const activeMembers = activeRole
    ? (usersByRole.get(activeRole.slug) ?? [])
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[32px]">
            Roles &amp; permissions
          </h2>
          <p className="mt-1 text-sm text-ink/70">
            Select a role on the left to inspect members and toggle module
            permissions cleanly.
          </p>
        </div>

        {canWrite ? (
          <button
            type="button"
            onClick={() =>
              creatingMode ? setCreatingMode(false) : openCreateMode()
            }
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-lime px-5 text-sm font-bold text-ink shadow-[3px_3px_0_var(--color-ink)] transition hover:-translate-y-px"
          >
            {creatingMode ? "← Back to role inspector" : "+ New custom role"}
          </button>
        ) : (
          <span className="rounded-full border-2 border-ink bg-sand px-4 py-1.5 text-xs font-extrabold tracking-[0.06em] uppercase">
            Read-only
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[310px_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-3xl border-2 border-ink bg-white p-4 shadow-[5px_5px_0_var(--color-ink)]">
          <div className="flex items-center justify-between gap-2 border-b border-ink/15 px-1 pb-3">
            <span className="text-xs font-extrabold tracking-[0.08em] uppercase text-ink/65">
              Role directory
            </span>
            <span className="rounded-full border border-ink bg-sand px-2.5 py-0.5 text-[11px] font-extrabold">
              {roles.length} total
            </span>
          </div>

          <ul className="mt-3 space-y-2.5">
            {roles.map((role) => {
              const draft = getDraft(role);
              const isSelected = !creatingMode && activeRole?.slug === role.slug;
              const isDirty = hasRoleUnsavedChanges(role);
              const pct = Math.round(
                (draft.permissions.length / ALL_PERMISSION_KEYS.length) * 100,
              );

              return (
                <li key={role.slug}>
                  <button
                    type="button"
                    onClick={() => selectRole(role.slug)}
                    aria-current={isSelected ? "true" : undefined}
                    className={`w-full cursor-pointer rounded-2xl border-2 p-3.5 text-left transition ${
                      isSelected
                        ? "border-ink bg-ink text-cream shadow-[4px_4px_0_var(--color-lime)]"
                        : "border-ink/20 bg-cream/60 text-ink hover:border-ink hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-extrabold">
                            {role.name}
                          </span>
                          {isDirty && (
                            <span
                              title="Unsaved changes"
                              className="size-2 shrink-0 rounded-full bg-pink ring-2 ring-white"
                            />
                          )}
                        </div>
                        <code
                          className={`mt-0.5 block truncate text-[11px] ${
                            isSelected ? "text-cream/70" : "text-ink/55"
                          }`}
                        >
                          {role.slug}
                        </code>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                          isSelected
                            ? "border-lime bg-lime text-ink"
                            : role.isSystem
                              ? "border-ink/30 bg-sand text-ink"
                              : "border-ink/30 bg-teal/50 text-ink"
                        }`}
                      >
                        {role.slug === SYSTEM_ROLES.SUPER_ADMIN
                          ? "Locked"
                          : role.isSystem
                            ? "System"
                            : "Custom"}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <div
                        className={`flex items-center justify-between text-[11px] font-bold ${
                          isSelected ? "text-cream/85" : "text-ink/70"
                        }`}
                      >
                        <span>
                          {draft.permissions.length}/{ALL_PERMISSION_KEYS.length}{" "}
                          permissions
                        </span>
                        <span>
                          {role.userCount} user{role.userCount === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div
                        className={`h-1.5 overflow-hidden rounded-full ${
                          isSelected ? "bg-white/20" : "bg-ink/10"
                        }`}
                      >
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full transition-all ${
                            isSelected ? "bg-lime" : "bg-ink"
                          }`}
                        />
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {canWrite && creatingMode ? (
          <form
            onSubmit={handleCreateRole}
            className="space-y-6 rounded-3xl border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/15 pb-4">
              <div>
                <span className="inline-block rounded-full border border-ink bg-lime px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
                  New role
                </span>
                <h3 className="mt-1.5 text-xl font-extrabold">
                  Create custom admin role
                </h3>
              </div>

              <button
                type="button"
                disabled={creating}
                onClick={() => setCreatingMode(false)}
                className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-ink bg-white px-4 text-xs font-bold hover:bg-sand"
              >
                Cancel
              </button>
            </div>

            {createError && (
              <div
                role="alert"
                className="rounded-xl border-2 border-[#c8102e] bg-[#fff5f6] px-4 py-3 text-sm font-medium text-[#c8102e]"
              >
                {createError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold">
                Role name
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCreateName(val);
                    if (slugLocked) setCreateSlug(slugifyRole(val));
                  }}
                  placeholder="e.g. Merchandising Manager"
                  className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 text-sm font-medium"
                />
              </label>

              <label className="block text-sm font-bold">
                Role slug
                <input
                  type="text"
                  required
                  value={createSlug}
                  onChange={(e) => {
                    setSlugLocked(false);
                    setCreateSlug(e.target.value);
                  }}
                  placeholder="merchandising_manager"
                  className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 font-mono text-sm font-medium"
                />
              </label>
            </div>

            <label className="block text-sm font-bold">
              Description
              <input
                type="text"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="Brief note describing this role's responsibilities"
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 text-sm font-normal"
              />
            </label>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-extrabold">
                  Permissions ({createPermissions.length}/
                  {ALL_PERMISSION_KEYS.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCreatePermissions([...STORE_MANAGER_KEYS])}
                    className="cursor-pointer rounded-full border border-ink bg-cream px-3 py-1 text-xs font-bold hover:bg-lime"
                  >
                    Store manager preset
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatePermissions([...READ_ONLY_KEYS])}
                    className="cursor-pointer rounded-full border border-ink bg-cream px-3 py-1 text-xs font-bold hover:bg-lime"
                  >
                    Read-only preset
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatePermissions([...ALL_PERMISSION_KEYS])}
                    className="cursor-pointer rounded-full border border-ink bg-cream px-3 py-1 text-xs font-bold hover:bg-lime"
                  >
                    Full access
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatePermissions([])}
                    className="cursor-pointer rounded-full border border-ink bg-white px-3 py-1 text-xs font-bold hover:bg-sand"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="divide-y divide-ink/15 overflow-hidden rounded-2xl border-2 border-ink bg-cream/40">
                {MODULE_ROWS.map((mod) => {
                  const viewOn = createPermissions.includes(mod.viewKey);
                  const manageOn = mod.manageKey
                    ? createPermissions.includes(mod.manageKey)
                    : false;
                  return (
                    <div
                      key={mod.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
                    >
                      <div className="min-w-50 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-2.5 rounded-full border border-ink ${mod.badgeColor}`}
                          />
                          <p className="text-sm font-extrabold">{mod.title}</p>
                        </div>
                        <p className="mt-0.5 text-xs text-ink/65">
                          {mod.subtitle}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <ToggleSwitch
                          checked={viewOn}
                          disabled={false}
                          label={mod.viewLabel}
                          onToggle={() =>
                            setCreatePermissions((prev) =>
                              toggleModulePermission(prev, mod, "view"),
                            )
                          }
                        />
                        {mod.manageKey && (
                          <ToggleSwitch
                            checked={manageOn}
                            disabled={false}
                            label={mod.manageLabel ?? "Manage"}
                            onToggle={() =>
                              setCreatePermissions((prev) =>
                                toggleModulePermission(prev, mod, "manage"),
                              )
                            }
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-ink/15 pt-4">
              <button
                type="button"
                disabled={creating}
                onClick={() => setCreatingMode(false)}
                className="inline-flex h-10 cursor-pointer items-center rounded-full border-2 border-ink bg-white px-5 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex h-10 cursor-pointer items-center rounded-full bg-ink px-6 text-sm font-bold text-white disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create role"}
              </button>
            </div>
          </form>
        ) : activeRole && activeDraft ? (
          <div className="space-y-5">
            <section className="rounded-3xl border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-2xl font-extrabold tracking-[-0.02em]">
                      {activeRole.name}
                    </h3>
                    <code className="rounded-lg bg-sand px-2.5 py-0.5 text-xs font-bold text-ink/75">
                      {activeRole.slug}
                    </code>
                    {activeRole.isSystem && (
                      <span className="rounded-full border border-ink bg-cream px-2.5 py-0.5 text-[11px] font-extrabold uppercase">
                        System role
                      </span>
                    )}
                    {isActiveSuperAdmin && (
                      <span className="rounded-full border border-ink bg-lime px-2.5 py-0.5 text-[11px] font-extrabold uppercase">
                        All permissions locked
                      </span>
                    )}
                    {activeDirty && (
                      <span className="rounded-full border border-ink bg-pink px-2.5 py-0.5 text-[11px] font-extrabold uppercase">
                        Unsaved changes
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm leading-6 text-ink/75">
                    {activeDraft.description || "No role description set."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {canWrite && !isActiveSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => setDetailsExpanded((prev) => !prev)}
                      className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-ink bg-cream px-3.5 text-xs font-bold hover:bg-sand"
                    >
                      {detailsExpanded ? "Hide details" : "Edit details"}
                    </button>
                  )}
                  {canWrite &&
                    !activeRole.isSystem &&
                    (confirmDeleteSlug === activeRole.slug ? (
                      <button
                        type="button"
                        disabled={deletingRoleSlug === activeRole.slug}
                        onClick={() => handleDeleteRole(activeRole)}
                        className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-[#c8102e] bg-[#c8102e] px-3.5 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {deletingRoleSlug === activeRole.slug
                          ? "Deleting…"
                          : "Confirm delete"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteSlug(activeRole.slug)}
                        className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-ink/35 bg-white px-3.5 text-xs font-bold text-[#c8102e] hover:border-[#c8102e]"
                      >
                        Delete role
                      </button>
                    ))}
                </div>
              </div>

              {canWrite && !isActiveSuperAdmin && detailsExpanded && (
                <div className="mt-4 grid gap-3 rounded-2xl border-2 border-ink bg-sand/60 p-4 sm:grid-cols-2">
                  {!activeRole.isSystem && (
                    <label className="block text-xs font-bold text-ink">
                      Role name
                      <input
                        type="text"
                        value={activeDraft.name}
                        onChange={(e) =>
                          updateDraft(activeRole.slug, {
                            name: e.target.value,
                          })
                        }
                        className="mt-1 block h-10 w-full rounded-xl border-2 border-ink bg-white px-3 text-sm font-bold"
                      />
                    </label>
                  )}
                  <label
                    className={`block text-xs font-bold text-ink ${
                      activeRole.isSystem ? "sm:col-span-2" : ""
                    }`}
                  >
                    Description
                    <input
                      type="text"
                      value={activeDraft.description}
                      onChange={(e) =>
                        updateDraft(activeRole.slug, {
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe what this role can access…"
                      className="mt-1 block h-10 w-full rounded-xl border-2 border-ink bg-white px-3 text-sm font-normal"
                    />
                  </label>
                </div>
              )}

              <div className="mt-5 border-t border-ink/15 pt-4">
                <p className="text-[11px] font-extrabold tracking-[0.08em] uppercase text-ink/60">
                  Assigned team members ({activeMembers.length})
                </p>
                {activeMembers.length === 0 ? (
                  <p className="mt-2 text-xs text-ink/60">
                    No users are currently assigned to this role. Assign users
                    from the Users tab.
                  </p>
                ) : (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {activeMembers.map((member) => (
                      <div
                        key={member.id}
                        className="inline-flex items-center gap-2 rounded-full border border-ink bg-cream py-1 pr-3 pl-1.5 text-xs"
                      >
                        <span className="grid size-6 place-items-center rounded-full border border-ink bg-lime text-[10px] font-extrabold">
                          {getInitials(member.name, member.email)}
                        </span>
                        <span className="font-bold text-ink">
                          {member.name || member.email}
                        </span>
                        {member.banned && (
                          <span className="rounded-full bg-[#fff5f6] px-1.5 py-0.5 text-[10px] font-extrabold text-[#c8102e]">
                            Suspended
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/15 pb-4">
                <div>
                  <h4 className="text-base font-extrabold">
                    Module permissions ({activeDraft.permissions.length} /{" "}
                    {ALL_PERMISSION_KEYS.length})
                  </h4>
                  <p className="text-xs text-ink/65">
                    {isActiveSuperAdmin
                      ? "Super Admin retains full access across every module."
                      : "Enabling Manage automatically enables View for that module."}
                  </p>
                </div>

                {canWrite && !isActiveSuperAdmin && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={savingRoleSlug === activeRole.slug}
                      onClick={() =>
                        updateDraft(activeRole.slug, {
                          permissions: [...STORE_MANAGER_KEYS],
                        })
                      }
                      className="cursor-pointer rounded-full border border-ink bg-cream px-3 py-1 text-xs font-bold hover:bg-lime disabled:opacity-50"
                    >
                      Store preset
                    </button>
                    <button
                      type="button"
                      disabled={savingRoleSlug === activeRole.slug}
                      onClick={() =>
                        updateDraft(activeRole.slug, {
                          permissions: [...READ_ONLY_KEYS],
                        })
                      }
                      className="cursor-pointer rounded-full border border-ink bg-cream px-3 py-1 text-xs font-bold hover:bg-lime disabled:opacity-50"
                    >
                      Read-only
                    </button>
                    <button
                      type="button"
                      disabled={savingRoleSlug === activeRole.slug}
                      onClick={() =>
                        updateDraft(activeRole.slug, {
                          permissions: [...ALL_PERMISSION_KEYS],
                        })
                      }
                      className="cursor-pointer rounded-full border border-ink bg-cream px-3 py-1 text-xs font-bold hover:bg-lime disabled:opacity-50"
                    >
                      Full access
                    </button>
                    <button
                      type="button"
                      disabled={savingRoleSlug === activeRole.slug}
                      onClick={() =>
                        updateDraft(activeRole.slug, { permissions: [] })
                      }
                      className="cursor-pointer rounded-full border border-ink bg-white px-3 py-1 text-xs font-bold hover:bg-sand disabled:opacity-50"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 divide-y divide-ink/15 overflow-hidden rounded-2xl border-2 border-ink bg-cream/35">
                {MODULE_ROWS.map((mod) => {
                  const viewOn = activeDraft.permissions.includes(mod.viewKey);
                  const manageOn = mod.manageKey
                    ? activeDraft.permissions.includes(mod.manageKey)
                    : false;
                  const locked = isActiveSuperAdmin || !canWrite;

                  return (
                    <div
                      key={mod.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-white/75"
                    >
                      <div className="min-w-50 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-2.5 rounded-full border border-ink ${mod.badgeColor}`}
                          />
                          <p className="text-sm font-extrabold">{mod.title}</p>
                        </div>
                        <p className="mt-0.5 text-xs text-ink/65">
                          {mod.subtitle}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <ToggleSwitch
                          checked={viewOn}
                          disabled={locked}
                          label={mod.viewLabel}
                          onToggle={() =>
                            updateDraft(activeRole.slug, {
                              permissions: toggleModulePermission(
                                activeDraft.permissions,
                                mod,
                                "view",
                              ),
                            })
                          }
                        />
                        {mod.manageKey && (
                          <ToggleSwitch
                            checked={manageOn}
                            disabled={locked}
                            label={mod.manageLabel ?? "Manage"}
                            onToggle={() =>
                              updateDraft(activeRole.slug, {
                                permissions: toggleModulePermission(
                                  activeDraft.permissions,
                                  mod,
                                  "manage",
                                ),
                              })
                            }
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {canWrite && !isActiveSuperAdmin && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/15 pt-4">
                  <p className="text-xs font-semibold text-ink/65">
                    {activeDirty
                      ? "You have unsaved changes for this role."
                      : "All changes are synced with Lakebase Postgres."}
                  </p>

                  <div className="flex items-center gap-2.5">
                    {activeDirty && (
                      <button
                        type="button"
                        disabled={savingRoleSlug === activeRole.slug}
                        onClick={() => resetDraft(activeRole.slug)}
                        className="inline-flex h-10 cursor-pointer items-center rounded-full border-2 border-ink bg-white px-4 text-xs font-bold hover:bg-sand"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={
                        savingRoleSlug === activeRole.slug || !activeDirty
                      }
                      onClick={() => handleSaveRole(activeRole)}
                      className="inline-flex h-10 cursor-pointer items-center rounded-full bg-ink px-6 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {savingRoleSlug === activeRole.slug
                        ? "Saving…"
                        : "Save changes"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-ink bg-white p-8 text-center text-sm text-ink/65">
            No roles available.
          </div>
        )}
      </div>
    </div>
  );
}
