import type { Metadata } from "next";
import CollectionView from "@/components/collection-view";

export const metadata: Metadata = {
  title: "Shop all · Kings Puff",
};

export default function ShopPage() {
  return <CollectionView />;
}
