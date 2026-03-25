"use client";

import { useState, useEffect, useMemo } from "react";
import { withBasePath } from "@/lib/site-url";

/** First N link previews per list: eager load + fetchPriority high (align with ~1 screen of cards). */
export const PREVIEW_HIGH_PRIORITY_COUNT = 9;
/** If the image never fires load/error (stalled CDN, lazy quirks), fall back */
const PREVIEW_STALL_MS = 13000;

function microlinkScreenshotUrl(pageUrl: string): string {
  const q = new URLSearchParams();
  q.set("url", pageUrl);
  q.set("screenshot", "true");
  q.set("meta", "false");
  q.set("embed", "screenshot.url");
  q.set("viewport.width", "720");
  q.set("viewport.height", "377");
  q.set("viewport.deviceScaleFactor", "1");
  return `https://api.microlink.io/?${q.toString()}`;
}

export function ScreenshotCard({
  url,
  domain,
  title,
  localImg,
  fetchPriority = "auto",
  previewOrderIndex = 999,
}: {
  url: string;
  domain: string;
  title: string;
  localImg?: string;
  /** When set, overrides automatic high priority for the first N previews */
  fetchPriority?: "high" | "low" | "auto";
  /** Zero-based index among link previews in the current list; first N get high fetch priority */
  previewOrderIndex?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [fallbackMicrolink, setFallbackMicrolink] = useState(false);

  const microlinkSrc = useMemo(() => microlinkScreenshotUrl(url), [url]);

  const screenshotSrc =
    localImg && !fallbackMicrolink ? localImg : microlinkSrc;

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [screenshotSrc]);

  useEffect(() => {
    setFallbackMicrolink(false);
  }, [localImg, url]);

  useEffect(() => {
    if (loaded || error) return;
    const id = window.setTimeout(() => {
      if (localImg && !fallbackMicrolink) setFallbackMicrolink(true);
      else setError(true);
    }, PREVIEW_STALL_MS);
    return () => window.clearTimeout(id);
  }, [screenshotSrc, localImg, fallbackMicrolink, loaded, error]);

  const resolvedPriority =
    fetchPriority !== "auto"
      ? fetchPriority
      : previewOrderIndex < PREVIEW_HIGH_PRIORITY_COUNT
        ? "high"
        : "auto";

  /** External og URLs + first N previews: avoid lazy + scroll-container edge cases */
  const eagerLoad = Boolean(localImg) || resolvedPriority === "high";

  const onImgError = () => {
    if (localImg && !fallbackMicrolink) {
      setFallbackMicrolink(true);
      return;
    }
    setError(true);
  };

  return (
    <div style={{ marginBottom: 10 }}>
      <div
        aria-busy={!loaded && !error}
        style={{
          border: "1px solid #cfd9de",
          borderRadius: 14,
          overflow: "hidden",
          width: "100%",
          aspectRatio: "1.91 / 1",
          background: "#f0f0f0",
          position: "relative",
        }}
      >
        {!error ? (
          <>
            {!loaded && (
              <div
                className="screenshot-preview-skeleton"
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 1,
                  pointerEvents: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 11, color: "#8899a6", fontWeight: 500 }}>
                  Loading preview…
                </span>
              </div>
            )}
            <img
              key={screenshotSrc}
              src={withBasePath(screenshotSrc)}
              alt=""
              referrerPolicy="no-referrer"
              fetchPriority={resolvedPriority === "high" ? "high" : undefined}
              loading={eagerLoad ? "eager" : "lazy"}
              decoding="async"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top",
                display: "block",
                opacity: loaded ? 1 : 0,
                transition: "opacity 0.22s ease-out",
                zIndex: 2,
                pointerEvents: "none",
              }}
              onLoad={() => setLoaded(true)}
              onError={onImgError}
            />
          </>
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              color: "#536471",
            }}
          >
            {domain}
          </div>
        )}

        {/* Show during load too — previously only when loaded||error, so lazy/slow previews had no chip */}
        {!error && (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              zIndex: 3,
              background: "rgba(0,0,0,0.77)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 6,
              padding: "4px 10px",
              maxWidth: "80%",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </div>
        )}
      </div>

      <div style={{ fontSize: 13, color: "#536471", marginTop: 5, paddingLeft: 2 }}>
        From {domain}
      </div>
    </div>
  );
}
