import type { Metadata } from "next";
import Contact from "@/components/contact";
import Footer from "@/components/footer";
import Nav from "@/components/nav";
import Story from "@/components/story";

export const metadata: Metadata = {
  title: "About · Momo Eliquid",
};

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main>
        <Story />
        <Contact padTop />
      </main>
      <Footer />
    </>
  );
}
