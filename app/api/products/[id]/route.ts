import { getProductById } from "@/lib/catalog-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }
  return Response.json({ product }, { status: 200 });
}
