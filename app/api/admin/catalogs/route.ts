import {
  requireAdminAnyPermission,
  requireAdminPermission,
} from "@/lib/auth/admin";
import {
  catalogErrorResponse,
  createCatalog,
  listAdminCatalogs,
  parseJsonBody,
} from "@/lib/catalog-data";

export async function GET() {
  const gate = await requireAdminAnyPermission([
    "catalog.read",
    "inventory.read",
    "overview.view",
  ]);
  if ("response" in gate) return gate.response;

  const catalogs = await listAdminCatalogs();
  return Response.json({ catalogs }, { status: 200 });
}

export async function POST(request: Request) {
  const gate = await requireAdminPermission("catalog.write");
  if ("response" in gate) return gate.response;

  try {
    const body = await parseJsonBody(request);
    const catalog = await createCatalog(body);
    return Response.json({ catalog }, { status: 201 });
  } catch (err) {
    return catalogErrorResponse(err);
  }
}
