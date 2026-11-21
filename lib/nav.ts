// "Products" covers the all-products page and individual category pages.
export const navLinks = [
  {
    href: "/shop",
    label: "Products",
    match: (p: string) => p === "/shop" || p.startsWith("/shop/"),
  },
  { href: "/about", label: "About", match: (p: string) => p === "/about" },
  { href: "/faq", label: "FAQ", match: (p: string) => p === "/faq" },
];
