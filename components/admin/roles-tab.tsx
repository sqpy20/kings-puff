"use client";

import { type FormEvent, useState } from "react";
import type { AdminUser } from "@/lib/auth/admin";
import {
  ALL_PERMISSION_KEYS,
  type AdminRole,
  type AdminUserRecord,
  PERMISSIONS,
  PERMISSION_GROUPS,
  type PermissionKey,
  SYSTEM_ROLES,
} from "@/lib/rbac";

function slugifyRole(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "");
}

export default function RolesTab({
  currentUser,
  roles,
  users,
  canWrite,
  onMutated,
  onFlash,
}: {
  currentUser: AdminUser;
  roles: AdminRole[];
  users: AdminUserRecord[];
  canWrite: boolean;
  onMutated: () => Promise<void>;
  onFlash: (kind: "success" | "error", text: string) => void;
}) {
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

  const [roleDrafts, setRoleDrafts] = useState<Record<string, PermissionKey[]>>(
    {},
  );
  const [savingRoleSlug, setSavingRoleSlug] = useState<string | null>(null);
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(
    null,
  );
  const [deletingRoleSlug, setDeletingRoleSlug] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [slugLocked, setSlugLocked] = useState(true);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createPermissions, setCreatePermissions] = useState<PermissionKey[]>(
    [],
  );
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleAssignUser(user: AdminUserRecord) {
    const nextRole = selectedRoles[user.id] ?? user.rbacRole;
    if (!nextRole || nextRole === user.rbacRole) return;

    setAssigningUserId(user.id);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(user.id)}/role`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleSlug: nextRole }),
        },
      );
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        user?: AdminUserRecord;
      };
      if (!res.ok) {
        onFlash("error", json.error || `Failed to assign role (${res.status}).`);
        return;
      }

      setSelectedRoles((prev) => {
        const copy = { ...prev };
        delete copy[user.id];
        return copy;
      });
      await onMutated();
      onFlash(
        "success",
        `Updated ${user.email} to ${json.user?.rbacRoleName ?? nextRole}.`,
      );
    } catch {
      onFlash("error", "Network error assigning user role.");
    } finally {
      setAssigningUserId(null);
    }
  }

  function getDraftPermissions(role: AdminRole): PermissionKey[] {
    if (role.slug === SYSTEM_ROLES.SUPER_ADMIN) {
      return [...ALL_PERMISSION_KEYS];
    }
    return roleDrafts[role.slug] ?? role.permissions;
  }

  function toggleRolePermission(role: AdminRole, key: PermissionKey) {
    if (!canWrite || role.slug === SYSTEM_ROLES.SUPER_ADMIN) return;
    const current = getDraftPermissions(role);
    const exists = current.includes(key);
    const next = exists
      ? current.filter((item) => item !== key)
      : [...current, key];
    setRoleDrafts((prev) => ({ ...prev, [role.slug]: next }));
  }

  function setAllRolePermissions(role: AdminRole, keys: PermissionKey[]) {
    if (!canWrite || role.slug === SYSTEM_ROLES.SUPER_ADMIN) return;
    setRoleDrafts((prev) => ({ ...prev, [role.slug]: keys }));
  }

  async function handleSaveRolePermissions(role: AdminRole) {
    if (!canWrite || role.slug === SYSTEM_ROLES.SUPER_ADMIN) return;
    const permissions = getDraftPermissions(role);
    setSavingRoleSlug(role.slug);

    try {
      const res = await fetch(
        `/api/admin/roles/${encodeURIComponent(role.slug)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions }),
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

      setRoleDrafts((prev) => {
        const copy = { ...prev };
        delete copy[role.slug];
        return copy;
      });
      await onMutated();
      onFlash(
        "success",
        `Saved ${permissions.length} permission(s) for "${json.role?.name ?? role.name}".`,
      );
    } catch {
      onFlash("error", "Network error saving role permissions.");
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

      setCreateOpen(false);
      setCreateName("");
      setCreateSlug("");
      setCreateDesc("");
      setCreatePermissions([]);
      setSlugLocked(true);
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
      await onMutated();
      onFlash("success", `Deleted custom role "${role.name}".`);
    } catch {
      onFlash("error", "Network error deleting role.");
    } finally {
      setDeletingRoleSlug(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[32px]">
            Roles &amp; access control
          </h2>
          <p className="mt-1 text-sm text-ink/70">
            Configure granular module permissions per role and assign roles to
            team accounts stored in Lakebase Postgres.
          </p>
        </div>

        {canWrite ? (
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setCreateOpen((prev) => !prev);
            }}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-lime px-5 text-sm font-bold text-ink shadow-[3px_3px_0_var(--color-ink)] transition hover:translate-y-[-1px]"
          >
            {createOpen ? "Close role form" : "+ New custom role"}
          </button>
        ) : (
          <span className="rounded-full border-2 border-ink bg-sand px-4 py-1.5 text-xs font-extrabold tracking-[0.06em] uppercase">
            Read-only access
          </span>
        )}
      </div>

      {canWrite && createOpen && (
        <form
          onSubmit={handleCreateRole}
          className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]"
        >
          <h3 className="border-b border-ink/15 pb-3 text-lg font-extrabold">
            Create custom admin role
          </h3>

          {createError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border-2 border-[#c8102e] bg-[#fff5f6] px-4 py-3 text-sm font-medium text-[#c8102e]"
            >
              {createError}
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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

          <label className="mt-4 block text-sm font-bold">
            Description
            <input
              type="text"
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              placeholder="Optional summary of responsibilities"
              className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 text-sm font-normal"
            />
          </label>

          <div className="mt-5">
            <p className="text-sm font-bold">Initial permissions</p>
            <div className="mt-2.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PERMISSION_GROUPS.map((group) => (
                <div
                  key={group}
                  className="rounded-2xl border border-ink/20 bg-cream/60 p-3.5"
                >
                  <p className="text-xs font-extrabold tracking-[0.08em] uppercase text-ink/70">
                    {group}
                  </p>
                  <div className="mt-2 space-y-2">
                    {PERMISSIONS.filter((p) => p.group === group).map((perm) => {
                      const checked = createPermissions.includes(perm.key);
                      return (
                        <label
                          key={perm.key}
                          className="flex cursor-pointer items-start gap-2 text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setCreatePermissions((prev) =>
                                checked
                                  ? prev.filter((k) => k !== perm.key)
                                  : [...prev, perm.key],
                              )
                            }
                            className="mt-0.5 size-4 accent-ink"
                          />
                          <span>
                            <span className="block font-bold text-ink">
                              {perm.label}
                            </span>
                            <span className="block text-[11px] text-ink/65">
                              {perm.description}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-ink/15 pt-4">
            <button
              type="button"
              disabled={creating}
              onClick={() => setCreateOpen(false)}
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
      )}

      <section className="rounded-[24px] border-2 border-ink bg-white p-5 shadow-[5px_5px_0_var(--color-ink)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/15 pb-4">
          <div>
            <h3 className="text-lg font-extrabold">Team members &amp; roles</h3>
            <p className="text-xs text-ink/65">
              Registered Neon Auth accounts mapped to RBAC roles.
            </p>
          </div>
          <span className="rounded-full border border-ink bg-sand px-3 py-0.5 text-xs font-extrabold">
            {users.length} account{users.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink text-xs font-extrabold tracking-[0.08em] uppercase text-ink/65">
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">Current RBAC role</th>
                <th className="py-3 pr-4">Active permissions</th>
                {canWrite && <th className="py-3 text-right">Assign role</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/15">
              {users.map((u) => {
                const isSelf = u.id === currentUser.id;
                const isSelfSuperAdmin =
                  isSelf && u.rbacRole === SYSTEM_ROLES.SUPER_ADMIN;
                const draftRole = selectedRoles[u.id] ?? u.rbacRole;
                const changed = draftRole !== u.rbacRole;
                const isAssigning = assigningUserId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-cream/50">
                    <td className="py-3.5 pr-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-ink">
                          {u.name || u.email}
                        </span>
                        {isSelf && (
                          <span className="rounded-full border border-ink bg-lime px-2 py-0.5 text-[10px] font-extrabold uppercase">
                            You
                          </span>
                        )}
                        {u.banned && (
                          <span className="rounded-full border border-[#c8102e] bg-[#fff5f6] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#c8102e]">
                            Banned
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink/65">{u.email}</p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`inline-flex rounded-full border border-ink px-3 py-0.5 text-xs font-extrabold ${
                          u.rbacRole === SYSTEM_ROLES.SUPER_ADMIN
                            ? "bg-lime text-ink"
                            : u.permissions.length > 0
                              ? "bg-teal text-ink"
                              : "bg-sand text-ink"
                        }`}
                      >
                        {u.rbacRoleName}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-xs font-semibold text-ink/75">
                      {u.permissions.length} of {ALL_PERMISSION_KEYS.length}{" "}
                      permissions
                    </td>
                    {canWrite && (
                      <td className="py-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <select
                            aria-label={`Select role for ${u.email}`}
                            disabled={isSelfSuperAdmin || isAssigning}
                            value={draftRole}
                            onChange={(e) =>
                              setSelectedRoles((prev) => ({
                                ...prev,
                                [u.id]: e.target.value,
                              }))
                            }
                            className="h-9 rounded-xl border-2 border-ink bg-white px-2.5 text-xs font-bold disabled:opacity-60"
                          >
                            {roles.map((r) => (
                              <option key={r.slug} value={r.slug}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={
                              !changed || isSelfSuperAdmin || isAssigning
                            }
                            onClick={() => handleAssignUser(u)}
                            className="inline-flex h-9 cursor-pointer items-center rounded-full bg-ink px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {isAssigning ? "Saving…" : "Assign"}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={canWrite ? 4 : 3}
                    className="py-6 text-center text-ink/60"
                  >
                    No team accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h3 className="text-xl font-extrabold tracking-[-0.02em]">
            Role permission matrix
          </h3>
          <p className="text-xs text-ink/65">
            Grant or revoke module access per role. Changes apply immediately on
            the user&apos;s next request.
          </p>
        </div>

        <div className="space-y-5">
          {roles.map((role) => {
            const isSuperAdmin = role.slug === SYSTEM_ROLES.SUPER_ADMIN;
            const draft = getDraftPermissions(role);
            const hasChanges =
              draft.length !== role.permissions.length ||
              draft.some((p) => !role.permissions.includes(p));
            const isSaving = savingRoleSlug === role.slug;
            const isDeleting = deletingRoleSlug === role.slug;

            return (
              <article
                key={role.slug}
                className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/15 pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-extrabold">{role.name}</h4>
                      <code className="rounded-md bg-sand px-2 py-0.5 text-xs font-bold text-ink/75">
                        {role.slug}
                      </code>
                      {role.isSystem && (
                        <span className="rounded-full border border-ink bg-cream px-2.5 py-0.5 text-[11px] font-extrabold uppercase">
                          System
                        </span>
                      )}
                      {isSuperAdmin && (
                        <span className="rounded-full border border-ink bg-lime px-2.5 py-0.5 text-[11px] font-extrabold uppercase">
                          All permissions locked
                        </span>
                      )}
                    </div>
                    {role.description && (
                      <p className="mt-1.5 text-sm text-ink/75">
                        {role.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-ink/30 bg-cream px-3 py-1 text-xs font-bold">
                      {role.userCount} user{role.userCount === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full border border-ink bg-teal/50 px-3 py-1 text-xs font-extrabold">
                      {draft.length} / {ALL_PERMISSION_KEYS.length} enabled
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {PERMISSION_GROUPS.map((group) => (
                    <div
                      key={group}
                      className="rounded-2xl border border-ink/15 bg-cream/60 p-4"
                    >
                      <p className="text-xs font-extrabold tracking-[0.08em] uppercase text-ink/70">
                        {group}
                      </p>
                      <div className="mt-2.5 space-y-2.5">
                        {PERMISSIONS.filter((p) => p.group === group).map(
                          (perm) => {
                            const checked = draft.includes(perm.key);
                            const disabled = isSuperAdmin || !canWrite;
                            return (
                              <label
                                key={perm.key}
                                className={`flex items-start gap-2.5 text-xs ${
                                  disabled
                                    ? "cursor-not-allowed opacity-80"
                                    : "cursor-pointer"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={disabled}
                                  checked={checked}
                                  onChange={() =>
                                    toggleRolePermission(role, perm.key)
                                  }
                                  className="mt-0.5 size-4 accent-ink"
                                />
                                <span>
                                  <span className="block font-bold text-ink">
                                    {perm.label}
                                  </span>
                                  <span className="block text-[11px] text-ink/65">
                                    {perm.description}
                                  </span>
                                </span>
                              </label>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {canWrite && !isSuperAdmin && (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/15 pt-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() =>
                          setAllRolePermissions(role, [...ALL_PERMISSION_KEYS])
                        }
                        className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-ink bg-cream px-3.5 text-xs font-bold hover:bg-lime disabled:opacity-50"
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => setAllRolePermissions(role, [])}
                        className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-ink bg-white px-3.5 text-xs font-bold hover:bg-sand disabled:opacity-50"
                      >
                        Clear all
                      </button>
                      {!role.isSystem &&
                        (confirmDeleteSlug === role.slug ? (
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDeleteRole(role)}
                            className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-[#c8102e] bg-[#c8102e] px-3.5 text-xs font-bold text-white disabled:opacity-60"
                          >
                            {isDeleting ? "Deleting…" : "Confirm delete role"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteSlug(role.slug)}
                            className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-ink/35 bg-white px-3.5 text-xs font-bold text-[#c8102e] hover:border-[#c8102e]"
                          >
                            Delete role
                          </button>
                        ))}
                    </div>

                    <button
                      type="button"
                      disabled={isSaving || !hasChanges}
                      onClick={() => handleSaveRolePermissions(role)}
                      className="inline-flex h-10 cursor-pointer items-center rounded-full bg-ink px-5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {isSaving ? "Saving…" : "Save permissions"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
