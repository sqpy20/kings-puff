import { getCatalogs } from "@/lib/catalog-data";

export async function GET() {
  const catalogs = await getCatalogs();
  return Response.json({ catalogs }, { status: 200 });
}
