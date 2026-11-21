"use client";

import { useEffect } from "react";
import { captureBacklinkAttribution } from "@/lib/backlinks";

export default function BacklinkTracker() {
  useEffect(() => {
    captureBacklinkAttribution();
  }, []);

  return null;
}
