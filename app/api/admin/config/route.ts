import { requireAdminPermission } from "@/lib/auth/admin";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/catalog";
import {
  getCloudinaryCloudName,
  isCloudinaryConfigured,
} from "@/lib/cloudinary";
import { getAdminDbStats } from "@/lib/db";
import { getMailSummary } from "@/lib/mail";
import { getPaymentSettings } from "@/lib/orders";
import { SITE_LOCALE, SITE_NAME, SITE_URL } from "@/lib/seo";

/** Returns admin session details, live Lakebase DB metrics, media config, and runtime infra metadata. */
export async function GET() {
  const gate = await requireAdminPermission("config.view");
  if ("response" in gate) return gate.response;

  const [database, paymentSettings] = await Promise.all([
    getAdminDbStats(),
    getPaymentSettings(),
  ]);

  return Response.json(
    {
      user: gate.user,
      database,
      media: {
        provider: "Cloudinary",
        configured: isCloudinaryConfigured(),
        cloudName: getCloudinaryCloudName(),
      },
      mail: getMailSummary(),
      paymentSettings,
      storefront: {
        siteName: SITE_NAME,
        siteUrl: SITE_URL,
        locale: SITE_LOCALE,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        dispatchCutoff: "2:00 PM UK (Mon–Fri)",
      },
      infrastructure: {
        authProvider: "Neon Auth (Managed Better Auth)",
        databaseDriver: "pg (Lakebase pooled runtime)",
        proxyMatcher: ["/admin", "/admin/:path*"],
        robotsDisallow: ["/admin", "/cart", "/checkout", "/age-gate", "/api/"],
        endpoints: {
          public: [
            "GET /api/catalogs",
            "GET /api/catalogs/[slug]",
            "GET /api/products",
            "GET /api/products/[id]",
            "GET /api/payment-content",
            "POST /api/contact",
            "POST /api/orders",
            "GET /api/orders/[token]",
            "PATCH /api/orders/[token]",
          ],
          admin: [
            "/api/admin/session",
            "/api/admin/orders",
            "/api/admin/orders/[id]",
            "/api/admin/catalogs",
            "/api/admin/products",
            "/api/admin/users",
            "/api/admin/users/[id]",
            "/api/admin/roles",
            "/api/admin/upload",
            "/api/admin/config",
            "/api/admin/payment-settings",
          ],
        },
      },
    },
    { status: 200 },
  );
}
