import type { Metadata } from "next";
import Contact from "@/components/contact";
import Footer from "@/components/footer";
import JsonLd from "@/components/json-ld";
import Nav from "@/components/nav";
import Story from "@/components/story";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description:
    "Discover how Momo Eliquid crafts UK-made e-liquids, ExPod Pro pods, dosed gummies, and small-batch Kush with clear labelling and fast UK dispatch.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <Nav />
      <main>
        <Story />
        <Contact padTop />
      </main>
      <Footer />
    </>
  );
}
