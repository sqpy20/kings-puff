import { getCatalogs, getProducts } from "@/lib/catalog-data";
import { LLMS_HEADERS, buildLlmsTxt } from "@/lib/llms";

export async function GET() {
  const [categories, products] = await Promise.all([
    getCatalogs(),
    getProducts(),
  ]);

  return new Response(buildLlmsTxt(categories, products), {
    status: 200,
    headers: LLMS_HEADERS,
  });
}
