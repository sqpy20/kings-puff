import type { NextRequest } from "next/server";
import { getFeaturedProducts, getProducts } from "@/lib/catalog-data";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category")?.trim() || undefined;
  const featured = searchParams.get("featured") === "true";
  const idsRaw = searchParams.get("ids")?.trim();

  let list = featured
    ? await getFeaturedProducts()
    : await getProducts(category);

  if (featured && category) {
    list = list.filter((p) => p.category === category);
  }

  if (idsRaw) {
    const wanted = new Set(
      idsRaw
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    );
    list = list.filter((p) => wanted.has(p.id));
  }

  return Response.json({ products: list }, { status: 200 });
}
