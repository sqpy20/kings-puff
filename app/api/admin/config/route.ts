import { requireAdminApi } from "@/lib/auth/admin";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/catalog";
import { getAdminDbStats } from "@/lib/db";
import { SITE_LOCALE, SITE_NAME, SITE_URL } from "@/lib/seo";

/** Returns admin session details, live Lakebase DB metrics, and runtime infra metadata. */
export async function GET() {
  const gate = await requireAdminApi();
  if ("response" in gate) return gate.response;

  const database = await getAdminDbStats();

  return Response.json(
    {
      user: gate.user,
      database,
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
            "/api/catalogs",
            "/api/catalogs/[slug]",
            "/api/products",
            "/api/products/[id]",
          ],
          admin: [
            "/api/admin/session",
            "/api/admin/catalogs",
            "/api/admin/products",
            "/api/admin/config",
          ],
        },
      },
    },
    { status: 200 },
  );
}
