import { isMailConfigured, sendContactEmail } from "@/lib/mail";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const globalForRateLimit = globalThis as unknown as {
  __contactRateLimits?: Map<string, number[]>;
};

const requestLog =
  globalForRateLimit.__contactRateLimits ??
  (globalForRateLimit.__contactRateLimits = new Map<string, number[]>());

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

function isRateLimited(ip: string, now: number): boolean {
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  for (const [key, timestamps] of requestLog.entries()) {
    const recent = timestamps.filter((t) => t > cutoff);
    if (recent.length === 0) {
      requestLog.delete(key);
    } else if (recent.length !== timestamps.length) {
      requestLog.set(key, recent);
    }
  }

  const hits = requestLog.get(ip) ?? [];
  if (hits.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  hits.push(now);
  requestLog.set(ip, hits);
  return false;
}

/** Public endpoint that validates and emails contact form submissions. */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited(ip, Date.now())) {
    return Response.json(
      {
        error:
          "Too many messages sent recently. Please wait a few minutes and try again.",
      },
      { status: 429 },
    );
  }

  if (!isMailConfigured()) {
    return Response.json(
      { error: "Email service is not configured on the server." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request payload." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json(
      { error: "Invalid request payload." },
      { status: 400 },
    );
  }

  const payload = body as Record<string, unknown>;

  if (
    typeof payload.website === "string" &&
    payload.website.trim().length > 0
  ) {
    return Response.json({ ok: true }, { status: 200 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const message =
    typeof payload.message === "string" ? payload.message.trim() : "";

  if (name.length < 1 || name.length > 120) {
    return Response.json(
      { error: "Please enter your name (up to 120 characters)." },
      { status: 400 },
    );
  }

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  if (message.length < 1 || message.length > 5000) {
    return Response.json(
      { error: "Please enter a message (up to 5,000 characters)." },
      { status: 400 },
    );
  }

  try {
    const result = await sendContactEmail({ name, email, message });
    return Response.json(
      { ok: true, messageId: result.messageId },
      { status: 200 },
    );
  } catch (err) {
    console.error("Failed to send contact email:", err);
    return Response.json(
      {
        error:
          "We couldn't send your message right now. Please try again or email support@momoeliquidz.co.uk.",
      },
      { status: 502 },
    );
  }
}
