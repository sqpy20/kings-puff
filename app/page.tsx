import type { Metadata } from "next";
import Bundle from "@/components/bundle";
import Categories from "@/components/categories";
import Faq from "@/components/faq";
import Footer from "@/components/footer";
import Hero from "@/components/hero";
import JsonLd from "@/components/json-ld";
import Lineup from "@/components/lineup";
import Nav from "@/components/nav";
import Story from "@/components/story";
import { faqs } from "@/lib/faqs";
import {
  SITE_DESCRIPTION,
  buildMetadata,
  faqJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  path: "/",
  description: SITE_DESCRIPTION,
});

export default function Home() {
  return (
    <>
      <JsonLd data={[websiteJsonLd(), faqJsonLd(faqs)]} />
      <Nav />
      <main>
        <Hero />
        <Categories />
        <Lineup />
        <Bundle />
        <Story />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
