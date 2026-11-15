"use client";

import { useRef, useState } from "react";
import { addToCart } from "@/lib/cart";

export default function AddToBag({
  id,
  label = "Add to bag",
  className,
}: {
  id: string;
  label?: string;
  className: string;
}) {
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  return (
    <button
      type="button"
      className={`cursor-pointer ${className}`}
      onClick={() => {
        addToCart(id);
        setAdded(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setAdded(false), 1200);
      }}
    >
      <span aria-live="polite">{added ? "Added" : label}</span>
    </button>
  );
}
