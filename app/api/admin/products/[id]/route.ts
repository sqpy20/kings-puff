import { requireAdminApi } from "@/lib/auth/admin";
import {
  catalogErrorResponse,
  deleteProduct,
  parseJsonBody,
  updateProduct,
} from "@/lib/catalog-data";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminApi();
  if ("response" in gate) return gate.response;

  try {
    const { id } = await params;
    const body = await parseJsonBody(request);
    const product = await updateProduct(id, body);
    return Response.json({ product }, { status: 200 });
  } catch (err) {
    return catalogErrorResponse(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminApi();
  if ("response" in gate) return gate.response;

  try {
    const { id } = await params;
    const result = await deleteProduct(id);
    return Response.json(result, { status: 200 });
  } catch (err) {
    return catalogErrorResponse(err);
  }
}
