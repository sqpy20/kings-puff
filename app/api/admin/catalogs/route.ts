import { requireAdminApi } from "@/lib/auth/admin";
import {
  catalogErrorResponse,
  createCatalog,
  listAdminCatalogs,
  parseJsonBody,
} from "@/lib/catalog-data";

export async function GET() {
  const gate = await requireAdminApi();
  if ("response" in gate) return gate.response;

  const catalogs = await listAdminCatalogs();
  return Response.json({ catalogs }, { status: 200 });
}

export async function POST(request: Request) {
  const gate = await requireAdminApi();
  if ("response" in gate) return gate.response;

  try {
    const body = await parseJsonBody(request);
    const catalog = await createCatalog(body);
    return Response.json({ catalog }, { status: 201 });
  } catch (err) {
    return catalogErrorResponse(err);
  }
}
