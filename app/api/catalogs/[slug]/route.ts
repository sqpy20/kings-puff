import { getCatalogBySlug, getProducts } from "@/lib/catalog-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const [catalog, products] = await Promise.all([
    getCatalogBySlug(slug),
    getProducts(slug),
  ]);
  if (!catalog) {
    return Response.json({ error: "Catalog not found" }, { status: 404 });
  }
  return Response.json({ catalog, products }, { status: 200 });
}
