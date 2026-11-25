import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

function loadLocalEnv() {
  const cwd = process.cwd();
  for (const filename of [".env.local", ".env"]) {
    const filePath = path.join(cwd, filename);
    if (!fs.existsSync(filePath)) continue;

    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile(filePath);
    } else {
      const content = fs.readFileSync(filePath, "utf8");
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const eqIndex = line.indexOf("=");
        if (eqIndex <= 0) continue;
        const key = line.slice(0, eqIndex).trim();
        let value = line.slice(eqIndex + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!(key in process.env)) {
          process.env[key] = value;
        }
      }
    }
    break;
  }
}

function parseCliArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--") continue;
    if (!token.startsWith("--")) continue;
    const eqIndex = token.indexOf("=");
    if (eqIndex !== -1) {
      const key = token.slice(2, eqIndex);
      args[key] = token.slice(eqIndex + 1);
    } else {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[key] = next;
        i += 1;
      } else {
        args[key] = "true";
      }
    }
  }
  return args;
}

async function main() {
  loadLocalEnv();

  const cli = parseCliArgs(process.argv.slice(2));
  const email = String(cli.email ?? process.env.ADMIN_EMAIL ?? "").trim();
  const password = String(cli.password ?? process.env.ADMIN_PASSWORD ?? "");
  const name = String(
    cli.name ?? process.env.ADMIN_NAME ?? (email.split("@")[0] || "Store Admin"),
  ).trim();
  const rbacRoleSlug = String(cli.role ?? process.env.ADMIN_ROLE ?? "admin")
    .trim()
    .toLowerCase();

  if (!/^[a-z0-9][a-z0-9_-]{1,47}$/.test(rbacRoleSlug)) {
    console.error(
      "Error: --role must be 2–48 lowercase letters, digits, hyphens, or underscores.",
    );
    process.exit(1);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Error: provide a valid --email or ADMIN_EMAIL.");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error(
      "Error: provide a --password (or ADMIN_PASSWORD) with at least 8 characters.",
    );
    process.exit(1);
  }

  const authBaseUrl = process.env.NEON_AUTH_BASE_URL?.replace(/\/+$/, "");
  const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!authBaseUrl) {
    console.error("Error: NEON_AUTH_BASE_URL is missing in .env.local.");
    process.exit(1);
  }
  if (!dbUrl) {
    console.error(
      "Error: DATABASE_URL_UNPOOLED or DATABASE_URL is missing in .env.local.",
    );
    process.exit(1);
  }

  const origin = process.env.ADMIN_ORIGIN || "http://localhost:3000";
  const signUpRes = await fetch(`${authBaseUrl}/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
    },
    body: JSON.stringify({ email, password, name }),
  });

  if (!signUpRes.ok) {
    const body = await signUpRes.json().catch(() => ({}));
    const code = typeof body?.code === "string" ? body.code : "";
    const message = typeof body?.message === "string" ? body.message : "";
    const alreadyExists =
      signUpRes.status === 409 ||
      signUpRes.status === 422 ||
      code === "USER_ALREADY_EXISTS" ||
      /already exists|already registered/i.test(message);

    if (!alreadyExists) {
      console.error(
        `Error creating Neon Auth user (HTTP ${signUpRes.status}): ${message || code || "Unknown error"}`,
      );
      process.exit(1);
    }
    console.log(`User ${email} already exists in Neon Auth; promoting to admin.`);
  }

  const pool = new Pool({ connectionString: dbUrl, max: 1 });
  try {
    const result = await pool.query(
      `UPDATE neon_auth."user"
       SET role = 'admin', "emailVerified" = true
       WHERE lower(email) = lower($1)
       RETURNING id, email, name, role`,
      [email],
    );

    if (result.rowCount === 0) {
      console.error("Error: user record was not found in neon_auth.\"user\".");
      process.exit(1);
    }

    const adminUser = result.rows[0];

    const rbacTableCheck = await pool.query(
      `SELECT to_regclass('public.admin_roles') IS NOT NULL AS has_roles`,
    );
    let assignedRbacRole = null;
    if (rbacTableCheck.rows[0]?.has_roles) {
      const roleExists = await pool.query(
        `SELECT slug FROM public.admin_roles WHERE slug = $1`,
        [rbacRoleSlug],
      );
      if (roleExists.rowCount === 0) {
        console.error(`Error: RBAC role "${rbacRoleSlug}" does not exist in public.admin_roles.`);
        process.exit(1);
      }
      await pool.query(
        `INSERT INTO public.admin_user_roles (user_id, role_slug, updated_at)
         VALUES ($1::uuid, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           role_slug = EXCLUDED.role_slug,
           updated_at = NOW()`,
        [adminUser.id, rbacRoleSlug],
      );
      assignedRbacRole = rbacRoleSlug;
    }

    console.log("Admin account ready:", {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      ...(assignedRbacRole ? { rbacRole: assignedRbacRole } : {}),
    });
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(
    "Fatal error creating admin:",
    err instanceof Error ? err.message : String(err),
  );
  process.exit(1);
});
