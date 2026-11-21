import type { Metadata } from "next";
import CartView from "@/components/cart-view";
import Footer from "@/components/footer";
import Nav from "@/components/nav";

export const metadata: Metadata = {
  title: "Your bag",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <>
      <Nav />
      <CartView />
      <Footer />
    </>
  );
}
