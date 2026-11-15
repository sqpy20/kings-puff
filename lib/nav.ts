// "Shop" is the all-products page; "Collections" opens the first collection
// and stays highlighted on any single-collection page.
export const navLinks = [
  { href: "/shop", label: "Shop", match: (p: string) => p === "/shop" },
  {
    href: "/shop/thc-gummies",
    label: "Collections",
    match: (p: string) => p.startsWith("/shop/"),
  },
  { href: "/about", label: "About", match: (p: string) => p === "/about" },
  { href: "/faq", label: "FAQ", match: (p: string) => p === "/faq" },
];
