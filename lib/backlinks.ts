"use client";

import { useMemo, useSyncExternalStore } from "react";

const ATTRIBUTION_KEY = "momo-eliquid-attribution";
const ATTRIBUTION_EVENT = "momo-eliquid-attribution-change";

export type AttributionTouch = {
  referrer?: string;
  ref?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  landingPath: string;
  timestamp: string;
};

export type AttributionRecord = {
  firstTouch?: AttributionTouch;
  lastTouch?: AttributionTouch;
};

const EMPTY_ATTRIBUTION: AttributionRecord = {};

function readRaw(): string {
  try {
    return window.localStorage.getItem(ATTRIBUTION_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeRaw(value: string) {
  try {
    window.localStorage.setItem(ATTRIBUTION_KEY, value);
  } catch {
    // Storage unavailable (private mode, quota): attribution is skipped.
  }
  window.dispatchEvent(new Event(ATTRIBUTION_EVENT));
}

function parseAttribution(raw: string): AttributionRecord {
  if (!raw) return EMPTY_ATTRIBUTION;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return EMPTY_ATTRIBUTION;
    return parsed as AttributionRecord;
  } catch {
    return EMPTY_ATTRIBUTION;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(ATTRIBUTION_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(ATTRIBUTION_EVENT, onChange);
  };
}

function externalReferrer(): string | undefined {
  const ref = document.referrer?.trim();
  if (!ref) return undefined;
  try {
    const refUrl = new URL(ref);
    if (refUrl.origin === window.location.origin) return undefined;
    return ref;
  } catch {
    return undefined;
  }
}

export function captureBacklinkAttribution() {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref")?.trim() || undefined;
  const utmSource = params.get("utm_source")?.trim() || undefined;
  const utmMedium = params.get("utm_medium")?.trim() || undefined;
  const utmCampaign = params.get("utm_campaign")?.trim() || undefined;
  const utmTerm = params.get("utm_term")?.trim() || undefined;
  const utmContent = params.get("utm_content")?.trim() || undefined;
  const referrer = externalReferrer();

  if (
    !referrer &&
    !ref &&
    !utmSource &&
    !utmMedium &&
    !utmCampaign &&
    !utmTerm &&
    !utmContent
  ) {
    return;
  }

  const touch: AttributionTouch = {
    ...(referrer ? { referrer } : {}),
    ...(ref ? { ref } : {}),
    ...(utmSource ? { utmSource } : {}),
    ...(utmMedium ? { utmMedium } : {}),
    ...(utmCampaign ? { utmCampaign } : {}),
    ...(utmTerm ? { utmTerm } : {}),
    ...(utmContent ? { utmContent } : {}),
    landingPath: window.location.pathname,
    timestamp: new Date().toISOString(),
  };

  const current = parseAttribution(readRaw());
  const next: AttributionRecord = {
    firstTouch: current.firstTouch ?? touch,
    lastTouch: touch,
  };
  writeRaw(JSON.stringify(next));
}

export function useAttribution(): AttributionRecord {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(),
    () => "",
  );
  return useMemo(() => parseAttribution(raw), [raw]);
}
