import type { Metadata } from "next";
import CheckoutView from "@/components/checkout-view";
import Footer from "@/components/footer";
import Nav from "@/components/nav";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <Nav />
      <CheckoutView />
      <Footer />
    </>
  );
}
