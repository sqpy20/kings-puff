import nodemailer, { type Transporter } from "nodemailer";
import "server-only";

export type MailSummary = {
  provider: string;
  configured: boolean;
  host: string | null;
  port: number | null;
  secure: boolean;
  from: string | null;
  contactTo: string;
};

export type SendMailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string | { name: string; address: string };
  from?: string;
};

type ParsedMailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  contactTo: string;
};

const DEFAULT_CONTACT_TO = "handler@momoeliquidz.co.uk";

const globalForMail = globalThis as unknown as {
  __momoMailTransporter?: Transporter;
  __momoMailKey?: string;
};

function parseMailEnv(): ParsedMailConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const rawPort = process.env.SMTP_PORT?.trim();
  const port = rawPort ? Number(rawPort) : 465;
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    return null;
  }

  const rawSecure = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure =
    rawSecure === "true" ? true : rawSecure === "false" ? false : port === 465;

  const from = process.env.SMTP_FROM?.trim() || `Momo Eliquid <${user}>`;
  const contactTo =
    process.env.CONTACT_TO_EMAIL?.trim() || DEFAULT_CONTACT_TO;

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
    contactTo,
  };
}

function getTransporter(): {
  transporter: Transporter;
  config: ParsedMailConfig;
} {
  const config = parseMailEnv();
  if (!config) {
    throw new Error("SMTP environment variables are not configured.");
  }

  const key = `${config.host}:${config.port}:${config.secure}:${config.user}`;
  if (
    !globalForMail.__momoMailTransporter ||
    globalForMail.__momoMailKey !== key
  ) {
    globalForMail.__momoMailTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    globalForMail.__momoMailKey = key;
  }

  return {
    transporter: globalForMail.__momoMailTransporter,
    config,
  };
}

function stripHeaderBreaks(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Returns whether SMTP mail settings are present and valid. */
export function isMailConfigured(): boolean {
  return parseMailEnv() !== null;
}

/** Returns a safe, credential-free summary of the SMTP configuration. */
export function getMailSummary(): MailSummary {
  const config = parseMailEnv();
  const contactTo =
    config?.contactTo ??
    process.env.CONTACT_TO_EMAIL?.trim() ??
    DEFAULT_CONTACT_TO;

  if (!config) {
    return {
      provider: "Nodemailer (SMTP)",
      configured: false,
      host: process.env.SMTP_HOST?.trim() || null,
      port: null,
      secure: false,
      from: process.env.SMTP_FROM?.trim() || null,
      contactTo,
    };
  }

  return {
    provider: "Nodemailer (SMTP)",
    configured: true,
    host: config.host,
    port: config.port,
    secure: config.secure,
    from: config.from,
    contactTo: config.contactTo,
  };
}

/** Verifies the configured SMTP server connection and authentication. */
export async function verifyMailConnection(): Promise<boolean> {
  const { transporter } = getTransporter();
  await transporter.verify();
  return true;
}

/** Sends an email via the configured Nodemailer SMTP transporter. */
export async function sendMail(input: SendMailInput): Promise<{
  messageId: string;
  accepted: string[];
  rejected: string[];
}> {
  const { transporter, config } = getTransporter();
  const info = await transporter.sendMail({
    from: input.from ?? config.from,
    to: input.to,
    replyTo: input.replyTo,
    subject: stripHeaderBreaks(input.subject),
    text: input.text,
    ...(input.html ? { html: input.html } : {}),
  });

  return {
    messageId: info.messageId,
    accepted: (info.accepted ?? []).map(String),
    rejected: (info.rejected ?? []).map(String),
  };
}

/** Formats and delivers a storefront contact form submission to the handler inbox. */
export async function sendContactEmail(input: {
  name: string;
  email: string;
  message: string;
}): Promise<{
  messageId: string;
  accepted: string[];
  rejected: string[];
}> {
  const { config } = getTransporter();
  const safeName = stripHeaderBreaks(input.name);
  const safeEmail = stripHeaderBreaks(input.email);
  const cleanMessage = input.message.trim();
  const sentAtUtc = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const text = [
    "New contact form submission from Momo Eliquid",
    "",
    `Name: ${safeName}`,
    `Email: ${safeEmail}`,
    `Received: ${sentAtUtc}`,
    "",
    "Message:",
    cleanMessage,
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background-color:#faf6ee;color:#212121;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border:2px solid #212121;border-radius:20px;overflow:hidden;">
      <tr>
        <td style="padding:28px 32px 20px;border-bottom:1px solid rgba(33,33,33,0.12);">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#212121;">Momo Eliquid · Contact Form</p>
          <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;font-weight:800;color:#212121;">New message from ${escapeHtml(safeName)}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;background-color:#faf6ee;border-radius:12px;">
            <tr>
              <td style="padding:14px 16px;font-size:14px;line-height:1.6;">
                <div><strong>Name:</strong> ${escapeHtml(safeName)}</div>
                <div><strong>Email:</strong> <a href="mailto:${escapeHtml(safeEmail)}" style="color:#212121;font-weight:600;">${escapeHtml(safeEmail)}</a></div>
                <div><strong>Received:</strong> ${escapeHtml(sentAtUtc)}</div>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(33,33,33,0.65);">Message</p>
          <div style="margin:0;font-size:15px;line-height:1.65;white-space:pre-wrap;color:#212121;">${escapeHtml(cleanMessage)}</div>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return sendMail({
    to: config.contactTo,
    replyTo: { name: safeName, address: safeEmail },
    subject: `[Momo Eliquid Contact] Message from ${safeName}`,
    text,
    html,
  });
}
