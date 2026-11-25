import { getPaymentSettings } from "@/lib/orders";

/** Public endpoint returning non-sensitive checkout payment option hints. */
export async function GET() {
  const settings = await getPaymentSettings();
  return Response.json(
    {
      giftCardCheckoutHint: settings.giftCardCheckoutHint,
      bankCheckoutHint: settings.bankCheckoutHint,
    },
    { status: 200 },
  );
}
