"use client";

import { useState, useEffect, useMemo } from "react";
import { ResourceItem, isXAccount, getDomain } from "@/types";
import { UI_SANS } from "@/lib/ui-font";
import { withBasePath } from "@/lib/site-url";
import { ScreenshotCard } from "./ScreenshotCard";

/** Re-export so parents can import preview + card from one module (avoids duplicate Webpack entry edges). */
export { ScreenshotCard };

const COLORS = ["#1d9bf0", "#00ba7c", "#ff7a00", "#f91880", "#7856ff"];
const LIKES_KEY = "design-resources-likes";

function initials(name: string): string {
  return (
    name
      .replace(/[^\w\s]/g, "")
      .split(" ")
      .map((w) => w[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "XY"
  );
}

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return COLORS[h % COLORS.length];
}

function getLikedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(LIKES_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

function saveLikedSet(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LIKES_KEY, JSON.stringify([...set]));
  } catch {}
}

function seededRandom(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++)
    h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return (h % 80) + 20;
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function VerifiedBadge() {
  return (
    <svg viewBox="0 0 22 22" width={20} height={20} style={{ flexShrink: 0 }} aria-hidden="true">
      <path
        fill="#1d9bf0"
        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.44-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.136 2.14 4.279-4.573 1.338 1.256z"
      />
    </svg>
  );
}

// SVG action icons matching X's style
function IconComment() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
      <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z" />
    </svg>
  );
}

function IconRetweet() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
      <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" />
    </svg>
  );
}

const HEART_TRANSITION = "opacity 300ms cubic-bezier(0.2,0,0,1), transform 300ms cubic-bezier(0.2,0,0,1), filter 300ms cubic-bezier(0.2,0,0,1)";

function IconHeart({ filled }: { filled: boolean }) {
  return (
    <div style={{ position: "relative", width: 18, height: 18, flexShrink: 0 }} aria-hidden="true">
      {/* Filled heart — overlaid, cross-fades in */}
      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor"
        style={{ position: "absolute", inset: 0, opacity: filled ? 1 : 0, transform: filled ? "scale(1)" : "scale(0.25)", filter: filled ? "blur(0px)" : "blur(4px)", transition: HEART_TRANSITION }}>
        <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
      </svg>
      {/* Outline heart — defines layout, cross-fades out */}
      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor"
        style={{ opacity: filled ? 0 : 1, transform: filled ? "scale(0.25)" : "scale(1)", filter: filled ? "blur(4px)" : "blur(0px)", transition: HEART_TRANSITION }}>
        <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
      </svg>
    </div>
  );
}

function IconAnalytics() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
      <path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z" />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
      <path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16l-6-3-6 3V4z" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
    </svg>
  );
}

// Favicon avatar for resource cards
function FaviconAvatar({ domain, name }: { domain: string; name: string }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  const color = avatarColor(name);
  const letter = name.trim()[0]?.toUpperCase() || "?";

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [faviconUrl]);

  return (
    <div
      style={{
        position: "relative",
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: error ? color : "#fff",
        border: error ? "none" : "1.5px solid #eff3f4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {!error ? (
        <>
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              color: "rgba(15, 20, 25, 0.14)",
              pointerEvents: "none",
              zIndex: 0,
            }}
            aria-hidden
          >
            {letter}
          </span>
          <img
            src={faviconUrl}
            alt=""
            width={24}
            height={24}
            style={{
              position: "relative",
              zIndex: 1,
              objectFit: "contain",
              opacity: loaded ? 1 : 0,
              transition: "opacity 0.2s ease-out",
            }}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        </>
      ) : (
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", position: "relative", zIndex: 1 }}>
          {letter}
        </span>
      )}
    </div>
  );
}

// Action bar matching X's style
function ActionBar({
  id,
  baseLikes,
  baseComments,
}: {
  id: string;
  baseLikes: number;
  baseComments: number;
}) {
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    setIsLiked(getLikedSet().has(id));
  }, [id]);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const liked = getLikedSet();
    if (liked.has(id)) {
      liked.delete(id);
      setIsLiked(false);
    } else {
      liked.add(id);
      setIsLiked(true);
    }
    saveLikedSet(liked);
  };

  const baseViews = baseLikes * 30 + 200;

  const btnBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 4,
    color: "#536471",
    fontSize: 13,
    cursor: "pointer",
    border: "none",
    background: "none",
    padding: "4px 0",
    transition: "color 0.15s",
    userSelect: "none",
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
        width: "100%",
      }}
    >
      <button
        aria-label="Comment"
        style={btnBase}
        onClick={(e) => e.preventDefault()}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#1d9bf0")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#536471")}
      >
        <IconComment /> {baseComments}
      </button>

      <button
        aria-label="Retweet"
        style={btnBase}
        onClick={(e) => e.preventDefault()}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#00ba7c")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#536471")}
      >
        <IconRetweet /> {Math.floor(baseLikes * 0.3)}
      </button>

      <button
        aria-label={isLiked ? "Unlike" : "Like"}
        style={{ ...btnBase, color: isLiked ? "#f91880" : "#536471" }}
        onClick={handleLike}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#f91880")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = isLiked ? "#f91880" : "#536471")
        }
      >
        <IconHeart filled={isLiked} />
        {isLiked ? baseLikes + 1 : baseLikes}
      </button>

      <button
        aria-label="View analytics"
        style={btnBase}
        onClick={(e) => e.preventDefault()}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#1d9bf0")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#536471")}
      >
        <IconAnalytics /> {formatCount(baseViews)}
      </button>

      <button
        aria-label="Bookmark"
        style={btnBase}
        onClick={(e) => e.preventDefault()}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#1d9bf0")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#536471")}
      >
        <IconBookmark />
      </button>

      <button
        aria-label="Share"
        style={btnBase}
        onClick={(e) => e.preventDefault()}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#1d9bf0")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#536471")}
      >
        <IconShare />
      </button>
    </div>
  );
}

// ── X Account profile card ──
function XProfileCard({ item }: { item: ResourceItem }) {
  const handle = item.handle?.replace("@", "") ?? "";
  /** For X rows, `localImg` is the profile photo (path under /public or absolute URL). */
  const localAvatar = item.localImg?.trim() ?? "";
  const [localFailed, setLocalFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [bust, setBust] = useState(0);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const color = avatarColor(item.name);

  useEffect(() => {
    setAttempt(0);
    setBust(0);
    setLocalFailed(false);
    setAvatarLoaded(false);
    setAvatarFailed(false);
  }, [handle, localAvatar]);

  const avatarSrc = useMemo(() => {
    if (avatarFailed) return "";
    if (localAvatar && !localFailed) return localAvatar;
    if (!handle) return "";
    if (attempt === 0) return `https://unavatar.io/twitter/${handle}`;
    if (attempt === 1) return `https://unavatar.io/x/${handle}`;
    return `https://unavatar.io/twitter/${handle}?retry=${bust}`;
  }, [handle, localAvatar, localFailed, attempt, bust, avatarFailed]);

  useEffect(() => {
    if (!avatarSrc) return;
    setAvatarLoaded(false);
  }, [avatarSrc]);

  const onAvatarError = () => {
    if (localAvatar && !localFailed) {
      setLocalFailed(true);
      setAttempt(0);
      setBust(0);
      setAvatarLoaded(false);
      return;
    }
    if (attempt === 0) setAttempt(1);
    else if (attempt === 1) {
      setBust(Date.now());
      setAttempt(2);
    } else setAvatarFailed(true);
  };

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "12px 16px",
        borderBottom: "none",
        textDecoration: "none",
        color: "inherit",
        fontFamily: UI_SANS,
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f9f9")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Avatar */}
      <div
        aria-busy={Boolean(handle && !avatarFailed && !avatarLoaded)}
        style={{
          position: "relative",
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          fontWeight: 700,
          color: "#fff",
        }}
      >
        {handle && !avatarFailed ? (
          <>
            <span
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                color: "rgba(255,255,255,0.32)",
                pointerEvents: "none",
                zIndex: 0,
              }}
              aria-hidden
            >
              {initials(item.name)}
            </span>
            {!avatarLoaded && (
              <div
                className="avatar-loading-ring"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  marginLeft: -11,
                  marginTop: -11,
                  zIndex: 1,
                }}
                aria-hidden
              />
            )}
            <img
              key={`${avatarSrc}-${attempt}-${bust}-${localFailed}`}
              src={withBasePath(avatarSrc)}
              alt=""
              width={48}
              height={48}
              style={{
                position: "relative",
                zIndex: 2,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: avatarLoaded ? 1 : 0,
                transition: "opacity 0.22s ease-out",
              }}
              onLoad={() => setAvatarLoaded(true)}
              onError={onAvatarError}
            />
          </>
        ) : (
          <span style={{ position: "relative", zIndex: 1 }}>{initials(item.name)}</span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", lineHeight: 1.2 }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: 15,
              color: "#0f1419",
              letterSpacing: "-0.02em",
            }}
          >
            {item.name}
          </span>
          <VerifiedBadge />
          {item.handle === "@elenahuxy" && (
            <span
              style={{
                fontSize: 11,
                color: "#536471",
                background: "#eff3f4",
                border: "1px solid #cfd9de",
                borderRadius: 6,
                padding: "3px 8px",
                fontWeight: 700,
              }}
            >
              Sponsored
            </span>
          )}
          {item.tier === 1 && item.handle !== "@elenahuxy" && (
            <span
              style={{
                fontSize: 11,
                color: "#fff",
                background: "#1d9bf0",
                borderRadius: 6,
                padding: "3px 8px",
                fontWeight: 700,
              }}
            >
              Must follow
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 15,
            color: "#536471",
            marginTop: 2,
            marginBottom: 0,
            lineHeight: 1.2,
          }}
        >
          {item.handle}
        </div>
        {item.bio && (
          <div
            style={{
              fontSize: 15,
              color: "#0f1419",
              lineHeight: 1.35,
              marginTop: 2,
            }}
          >
            {item.bio}
          </div>
        )}
      </div>
    </a>
  );
}

// ── Regular resource card ──
export function TweetCard({
  item,
  index,
  previewOrderIndex = 999,
}: {
  item: ResourceItem;
  index: number;
  /** Index among non–X-account resource rows; first few get higher image fetch priority */
  previewOrderIndex?: number;
}) {
  const isX = isXAccount(item);

  if (isX) return <XProfileCard item={item} />;

  const domain = getDomain(item.url);
  const id = `${item.url}-${item.name}-${index}`;
  const baseLikes = seededRandom(item.url);
  const baseComments = Math.floor(baseLikes * 0.15);
  const isOwnPortfolioSite = /xiaoyanghu\.com/i.test(item.url);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        gap: 12,
        padding: "12px 16px",
        borderBottom: "1px solid #eff3f4",
        cursor: "pointer",
        transition: "background 0.1s",
        textDecoration: "none",
        color: "inherit",
        fontFamily: UI_SANS,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f9f9")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <FaviconAvatar domain={domain} name={item.name} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 3,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14, color: "#0f1419" }}>
            {item.name}
          </span>
          {item.tier === 1 && (
            <span
              style={
                isOwnPortfolioSite
                  ? {
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#536471",
                      background: "#eff3f4",
                      border: "1px solid #cfd9de",
                      borderRadius: 4,
                      padding: "2px 8px",
                      lineHeight: 1.2,
                    }
                  : {
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#fff",
                      background: "#1d9bf0",
                      borderRadius: 6,
                      padding: "3px 8px",
                    }
              }
            >
              {isOwnPortfolioSite ? "Sponsored" : "Must see"}
            </span>
          )}
        </div>

        {item.note && (
          <div
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              color: "#0f1419",
              marginBottom: 10,
              textWrap: "pretty" as const,
            }}
          >
            {item.note}
          </div>
        )}
        <ScreenshotCard
          url={item.url}
          domain={domain}
          title={item.name}
          localImg={item.localImg ?? undefined}
          previewOrderIndex={previewOrderIndex}
        />

        <ActionBar id={id} baseLikes={baseLikes} baseComments={baseComments} />
      </div>
    </a>
  );
}
