import { requireAdminApi } from "@/lib/auth/admin";
import {
  catalogErrorResponse,
  deleteCatalog,
  parseJsonBody,
  updateCatalog,
} from "@/lib/catalog-data";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const gate = await requireAdminApi();
  if ("response" in gate) return gate.response;

  try {
    const { slug } = await params;
    const body = await parseJsonBody(request);
    const catalog = await updateCatalog(slug, body);
    return Response.json({ catalog }, { status: 200 });
  } catch (err) {
    return catalogErrorResponse(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const gate = await requireAdminApi();
  if ("response" in gate) return gate.response;

  try {
    const { slug } = await params;
    const result = await deleteCatalog(slug);
    return Response.json(result, { status: 200 });
  } catch (err) {
    return catalogErrorResponse(err);
  }
}
