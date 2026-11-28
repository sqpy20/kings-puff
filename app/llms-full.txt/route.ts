import { getCatalogs, getProducts } from "@/lib/catalog-data";
import { LLMS_HEADERS, buildLlmsFullTxt } from "@/lib/llms";

export async function GET() {
  const [categories, products] = await Promise.all([
    getCatalogs(),
    getProducts(),
  ]);

  return new Response(buildLlmsFullTxt(categories, products), {
    status: 200,
    headers: LLMS_HEADERS,
  });
}
