import type { Metadata } from "next";
import Contact from "@/components/contact";
import Faq from "@/components/faq";
import Footer from "@/components/footer";
import Nav from "@/components/nav";

export const metadata: Metadata = {
  title: "FAQ · Momo Eliquid",
};

export default function FaqPage() {
  return (
    <>
      <Nav />
      <main>
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
