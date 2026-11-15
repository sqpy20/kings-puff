import type { Metadata } from "next";
import CheckoutView from "@/components/checkout-view";
import Footer from "@/components/footer";
import Nav from "@/components/nav";

export const metadata: Metadata = {
  title: "Checkout · Kings Puff",
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
