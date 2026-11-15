import Bundle from "@/components/bundle";
import Categories from "@/components/categories";
import Faq from "@/components/faq";
import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Lineup from "@/components/lineup";
import Nav from "@/components/nav";
import Story from "@/components/story";

export default function Home() {
  return (
    <>
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
