import type { Metadata } from "next";
import CollectionView from "@/components/collection-view";

export const metadata: Metadata = {
  title: "Shop all · Momo Eliquid",
};

export default function ShopPage() {
  return <CollectionView />;
}
