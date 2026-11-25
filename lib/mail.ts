import nodemailer, { type Transporter } from "nodemailer";
import "server-only";
import { formatPrice } from "./catalog";
import {
  type OrderAddress,
  type OrderRecord,
  type PaymentSettings,
  formatOrderDate,
  getPaymentLabel,
} from "./payment";
import { SITE_URL } from "./seo";

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

function formatAddressLines(addr: OrderAddress): string[] {
  return [
    `${addr.firstName} ${addr.lastName}`.trim(),
    addr.address,
    ...(addr.apartment ? [addr.apartment] : []),
    `${addr.city}, ${addr.state}`,
    addr.zip,
    addr.country,
  ].filter(Boolean);
}

function renderAddressHtml(addr: OrderAddress): string {
  return formatAddressLines(addr)
    .map((line) => escapeHtml(line))
    .join("<br />");
}

function buildOrderItemsText(order: OrderRecord): string {
  return order.items
    .map(
      (item) =>
        `- ${item.name} × ${item.qty}: ${formatPrice(item.lineTotalPence / 100)}`,
    )
    .join("\n");
}

function buildOrderItemsHtml(order: OrderRecord): string {
  return order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid rgba(33,33,33,0.1);font-size:14px;">
          ${escapeHtml(item.name)} <strong>× ${item.qty}</strong>
        </td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid rgba(33,33,33,0.1);font-size:14px;font-weight:700;">
          ${escapeHtml(formatPrice(item.lineTotalPence / 100))}
        </td>
      </tr>`,
    )
    .join("");
}

function buildCustomerInstructions(
  order: OrderRecord,
  settings: PaymentSettings,
  orderUrl: string,
): { text: string; html: string } {
  const supportEmail = settings.supportEmail;

  if (order.paymentMethod === "gift-card") {
    const cardsText = settings.giftCardAcceptedCards
      .map((card, i) => `${i + 1}. ${card}`)
      .join("\n");
    const cardsHtml = settings.giftCardAcceptedCards
      .map((card) => `<li>${escapeHtml(card)}</li>`)
      .join("");
    const instructionsHtml = settings.giftCardInstructions
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map(
        (p) =>
          `<p style="margin:0 0 8px;">${escapeHtml(p).replace(/\n/g, "<br />")}</p>`,
      )
      .join("");

    const text = [
      settings.giftCardIntro,
      cardsText,
      "",
      settings.giftCardInstructions,
      "",
      `Company email: ${supportEmail}`,
      "",
      settings.giftCardClosing,
    ].join("\n");

    const html = `
      <div style="margin-bottom:20px;padding:18px 20px;background-color:#f5e8da;border:2px solid #212121;border-radius:14px;font-size:14px;line-height:1.65;">
        <p style="margin:0 0 10px;font-weight:800;">${escapeHtml(settings.giftCardTitle)} — next steps</p>
        <p style="margin:0 0 8px;">${escapeHtml(settings.giftCardIntro)}</p>
        <ol style="margin:0 0 10px;padding-left:20px;">${cardsHtml}</ol>
        ${instructionsHtml}
        <p style="margin:0 0 8px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(supportEmail)}" style="color:#212121;font-weight:700;">${escapeHtml(supportEmail)}</a></p>
        <p style="margin:0;">${escapeHtml(settings.giftCardClosing).replace(/\n/g, "<br />")}</p>
      </div>`;
    return { text, html };
  }

  if (order.paymentMethod === "bank") {
    const hasBankDetails = Boolean(
      settings.bankAccountName ||
        settings.bankSortCode ||
        settings.bankAccountNumber,
    );
    const bankDetailsText = hasBankDetails
      ? [
          "",
          ...(settings.bankAccountName
            ? [`Account name: ${settings.bankAccountName}`]
            : []),
          ...(settings.bankSortCode
            ? [`Sort code: ${settings.bankSortCode}`]
            : []),
          ...(settings.bankAccountNumber
            ? [`Account number: ${settings.bankAccountNumber}`]
            : []),
          `Reference: #${order.orderNumber}`,
        ]
      : [];
    const bankDetailsHtml = hasBankDetails
      ? `<div style="margin:12px 0;padding:12px 14px;background-color:#ffffff;border:1px solid rgba(33,33,33,0.2);border-radius:10px;">
          ${settings.bankAccountName ? `<div><strong>Account name:</strong> ${escapeHtml(settings.bankAccountName)}</div>` : ""}
          ${settings.bankSortCode ? `<div><strong>Sort code:</strong> <code>${escapeHtml(settings.bankSortCode)}</code></div>` : ""}
          ${settings.bankAccountNumber ? `<div><strong>Account number:</strong> <code>${escapeHtml(settings.bankAccountNumber)}</code></div>` : ""}
          <div><strong>Reference:</strong> <code>#${order.orderNumber}</code></div>
        </div>`
      : "";

    const text = [
      settings.bankInstructions,
      ...bankDetailsText,
      "",
      `Contact: ${supportEmail} · ${SITE_URL}/faq#contact`,
    ].join("\n");

    const html = `
      <div style="margin-bottom:20px;padding:18px 20px;background-color:#f5e8da;border:2px solid #212121;border-radius:14px;font-size:14px;line-height:1.65;">
        <p style="margin:0 0 8px;font-weight:800;">${escapeHtml(settings.bankTitle)}</p>
        <p style="margin:0 0 8px;">${escapeHtml(settings.bankInstructions).replace(/\n/g, "<br />")}</p>
        ${bankDetailsHtml}
        <p style="margin:0;">Contact email: <a href="mailto:${escapeHtml(supportEmail)}" style="color:#212121;font-weight:700;">${escapeHtml(supportEmail)}</a></p>
      </div>`;
    return { text, html };
  }

  const cryptoTicker = order.cryptoCurrency ?? "CRYPTO";
  const cryptoAmount = order.cryptoAmount ?? "";
  const cryptoAddress = order.cryptoAddress ?? "";

  const text = [
    `${settings.cryptoTitle} (${settings.cryptoExpiryMinutes} min window):`,
    settings.cryptoImportantNotice,
    `Amount: ${cryptoAmount} ${cryptoTicker}`,
    `Pay to address: ${cryptoAddress}`,
    `View payment page & QR code: ${orderUrl}`,
  ].join("\n");

  const html = `
    <div style="margin-bottom:20px;padding:18px 20px;background-color:#f5e8da;border:2px solid #212121;border-radius:14px;font-size:14px;line-height:1.65;">
      <p style="margin:0 0 8px;font-weight:800;">${escapeHtml(settings.cryptoTitle)} (${escapeHtml(cryptoTicker)})</p>
      <p style="margin:0 0 8px;">${escapeHtml(settings.cryptoImportantNotice)}</p>
      <p style="margin:0 0 6px;"><strong>Amount:</strong> <code>${escapeHtml(cryptoAmount)} ${escapeHtml(cryptoTicker)}</code></p>
      <p style="margin:0 0 12px;word-break:break-all;"><strong>Pay to address:</strong> <code>${escapeHtml(cryptoAddress)}</code></p>
      <a href="${escapeHtml(orderUrl)}" style="display:inline-block;padding:10px 18px;background-color:#212121;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:700;">Open payment page &amp; QR code</a>
    </div>`;

  return { text, html };
}

/** Sends handler notification and customer confirmation/payment instructions for a new order. */
export async function sendOrderEmails(
  order: OrderRecord,
  settings: PaymentSettings,
): Promise<{ handlerSent: boolean; customerSent: boolean }> {
  const { config } = getTransporter();
  const supportEmail = settings.supportEmail;
  const orderDate = formatOrderDate(order.createdAt);
  const paymentLabel = getPaymentLabel(order.paymentMethod);
  const customerName =
    `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim();
  const orderUrl = `${SITE_URL}/checkout/order-received/${order.accessToken}`;
  const shippingText =
    order.shipping === 0
      ? `Free via ${order.shippingLabel}`
      : `${formatPrice(order.shipping)} via ${order.shippingLabel}`;

  const cryptoSummaryText =
    order.paymentMethod === "crypto" && order.cryptoCurrency
      ? `\nCrypto quote: ${order.cryptoAmount} ${order.cryptoCurrency}\nWallet: ${order.cryptoAddress}\n`
      : "";

  const handlerText = [
    `New Momo Eliquid Order #${order.orderNumber}`,
    "",
    `Date: ${orderDate}`,
    `Customer: ${customerName} (${order.email})`,
    ...(order.phone ? [`Phone: ${order.phone}`] : []),
    `Payment method: ${paymentLabel}`,
    cryptoSummaryText,
    "Items:",
    buildOrderItemsText(order),
    "",
    `Subtotal: ${formatPrice(order.subtotal)}`,
    `Shipping: ${shippingText}`,
    `Total: ${formatPrice(order.total)}`,
    ...(order.orderNote ? ["", `Order note: ${order.orderNote}`] : []),
    "",
    "Shipping address:",
    ...formatAddressLines(order.shippingAddress),
    "",
    "Billing address:",
    ...formatAddressLines(order.billingAddress),
    "",
    `Payment page: ${orderUrl}`,
  ].join("\n");

  const handlerHtml = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background-color:#fdf3e4;color:#212121;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background-color:#ffffff;border:2px solid #212121;border-radius:20px;overflow:hidden;">
      <tr>
        <td style="padding:26px 32px 18px;border-bottom:1px solid rgba(33,33,33,0.12);">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Momo Eliquid · New Order</p>
          <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;font-weight:800;">Order #${order.orderNumber} — ${escapeHtml(formatPrice(order.total))}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;background-color:#f5e8da;border-radius:12px;">
            <tr>
              <td style="padding:14px 16px;font-size:14px;line-height:1.6;">
                <div><strong>Customer:</strong> ${escapeHtml(customerName)} (<a href="mailto:${escapeHtml(order.email)}" style="color:#212121;">${escapeHtml(order.email)}</a>)</div>
                ${order.phone ? `<div><strong>Phone:</strong> ${escapeHtml(order.phone)}</div>` : ""}
                <div><strong>Date:</strong> ${escapeHtml(orderDate)}</div>
                <div><strong>Payment method:</strong> ${escapeHtml(paymentLabel)}</div>
                ${order.paymentMethod === "crypto" && order.cryptoCurrency ? `<div><strong>Crypto quote:</strong> ${escapeHtml(order.cryptoAmount ?? "")} ${escapeHtml(order.cryptoCurrency)} → <code>${escapeHtml(order.cryptoAddress ?? "")}</code></div>` : ""}
                ${order.orderNote ? `<div><strong>Note:</strong> ${escapeHtml(order.orderNote)}</div>` : ""}
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
            ${buildOrderItemsHtml(order)}
            <tr>
              <td style="padding:10px 0;font-size:14px;">Subtotal</td>
              <td align="right" style="padding:10px 0;font-size:14px;font-weight:700;">${escapeHtml(formatPrice(order.subtotal))}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:14px;">Shipping (${escapeHtml(order.shippingLabel)})</td>
              <td align="right" style="padding:6px 0;font-size:14px;font-weight:700;">${order.shipping === 0 ? "Free" : escapeHtml(formatPrice(order.shipping))}</td>
            </tr>
            <tr>
              <td style="padding:12px 0 0;border-top:2px solid #212121;font-size:16px;font-weight:800;">Total</td>
              <td align="right" style="padding:12px 0 0;border-top:2px solid #212121;font-size:16px;font-weight:800;">${escapeHtml(formatPrice(order.total))}</td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td width="48%" valign="top" style="padding:14px;border:1px solid rgba(33,33,33,0.18);border-radius:12px;font-size:13px;line-height:1.6;">
                <p style="margin:0 0 6px;font-weight:800;">Billing address</p>
                ${renderAddressHtml(order.billingAddress)}
              </td>
              <td width="4%"></td>
              <td width="48%" valign="top" style="padding:14px;border:1px solid rgba(33,33,33,0.18);border-radius:12px;font-size:13px;line-height:1.6;">
                <p style="margin:0 0 6px;font-weight:800;">Shipping address</p>
                ${renderAddressHtml(order.shippingAddress)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const instructions = buildCustomerInstructions(order, settings, orderUrl);
  const customerText = [
    `Thank you, ${customerName}! Your Momo Eliquid order #${order.orderNumber} has been received.`,
    "",
    `Order number: #${order.orderNumber}`,
    `Date: ${orderDate}`,
    `Payment method: ${paymentLabel}`,
    `Total: ${formatPrice(order.total)}`,
    "",
    instructions.text,
    "",
    "Order details:",
    buildOrderItemsText(order),
    `Subtotal: ${formatPrice(order.subtotal)}`,
    `Shipping: ${shippingText}`,
    `Total: ${formatPrice(order.total)}`,
    "",
    `View your order status anytime: ${orderUrl}`,
  ].join("\n");

  const customerHtml = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background-color:#fdf3e4;color:#212121;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background-color:#ffffff;border:2px solid #212121;border-radius:20px;overflow:hidden;">
      <tr>
        <td style="padding:26px 32px 18px;border-bottom:1px solid rgba(33,33,33,0.12);">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Momo Eliquid · Order Received</p>
          <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;font-weight:800;">Thank you — Order #${order.orderNumber}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px;">
          ${instructions.html}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
            ${buildOrderItemsHtml(order)}
            <tr>
              <td style="padding:10px 0;font-size:14px;">Subtotal</td>
              <td align="right" style="padding:10px 0;font-size:14px;font-weight:700;">${escapeHtml(formatPrice(order.subtotal))}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:14px;">Shipping (${escapeHtml(order.shippingLabel)})</td>
              <td align="right" style="padding:6px 0;font-size:14px;font-weight:700;">${order.shipping === 0 ? "Free" : escapeHtml(formatPrice(order.shipping))}</td>
            </tr>
            <tr>
              <td style="padding:12px 0 0;border-top:2px solid #212121;font-size:16px;font-weight:800;">Total</td>
              <td align="right" style="padding:12px 0 0;border-top:2px solid #212121;font-size:16px;font-weight:800;">${escapeHtml(formatPrice(order.total))}</td>
            </tr>
          </table>
          <p style="margin:0;font-size:13px;color:rgba(33,33,33,0.75);">View your order page anytime: <a href="${escapeHtml(orderUrl)}" style="color:#212121;font-weight:700;">Order #${order.orderNumber}</a></p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const [handlerResult, customerResult] = await Promise.allSettled([
    sendMail({
      to: config.contactTo,
      replyTo: { name: stripHeaderBreaks(customerName), address: stripHeaderBreaks(order.email) },
      subject: `[Momo Eliquid Order #${order.orderNumber}] ${paymentLabel} · ${formatPrice(order.total)}`,
      text: handlerText,
      html: handlerHtml,
    }),
    sendMail({
      to: order.email,
      replyTo: supportEmail,
      subject: `Momo Eliquid — Order #${order.orderNumber} received (${paymentLabel})`,
      text: customerText,
      html: customerHtml,
    }),
  ]);

  if (handlerResult.status === "rejected") {
    console.error("Failed to send handler order email:", handlerResult.reason);
  }
  if (customerResult.status === "rejected") {
    console.error("Failed to send customer order email:", customerResult.reason);
  }

  return {
    handlerSent: handlerResult.status === "fulfilled",
    customerSent: customerResult.status === "fulfilled",
  };
}

/** Notifies the order handler when a customer clicks to confirm a crypto payment was sent. */
export async function sendOrderPaymentSubmittedEmail(
  order: OrderRecord,
): Promise<void> {
  const { config } = getTransporter();
  const orderUrl = `${SITE_URL}/checkout/order-received/${order.accessToken}`;
  const text = [
    `Customer confirmed payment sent for Order #${order.orderNumber}.`,
    "",
    `Customer email: ${order.email}`,
    `Total: ${formatPrice(order.total)}`,
    ...(order.cryptoCurrency
      ? [
          `Crypto: ${order.cryptoAmount} ${order.cryptoCurrency}`,
          `Wallet: ${order.cryptoAddress}`,
        ]
      : []),
    `Order page: ${orderUrl}`,
  ].join("\n");

  await sendMail({
    to: config.contactTo,
    replyTo: stripHeaderBreaks(order.email),
    subject: `[Momo Eliquid Order #${order.orderNumber}] Customer marked crypto payment sent`,
    text,
  });
}
