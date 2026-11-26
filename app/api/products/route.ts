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

  const hasPagination =
    searchParams.has("page") ||
    searchParams.has("limit") ||
    searchParams.has("pageSize");

  if (!hasPagination) {
    return Response.json({ products: list }, { status: 200 });
  }

  const rawPage = Number(searchParams.get("page") ?? "1");
  const rawLimit = Number(
    searchParams.get("limit") ?? searchParams.get("pageSize") ?? "12",
  );
  const pageSize =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(100, Math.floor(rawLimit))
      : 12;
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page =
    Number.isFinite(rawPage) && rawPage > 0
      ? Math.min(Math.floor(rawPage), totalPages)
      : 1;
  const offset = (page - 1) * pageSize;

  return Response.json(
    {
      products: list.slice(offset, offset + pageSize),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
    { status: 200 },
  );
}
