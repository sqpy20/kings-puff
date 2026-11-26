"use client";

import { type FormEvent, useMemo, useState } from "react";
import Pagination, { paginateItems } from "@/components/pagination";
import type { AdminUser } from "@/lib/auth/admin";
import {
  ALL_PERMISSION_KEYS,
  type AdminRole,
  type AdminUserRecord,
  SYSTEM_ROLES,
} from "@/lib/rbac";

function generateStrongPassword(): string {
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const digits = "23456789";
  const symbols = "!@#$%&*";
  const all = `${lower}${upper}${digits}${symbols}`;
  const bytes = new Uint32Array(14);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 100_000);
    }
  }
  const chars = [
    lower[bytes[0] % lower.length],
    upper[bytes[1] % upper.length],
    digits[bytes[2] % digits.length],
    symbols[bytes[3] % symbols.length],
  ];
  for (let i = 4; i < bytes.length; i += 1) {
    chars.push(all[bytes[i] % all.length]);
  }
  return chars.join("");
}

export default function UsersTab({
  currentUser,
  users,
  roles,
  canWrite,
  onMutated,
  onFlash,
}: {
  currentUser: AdminUser;
  users: AdminUserRecord[];
  roles: AdminRole[];
  canWrite: boolean;
  onMutated: () => Promise<void>;
  onFlash: (kind: "success" | "error", text: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [createRoleSlug, setCreateRoleSlug] = useState<string>(
    SYSTEM_ROLES.ADMIN,
  );
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editRoleSlug, setEditRoleSlug] = useState<string>(SYSTEM_ROLES.ADMIN);
  const [editBanned, setEditBanned] = useState(false);
  const [editBanReason, setEditBanReason] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const active = users.filter((u) => !u.banned).length;
    const suspended = users.filter((u) => u.banned).length;
    const superAdmins = users.filter(
      (u) => u.rbacRole === SYSTEM_ROLES.SUPER_ADMIN && !u.banned,
    ).length;
    return { total: users.length, active, suspended, superAdmins };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.rbacRole !== roleFilter) return false;
      if (statusFilter === "active" && u.banned) return false;
      if (statusFilter === "banned" && !u.banned) return false;
      if (q) {
        const hay = `${u.name ?? ""} ${u.email} ${u.rbacRoleName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const { items: paginatedUsers, safePage } = paginateItems(
    filteredUsers,
    page,
    pageSize,
  );

  function openCreateForm() {
    setCreateError(null);
    setEditingUser(null);
    setCreateName("");
    setCreateEmail("");
    setCreatePassword("");
    setShowPassword(false);
    setCreateRoleSlug(
      roles.some((r) => r.slug === SYSTEM_ROLES.ADMIN)
        ? SYSTEM_ROLES.ADMIN
        : (roles[0]?.slug ?? SYSTEM_ROLES.ADMIN),
    );
    setCreateOpen((prev) => !prev);
  }

  function openEditUser(user: AdminUserRecord) {
    setCreateOpen(false);
    setEditError(null);
    setEditingUser(user);
    setEditName(user.name ?? "");
    setEditRoleSlug(user.rbacRole);
    setEditBanned(user.banned);
    setEditBanReason(user.banReason ?? "");
  }

  async function handleCreateUser(e: FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setCreateError(null);
    setCreating(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          email: createEmail.trim(),
          password: createPassword,
          roleSlug: createRoleSlug,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        user?: AdminUserRecord;
      };

      if (!res.ok) {
        setCreateError(json.error || `Failed to create user (${res.status}).`);
        return;
      }

      setCreateOpen(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      await onMutated();
      onFlash(
        "success",
        `Created account for ${json.user?.email ?? createEmail} (${json.user?.rbacRoleName ?? createRoleSlug}).`,
      );
    } catch {
      setCreateError("Network error creating user.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!canWrite || !editingUser) return;
    setEditError(null);
    setSavingEdit(true);

    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(editingUser.id)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editName.trim(),
            roleSlug: editRoleSlug,
            banned: editBanned,
            banReason: editBanned ? editBanReason.trim() || null : null,
          }),
        },
      );
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        user?: AdminUserRecord;
      };
      if (!res.ok) {
        setEditError(json.error || `Failed to update user (${res.status}).`);
        return;
      }

      setEditingUser(null);
      await onMutated();
      onFlash("success", `Updated ${json.user?.email ?? editingUser.email}.`);
    } catch {
      setEditError("Network error updating user.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleToggleBan(user: AdminUserRecord) {
    if (!canWrite || user.id === currentUser.id) return;
    setBusyUserId(user.id);

    try {
      const nextBanned = !user.banned;
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(user.id)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            banned: nextBanned,
            banReason: nextBanned ? "Suspended by administrator" : null,
          }),
        },
      );
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        onFlash(
          "error",
          json.error || `Failed to update status for ${user.email}.`,
        );
        return;
      }

      await onMutated();
      onFlash(
        "success",
        nextBanned
          ? `Suspended ${user.email} and revoked active sessions.`
          : `Reactivated ${user.email}.`,
      );
    } catch {
      onFlash("error", "Network error updating user status.");
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleDeleteUser(user: AdminUserRecord) {
    if (!canWrite || user.id === currentUser.id) return;
    setBusyUserId(user.id);

    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(user.id)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        onFlash("error", json.error || `Could not delete ${user.email}.`);
        setConfirmDeleteId(null);
        return;
      }

      setConfirmDeleteId(null);
      if (editingUser?.id === user.id) setEditingUser(null);
      await onMutated();
      onFlash("success", `Deleted user ${user.email}.`);
    } catch {
      onFlash("error", "Network error deleting user.");
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[32px]">
            User management
          </h2>
        </div>

        {canWrite ? (
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-lime px-5 text-sm font-bold text-ink shadow-[3px_3px_0_var(--color-ink)] transition hover:translate-y-[-1px]"
          >
            {createOpen ? "Close user form" : "+ Add user"}
          </button>
        ) : (
          <span className="rounded-full border-2 border-ink bg-sand px-4 py-1.5 text-xs font-extrabold tracking-[0.06em] uppercase">
            Read-only
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-[20px] border-2 border-ink bg-white p-4 shadow-[4px_4px_0_var(--color-ink)]">
          <p className="text-[11px] font-extrabold tracking-[0.08em] uppercase text-ink/60">
            Total accounts
          </p>
          <p className="mt-1.5 text-2xl font-extrabold sm:text-3xl">{stats.total}</p>
        </div>
        <div className="rounded-[20px] border-2 border-ink bg-white p-4 shadow-[4px_4px_0_var(--color-ink)]">
          <p className="text-[11px] font-extrabold tracking-[0.08em] uppercase text-ink/60">
            Active
          </p>
          <p className="mt-1.5 text-2xl font-extrabold sm:text-3xl">{stats.active}</p>
        </div>
        <div className="rounded-[20px] border-2 border-ink bg-white p-4 shadow-[4px_4px_0_var(--color-ink)]">
          <p className="text-[11px] font-extrabold tracking-[0.08em] uppercase text-ink/60">
            Suspended
          </p>
          <p className="mt-1.5 text-2xl font-extrabold sm:text-3xl">{stats.suspended}</p>
        </div>
        <div className="rounded-[20px] border-2 border-ink bg-lime p-4 shadow-[4px_4px_0_var(--color-ink)]">
          <p className="text-[11px] font-extrabold tracking-[0.08em] uppercase text-ink/75">
            Super Admins
          </p>
          <p className="mt-1.5 text-2xl font-extrabold sm:text-3xl">{stats.superAdmins}</p>
        </div>
      </div>

      {canWrite && createOpen && (
        <form
          onSubmit={handleCreateUser}
          className="rounded-[24px] border-2 border-ink bg-white p-4 shadow-[5px_5px_0_var(--color-ink)] sm:p-6"
        >
          <h3 className="border-b border-ink/15 pb-3 text-lg font-extrabold">
            Create admin team account
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
              Full name
              <input
                type="text"
                required
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 text-sm font-medium"
              />
            </label>

            <label className="block text-sm font-bold">
              Email address
              <input
                type="email"
                required
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="staff@momoeliquidz.co.uk"
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 text-sm font-medium"
              />
            </label>

            <div className="block text-sm font-bold">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="new-user-password">Temporary password</label>
                <button
                  type="button"
                  onClick={() => {
                    setCreatePassword(generateStrongPassword());
                    setShowPassword(true);
                  }}
                  className="cursor-pointer text-xs font-extrabold underline underline-offset-2"
                >
                  Generate password
                </button>
              </div>
              <div className="relative mt-1.5">
                <input
                  id="new-user-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 pr-16 pl-3.5 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-lg px-2 py-1 text-[11px] font-bold uppercase text-ink/75 hover:bg-sand"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="block text-sm font-bold">
              Initial RBAC role
              <select
                value={createRoleSlug}
                onChange={(e) => setCreateRoleSlug(e.target.value)}
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 text-sm font-bold"
              >
                {roles.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.name} ({r.permissions.length} perms)
                  </option>
                ))}
              </select>
            </label>
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
              {creating ? "Creating…" : "Create user"}
            </button>
          </div>
        </form>
      )}

      {canWrite && editingUser && (
        <form
          onSubmit={handleSaveEdit}
          className="rounded-[24px] border-2 border-ink bg-sand/70 p-4 shadow-[5px_5px_0_var(--color-ink)] sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/15 pb-3">
            <div>
              <h3 className="text-lg font-extrabold">
                Edit user: {editingUser.email}
              </h3>
              <p className="text-xs text-ink/65">
                Update display name, assigned role, or account suspension.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="cursor-pointer text-xs font-bold underline underline-offset-2"
            >
              Close
            </button>
          </div>

          {editError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border-2 border-[#c8102e] bg-[#fff5f6] px-4 py-3 text-sm font-medium text-[#c8102e]"
            >
              {editError}
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold">
              Display name
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-white px-3.5 text-sm font-medium"
              />
            </label>

            <label className="block text-sm font-bold">
              Assigned RBAC role
              <select
                disabled={
                  editingUser.id === currentUser.id &&
                  editingUser.rbacRole === SYSTEM_ROLES.SUPER_ADMIN
                }
                value={editRoleSlug}
                onChange={(e) => setEditRoleSlug(e.target.value)}
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-white px-3.5 text-sm font-bold disabled:opacity-60"
              >
                {roles.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.name} ({r.permissions.length} perms)
                  </option>
                ))}
              </select>
            </label>
          </div>

          {editingUser.id !== currentUser.id && (
            <div className="mt-4 rounded-2xl border-2 border-ink bg-white p-4">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={editBanned}
                  onChange={(e) => setEditBanned(e.target.checked)}
                  className="size-4 accent-ink"
                />
                Suspend account (revokes active sessions and blocks sign-in)
              </label>

              {editBanned && (
                <label className="mt-3 block text-xs font-bold text-ink/75">
                  Suspension reason (optional)
                  <input
                    type="text"
                    value={editBanReason}
                    onChange={(e) => setEditBanReason(e.target.value)}
                    placeholder="e.g. Left team / temporary access pause"
                    className="mt-1 block h-10 w-full rounded-xl border-2 border-ink bg-cream/40 px-3 text-sm font-normal"
                  />
                </label>
              )}
            </div>
          )}

          <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-ink/15 pt-4">
            <button
              type="button"
              disabled={savingEdit}
              onClick={() => setEditingUser(null)}
              className="inline-flex h-10 cursor-pointer items-center rounded-full border-2 border-ink bg-white px-5 text-sm font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="inline-flex h-10 cursor-pointer items-center rounded-full bg-ink px-6 text-sm font-bold text-white disabled:opacity-60"
            >
              {savingEdit ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-2.5 rounded-[20px] border-2 border-ink bg-sand p-3.5 sm:flex sm:flex-wrap sm:items-center sm:gap-3 sm:p-4">
        <input
          type="search"
          aria-label="Search users"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search name, email, or role…"
          className="h-10 w-full rounded-xl border-2 border-ink bg-white px-3.5 text-sm placeholder:text-ink/45 sm:min-w-[220px] sm:flex-1"
        />
        <div className="grid grid-cols-2 gap-2.5 sm:contents">
          <select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 min-w-0 rounded-xl border-2 border-ink bg-white px-3 text-sm font-bold"
          >
            <option value="all">All roles</option>
            {roles.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "all" | "active" | "banned");
              setPage(1);
            }}
            className="h-10 min-w-0 rounded-xl border-2 border-ink bg-white px-3 text-sm font-bold"
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="banned">Suspended only</option>
          </select>
        </div>
      </div>

      {/* Mobile user cards */}
      <div className="space-y-3 md:hidden">
        {paginatedUsers.map((u) => {
          const isSelf = u.id === currentUser.id;
          const isBusy = busyUserId === u.id;

          return (
            <article
              key={u.id}
              className="rounded-[22px] border-2 border-ink bg-white p-4 shadow-[4px_4px_0_var(--color-ink)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-extrabold text-ink">
                      {u.name || u.email}
                    </span>
                    {isSelf && (
                      <span className="rounded-full border border-ink bg-lime px-2 py-0.5 text-[10px] font-extrabold uppercase">
                        You
                      </span>
                    )}
                  </div>
                  <p className="break-all text-xs text-ink/65">{u.email}</p>
                </div>

                {u.banned ? (
                  <span className="inline-flex shrink-0 rounded-full border border-[#c8102e] bg-[#fff5f6] px-2.5 py-0.5 text-[11px] font-extrabold text-[#c8102e]">
                    Suspended
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 rounded-full border border-ink bg-teal px-2.5 py-0.5 text-[11px] font-extrabold text-ink">
                    Active
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cream px-3 py-2 text-xs">
                <span
                  className={`inline-flex rounded-full border border-ink px-2.5 py-0.5 font-extrabold ${u.rbacRole === SYSTEM_ROLES.SUPER_ADMIN
                    ? "bg-lime text-ink"
                    : u.permissions.length > 0
                      ? "bg-teal text-ink"
                      : "bg-sand text-ink"
                    }`}
                >
                  {u.rbacRoleName}
                </span>
                <span className="font-semibold text-ink/75">
                  {u.permissions.length}/{ALL_PERMISSION_KEYS.length} perms ·{" "}
                  {u.activeSessions} session{u.activeSessions === 1 ? "" : "s"}
                </span>
              </div>

              {u.banned && u.banReason && (
                <p className="mt-2 text-xs text-[#c8102e]">
                  Reason: {u.banReason}
                </p>
              )}

              {canWrite && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-ink/10 pt-3">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => openEditUser(u)}
                    className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-ink bg-cream px-3.5 text-xs font-bold hover:bg-lime disabled:opacity-50"
                  >
                    Edit
                  </button>
                  {!isSelf && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleBan(u)}
                      className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-ink bg-white px-3.5 text-xs font-bold hover:bg-sand disabled:opacity-50"
                    >
                      {u.banned ? "Activate" : "Suspend"}
                    </button>
                  )}
                  {!isSelf &&
                    (confirmDeleteId === u.id ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDeleteUser(u)}
                        className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-[#c8102e] bg-[#c8102e] px-3.5 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {isBusy ? "Deleting…" : "Confirm"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setConfirmDeleteId(u.id)}
                        className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-ink/40 bg-white px-3.5 text-xs font-bold text-[#c8102e] hover:border-[#c8102e]"
                      >
                        Delete
                      </button>
                    ))}
                </div>
              )}
            </article>
          );
        })}
        {filteredUsers.length === 0 ? (
          <div className="rounded-[22px] border-2 border-ink bg-white p-8 text-center text-sm text-ink/60">
            No user accounts match the active filters.
          </div>
        ) : (
          <div className="rounded-[20px] border-2 border-ink bg-white p-3.5 shadow-[4px_4px_0_var(--color-ink)]">
            <Pagination
              variant="admin"
              page={safePage}
              pageSize={pageSize}
              totalItems={filteredUsers.length}
              itemLabel="users"
              pageSizeOptions={[10, 20, 50]}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Desktop user table */}
      <section className="hidden rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink text-xs font-extrabold tracking-[0.08em] uppercase text-ink/65">
                <th className="py-3 pr-4">Account</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Permissions</th>
                <th className="py-3 pr-4">Sessions</th>
                <th className="py-3 pr-4">Status</th>
                {canWrite && <th className="py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/15">
              {paginatedUsers.map((u) => {
                const isSelf = u.id === currentUser.id;
                const isBusy = busyUserId === u.id;

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
                      </div>
                      <p className="text-xs text-ink/65">{u.email}</p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`inline-flex rounded-full border border-ink px-3 py-0.5 text-xs font-extrabold ${u.rbacRole === SYSTEM_ROLES.SUPER_ADMIN
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
                      {u.permissions.length} / {ALL_PERMISSION_KEYS.length}
                    </td>
                    <td className="py-3.5 pr-4 font-mono text-xs font-bold">
                      {u.activeSessions}
                    </td>
                    <td className="py-3.5 pr-4">
                      {u.banned ? (
                        <div>
                          <span className="inline-flex rounded-full border border-[#c8102e] bg-[#fff5f6] px-2.5 py-0.5 text-xs font-extrabold text-[#c8102e]">
                            Suspended
                          </span>
                          {u.banReason && (
                            <p className="mt-1 max-w-[180px] truncate text-[11px] text-ink/65">
                              {u.banReason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex rounded-full border border-ink bg-teal px-2.5 py-0.5 text-xs font-extrabold text-ink">
                          Active
                        </span>
                      )}
                    </td>
                    {canWrite && (
                      <td className="py-3.5 text-right">
                        <div className="inline-flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => openEditUser(u)}
                            className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-ink bg-cream px-3 text-xs font-bold hover:bg-lime disabled:opacity-50"
                          >
                            Edit
                          </button>
                          {!isSelf && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleToggleBan(u)}
                              className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-ink bg-white px-3 text-xs font-bold hover:bg-sand disabled:opacity-50"
                            >
                              {u.banned ? "Activate" : "Suspend"}
                            </button>
                          )}
                          {!isSelf &&
                            (confirmDeleteId === u.id ? (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleDeleteUser(u)}
                                className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-[#c8102e] bg-[#c8102e] px-3 text-xs font-bold text-white disabled:opacity-60"
                              >
                                {isBusy ? "Deleting…" : "Confirm"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => setConfirmDeleteId(u.id)}
                                className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-ink/40 bg-white px-3 text-xs font-bold text-[#c8102e] hover:border-[#c8102e]"
                              >
                                Delete
                              </button>
                            ))}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={canWrite ? 6 : 5}
                    className="py-8 text-center text-ink/60"
                  >
                    No user accounts match the active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredUsers.length > 0 && (
          <div className="mt-4 border-t border-ink/15 pt-4">
            <Pagination
              variant="admin"
              page={safePage}
              pageSize={pageSize}
              totalItems={filteredUsers.length}
              itemLabel="users"
              pageSizeOptions={[10, 20, 50]}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </section>
    </div>
  );
}
