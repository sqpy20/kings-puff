import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Suspense } from "react";
import Footer from "@/components/footer";
import Nav from "@/components/nav";
import OrderReceivedView from "@/components/order-received-view";
import { getOrderByToken, getPaymentSettings } from "@/lib/orders";
import { buildCryptoPaymentUri } from "@/lib/payment";

export const metadata: Metadata = {
  title: "Order received",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ token: string }>;
};

async function OrderReceivedContent({ params }: Props) {
  const { token } = await params;
  const [order, settings] = await Promise.all([
    getOrderByToken(token),
    getPaymentSettings(),
  ]);

  if (!order) {
    notFound();
  }

  let qrDataUrl: string | null = null;
  if (
    order.paymentMethod === "crypto" &&
    order.cryptoCurrency &&
    order.cryptoAddress &&
    order.cryptoAmount
  ) {
    const uri = buildCryptoPaymentUri(
      order.cryptoCurrency,
      order.cryptoAddress,
      order.cryptoAmount,
    );
    qrDataUrl = await QRCode.toDataURL(uri, {
      width: 260,
      margin: 2,
      color: { dark: "#212121", light: "#ffffff" },
    });
  }

  return (
    <OrderReceivedView
      order={order}
      supportEmail={settings.supportEmail}
      qrDataUrl={qrDataUrl}
    />
  );
}

export default function OrderReceivedPage({ params }: Props) {
  return (
    <>
      <Nav />
      <Suspense
        fallback={
          <main className="shell min-h-[60vh] pt-8 pb-16 lg:pt-[30px] lg:pb-24">
            <div className="h-64 animate-pulse rounded-[28px] border-2 border-ink/20 bg-white" />
          </main>
        }
      >
        <OrderReceivedContent params={params} />
      </Suspense>
      <Footer />
    </>
  );
}
