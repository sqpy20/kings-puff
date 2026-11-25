"use client";

import { type FormEvent, useState } from "react";
import {
  ALL_PERMISSION_KEYS,
  type AdminRole,
  type AdminUserRecord,
  PERMISSIONS,
  PERMISSION_GROUPS,
  type PermissionKey,
  SYSTEM_ROLES,
} from "@/lib/rbac";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function RoleCard({
  role,
  canWrite,
  onMutated,
  onFlash,
}: {
  role: AdminRole;
  canWrite: boolean;
  onMutated: () => Promise<void>;
  onFlash: (kind: "success" | "error", text: string) => void;
}) {
  const isSuper = role.slug === SYSTEM_ROLES.SUPER_ADMIN;
  const [draftPermissions, setDraftPermissions] = useState<
    PermissionKey[] | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selected = isSuper
    ? [...ALL_PERMISSION_KEYS]
    : (draftPermissions ?? role.permissions);

  const dirty =
    !isSuper &&
    draftPermissions !== null &&
    (draftPermissions.length !== role.permissions.length ||
      draftPermissions.some((p) => !role.permissions.includes(p)));

  function togglePerm(key: PermissionKey) {
    if (!canWrite || isSuper) return;
    setDraftPermissions((prev) => {
      const base = prev ?? role.permissions;
      return base.includes(key)
        ? base.filter((k) => k !== key)
        : [...base, key];
    });
  }

  async function handleSave() {
    if (!canWrite || isSuper) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/roles/${encodeURIComponent(role.slug)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: selected }),
        },
      );
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        onFlash("error", json.error || `Failed to update "${role.name}".`);
        return;
      }
      setDraftPermissions(null);
      await onMutated();
      onFlash("success", `Saved permissions for role "${role.name}".`);
    } catch {
      onFlash("error", "Network error saving role permissions.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!canWrite || role.isSystem) return;
    setDeleting(true);
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
        onFlash("error", json.error || `Failed to delete "${role.name}".`);
        setConfirmDelete(false);
        return;
      }
      setConfirmDelete(false);
      await onMutated();
      onFlash("success", `Deleted custom role "${role.name}".`);
    } catch {
      onFlash("error", "Network error deleting role.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/15 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-extrabold">{role.name}</h4>
            <code className="rounded-md bg-sand px-2 py-0.5 text-xs font-bold">
              {role.slug}
            </code>
            {role.isSystem && (
              <span
                className={`rounded-full border border-ink px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${
                  isSuper ? "bg-lime text-ink" : "bg-cream text-ink"
                }`}
              >
                {isSuper ? "System · Full Access" : "System Role"}
              </span>
            )}
            <span className="rounded-full border border-ink/25 bg-sand px-2.5 py-0.5 text-[11px] font-bold">
              {role.userCount} user{role.userCount === 1 ? "" : "s"}
            </span>
          </div>
          {role.description && (
            <p className="mt-1.5 text-sm text-ink/70">{role.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canWrite && !isSuper && (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => setDraftPermissions([...ALL_PERMISSION_KEYS])}
                className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-ink bg-white px-3 text-xs font-bold hover:bg-sand disabled:opacity-50"
              >
                Select all
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setDraftPermissions([])}
                className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-ink bg-white px-3 text-xs font-bold hover:bg-sand disabled:opacity-50"
              >
                Clear all
              </button>
              <button
                type="button"
                disabled={saving || !dirty}
                onClick={handleSave}
                className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-ink bg-lime px-4 text-xs font-extrabold text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save permissions"}
              </button>
            </>
          )}
          {canWrite && !role.isSystem &&
            (confirmDelete ? (
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-[#c8102e] bg-[#c8102e] px-3 text-xs font-bold text-white disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Confirm delete"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-ink/40 bg-white px-3 text-xs font-bold text-[#c8102e] hover:border-[#c8102e]"
              >
                Delete
              </button>
            ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PERMISSION_GROUPS.map((group) => {
          const groupPerms = PERMISSIONS.filter((p) => p.group === group);
          return (
            <div
              key={group}
              className="rounded-2xl border border-ink/20 bg-cream/55 p-3.5"
            >
              <p className="text-xs font-extrabold tracking-[0.08em] uppercase text-ink/70">
                {group}
              </p>
              <div className="mt-2.5 space-y-2.5">
                {groupPerms.map((perm) => {
                  const checked = isSuper || selected.includes(perm.key);
                  return (
                    <label
                      key={perm.key}
                      className={`flex items-start gap-2.5 text-sm ${
                        !canWrite || isSuper ? "cursor-default" : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canWrite || isSuper || saving}
                        onChange={() => togglePerm(perm.key)}
                        className="mt-0.5 size-4 shrink-0 accent-ink"
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-extrabold text-ink">
                          {perm.label}{" "}
                          <code className="font-normal text-ink/55">
                            ({perm.key})
                          </code>
                        </span>
                        <span className="block text-[11px] leading-4 text-ink/65">
                          {perm.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default function RolesTab({
  roles,
  users,
  currentUserId,
  canWrite,
  onMutated,
  onFlash,
}: {
  roles: AdminRole[];
  users: AdminUserRecord[];
  currentUserId: string;
  canWrite: boolean;
  onMutated: () => Promise<void>;
  onFlash: (kind: "success" | "error", text: string) => void;
}) {
  const [roleOverrides, setRoleOverrides] = useState<Record<string, string>>(
    {},
  );
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

  const [newRoleOpen, setNewRoleOpen] = useState(false);
  const [slugLockedToName, setSlugLockedToName] = useState(true);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPermissions, setNewPermissions] = useState<PermissionKey[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleAssignRole(targetUser: AdminUserRecord) {
    if (!canWrite) return;
    const roleSlug = roleOverrides[targetUser.id] ?? targetUser.rbacRole;
    setAssigningUserId(targetUser.id);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(targetUser.id)}/role`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleSlug }),
        },
      );
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        onFlash("error", json.error || "Could not update user role.");
        return;
      }
      setRoleOverrides((prev) => {
        const next = { ...prev };
        delete next[targetUser.id];
        return next;
      });
      await onMutated();
      onFlash(
        "success",
        `Updated role for ${targetUser.email} to "${roleSlug}".`,
      );
    } catch {
      onFlash("error", "Network error updating user role.");
    } finally {
      setAssigningUserId(null);
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
          slug: newSlug.trim(),
          name: newName.trim(),
          description: newDescription.trim(),
          permissions: newPermissions,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        role?: AdminRole;
      };
      if (!res.ok) {
        setCreateError(json.error || `Request failed (${res.status}).`);
        return;
      }
      setNewRoleOpen(false);
      setNewName("");
      setNewSlug("");
      setNewDescription("");
      setNewPermissions([]);
      setSlugLockedToName(true);
      await onMutated();
      onFlash("success", `Created role "${json.role?.name ?? newName}".`);
    } catch {
      setCreateError("Network error creating role.");
    } finally {
      setCreating(false);
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
            Configure role permission matrices and assign roles to admin team
            accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!canWrite && (
            <span className="rounded-full border-2 border-ink bg-sand px-3.5 py-1 text-xs font-extrabold uppercase">
              Read-only
            </span>
          )}
          {canWrite && (
            <button
              type="button"
              onClick={() => {
                setCreateError(null);
                setNewRoleOpen((prev) => !prev);
              }}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-lime px-5 text-sm font-bold text-ink shadow-[3px_3px_0_var(--color-ink)] transition hover:translate-y-[-1px]"
            >
              {newRoleOpen ? "Close editor" : "+ New role"}
            </button>
          )}
        </div>
      </div>

      {canWrite && newRoleOpen && (
        <form
          onSubmit={handleCreateRole}
          className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]"
        >
          <h3 className="border-b border-ink/15 pb-3 text-lg font-extrabold">
            Create custom role
          </h3>

          {createError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border-2 border-[#c8102e] bg-[#fff5f6] px-4 py-3 text-sm font-medium text-[#c8102e]"
            >
              {createError}
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm font-bold">
              Role name
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewName(val);
                  if (slugLockedToName) setNewSlug(slugify(val));
                }}
                placeholder="e.g. Merchandiser"
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 text-sm font-medium"
              />
            </label>

            <label className="block text-sm font-bold">
              Role slug
              <input
                type="text"
                required
                value={newSlug}
                onChange={(e) => {
                  setSlugLockedToName(false);
                  setNewSlug(e.target.value);
                }}
                placeholder="merchandiser"
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 font-mono text-sm font-medium"
              />
            </label>

            <label className="block text-sm font-bold sm:col-span-2 lg:col-span-1">
              Description
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Catalog & inventory editing access"
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 text-sm font-normal"
              />
            </label>
          </div>

          <div className="mt-4">
            <p className="text-sm font-bold">Initial permissions</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PERMISSIONS.map((perm) => {
                const checked = newPermissions.includes(perm.key);
                return (
                  <label
                    key={perm.key}
                    className="flex cursor-pointer items-start gap-2 rounded-xl border border-ink/20 bg-cream/50 p-2.5 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setNewPermissions((prev) =>
                          prev.includes(perm.key)
                            ? prev.filter((k) => k !== perm.key)
                            : [...prev, perm.key],
                        )
                      }
                      className="mt-0.5 size-4 shrink-0 accent-ink"
                    />
                    <span>
                      <span className="block font-extrabold">{perm.label}</span>
                      <span className="text-ink/60">{perm.key}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3 border-t border-ink/15 pt-4">
            <button
              type="button"
              disabled={creating}
              onClick={() => setNewRoleOpen(false)}
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
        <h3 className="text-lg font-extrabold">Team members &amp; roles</h3>
        <p className="mt-1 text-sm text-ink/70">
          Assign any team member to <strong>Super Admin</strong>,{" "}
          <strong>Admin</strong>, or a custom role. Changes apply immediately on
          their next request.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink text-xs font-extrabold tracking-[0.08em] uppercase text-ink/65">
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">Current Role</th>
                <th className="py-3 pr-4">Granted Permissions</th>
                <th className="py-3 text-right">Role Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/15">
              {users.map((u) => {
                const draft = roleOverrides[u.id] ?? u.rbacRole;
                const changed = draft !== u.rbacRole;
                const isSelfSuperAdmin =
                  u.id === currentUserId &&
                  u.rbacRole === SYSTEM_ROLES.SUPER_ADMIN;
                const isAssigning = assigningUserId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-cream/50">
                    <td className="py-3.5 pr-4">
                      <p className="font-extrabold text-ink">
                        {u.name || u.email}
                        {u.id === currentUserId && (
                          <span className="ml-2 rounded-full border border-ink bg-lime px-2 py-0.5 text-[10px] font-extrabold uppercase">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-ink/65">{u.email}</p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`inline-flex rounded-full border border-ink px-3 py-0.5 text-xs font-bold ${
                          u.rbacRole === SYSTEM_ROLES.SUPER_ADMIN
                            ? "bg-lime text-ink"
                            : "bg-sand text-ink"
                        }`}
                      >
                        {u.rbacRoleName}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-xs font-semibold text-ink/75">
                      {u.rbacRole === SYSTEM_ROLES.SUPER_ADMIN
                        ? `All (${ALL_PERMISSION_KEYS.length}/${ALL_PERMISSION_KEYS.length})`
                        : u.permissions.length === 0
                          ? "None (0 permissions)"
                          : `${u.permissions.length} permission${u.permissions.length === 1 ? "" : "s"}`}
                    </td>
                    <td className="py-3.5 text-right">
                      {canWrite ? (
                        <div className="inline-flex items-center justify-end gap-2">
                          <select
                            aria-label={`Role for ${u.email}`}
                            disabled={isAssigning || isSelfSuperAdmin}
                            value={draft}
                            onChange={(e) =>
                              setRoleOverrides((prev) => ({
                                ...prev,
                                [u.id]: e.target.value,
                              }))
                            }
                            className="h-9 rounded-xl border-2 border-ink bg-cream/50 px-3 text-xs font-bold disabled:opacity-60"
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
                              isAssigning || !changed || isSelfSuperAdmin
                            }
                            onClick={() => handleAssignRole(u)}
                            className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-ink bg-ink px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {isAssigning ? "Saving…" : "Assign"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-ink/60">
                          {u.rbacRoleName}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-ink/60">
                    No Neon Auth users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-extrabold tracking-[-0.02em]">
          Roles &amp; permission matrix
        </h3>
        <div className="space-y-5">
          {roles.map((role) => (
            <RoleCard
              key={role.slug}
              role={role}
              canWrite={canWrite}
              onMutated={onMutated}
              onFlash={onFlash}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
