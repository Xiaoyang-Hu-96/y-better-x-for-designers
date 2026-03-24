"use client";

import { useState, useEffect } from "react";

const PREVIEW_HIGH_PRIORITY_COUNT = 5;

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

  const screenshotSrc = localImg
    ? localImg
    : `https://api.microlink.io/?url=${encodeURIComponent(
        url
      )}&screenshot=true&meta=false&embed=screenshot.url`;

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [screenshotSrc]);

  const resolvedPriority =
    fetchPriority !== "auto"
      ? fetchPriority
      : previewOrderIndex < PREVIEW_HIGH_PRIORITY_COUNT
        ? "high"
        : "auto";

  const eagerLoad = resolvedPriority === "high";

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
              src={screenshotSrc}
              alt=""
              fetchPriority={resolvedPriority === "high" ? "high" : undefined}
              loading={eagerLoad ? "eager" : "lazy"}
              decoding="async"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top",
                display: loaded ? "block" : "none",
              }}
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
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

        {(loaded || error) && (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
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
