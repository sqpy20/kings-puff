import type { Metadata } from "next";
import Contact from "@/components/contact";
import Faq from "@/components/faq";
import Footer from "@/components/footer";
import JsonLd from "@/components/json-ld";
import Nav from "@/components/nav";
import { faqs } from "@/lib/faqs";
import { breadcrumbJsonLd, buildMetadata, faqJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "FAQ",
  description:
    "Answers on 18+ age verification, UK delivery times, free shipping over £50, product potency, batch testing, and returns at Momo Eliquid.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(faqs),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
        ]}
      />
      <Nav />
      <main>
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
