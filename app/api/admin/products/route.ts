import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import {
  catalogErrorResponse,
  createProduct,
  listAdminProducts,
  parseJsonBody,
} from "@/lib/catalog-data";

export async function GET(request: NextRequest) {
  const gate = await requireAdminApi();
  if ("response" in gate) return gate.response;

  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category")?.trim() || undefined;
  const search = searchParams.get("search")?.trim() || undefined;

  const products = await listAdminProducts({ category, search });
  return Response.json({ products }, { status: 200 });
}

export async function POST(request: Request) {
  const gate = await requireAdminApi();
  if ("response" in gate) return gate.response;

  try {
    const body = await parseJsonBody(request);
    const product = await createProduct(body);
    return Response.json({ product }, { status: 201 });
  } catch (err) {
    return catalogErrorResponse(err);
  }
}
