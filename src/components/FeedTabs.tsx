"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TweetCard } from "./TweetCard";
import { ScreenshotCard } from "./ScreenshotCard";
import { ReplyCard } from "./ReplyCard";
import type { Category, ResourceItem } from "@/types";
import { getDomain, isXAccount } from "@/types";

interface HomePost {
  text: string;
  time: string;
  likes: number;
  comments: number;
  tag?: string;
  url?: string;
  urlLabel?: string;
  urlTitle?: string;
  localImg?: string;
  images?: string[];
}

const HOME_POSTS: HomePost[] = [
  {
    text: 'A few months ago I launched my design portfolio. It went further than I thought it would, and my DMs filled up with one question: "how did you make it?"\n\nSo I built this. Every resource, every tool, every reference that helped, with honest notes on why each one mattered.',
    time: "pinned",
    likes: 312,
    comments: 47,
  },
  {
    text: "How to use this:\n\n→ Pick a category from the left nav\n→ Items with a blue badge = my personal must-sees\n→ Click any card to visit the site\n→ Hit \"Suggest new\" to recommend a resource I might have missed\n\nSite is still being actively built, so some buttons might not work yet and there may be a few bugs. Found one? I'd love to know. 🙏",
    time: "1d",
    likes: 156,
    comments: 18,
  },
  {
    text: "The whole site is built in Framer.\n\nI like it because it lets me move fast, from a visual idea to something real and interactive, without getting blocked by engineering overhead. I'll occasionally add small bits of custom code for specific interactions, but Framer is the core.\n\nPro tip: you can ask AI to suggest animation parameters for Framer. Sometimes it's surprisingly good.",
    time: "2d",
    likes: 274,
    comments: 41,
  },
  {
    text: "I didn't start with a fixed visual style. I explored a lot: New Brutalism, nostalgic/retro, very minimal. I spent a long time just experimenting.\n\nThe direction only became clear over time. What helped: not forcing a \"signature style\" too early. I focused on clarity first, then consistency, and let the personality emerge through small decisions in spacing, typography, motion, and tone.",
    time: "3d",
    likes: 203,
    comments: 33,
  },
  {
    text: "If you're stuck on your portfolio style, I get it. It took me about 5 months from blank project to where I am now.\n\nGood ideas usually come from relaxed, unforced moments. It's genuinely hard to make strong visual decisions under constant pressure.\n\nStyle isn't something you lock in before as you build.",
    time: "4d",
    likes: 189,
    comments: 24,
  },
  {
    text: "What helped me most: looking closely at other designers' portfolios, not just the visuals, but how they tell stories.\n\nAlso Pinterest, for exploring different vibes without committing to anything. Over time, patterns start to emerge in what you're naturally drawn to. That's your style forming.",
    time: "5d",
    likes: 231,
    comments: 37,
  },
  {
    text: "fun fact 1: one of my biggest visual references wasn't a designer's portfolio.\n\nIt was a crypto invoicing startup called Acctual. Something about how they used space, typography, and motion just clicked for me in a way most design portfolios didn't.\n\nSometimes the best inspiration comes from completely unexpected places.",
    time: "6d",
    likes: 445,
    comments: 62,
    url: "https://acctual.com",
    urlLabel: "acctual.com",
    urlTitle: "Acctual",
    localImg: "/preview-acctual.png",
  },
  {
    text: "fun fact 2: a lot of the icons in my portfolio actually came from one place, thiings.co.\n\nThe whole collection has such a consistent visual style that I could drop them straight in without spending hours tweaking or regenerating in AI tools. Sometimes finding the right asset library saves more time than any workflow optimization.",
    time: "7d",
    likes: 367,
    comments: 51,
    url: "https://thiings.co/things",
    urlLabel: "thiings.co",
    urlTitle: "Thiings",
    localImg: "/preview-thiings.png",
  },
];

function homePostMatchesQuery(post: HomePost, q: string): boolean {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  const blob = [post.text, post.urlLabel, post.urlTitle, post.tag, post.url]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
  return blob.includes(n);
}

function resourceMatchesQuery(item: ResourceItem, q: string): boolean {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  const blob = [
    item.name,
    item.note,
    item.url,
    getDomain(item.url),
    item.handle,
    item.bio,
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
  return blob.includes(n);
}

const YAPPING_POSTS: HomePost[] = [
  {
    text: "I dug up my design files from two months ago and compared them to where things are now. Notice anything different? It's the shadows.\n\nI care a lot about shadows in portfolio design. They give flat layouts a sense of physical depth. The tricky part: Framer makes shadow adjustments genuinely painful, so while things are more consistent now, they're still not quite as natural as I'd like.\n\nAnd you will never guess how long it took me to get a natural-looking shadow on the iMac G3.",
    time: "2h",
    likes: 87,
    comments: 12,
    images: ["/yapping-shadow-before.png", "/yapping-shadow-after.png"],
  },
  {
    text: "Somehow my portfolio has hit 13K views. Thank you all.\n\nI even upgraded to Framer Pro for the first time. Also my first introduction to the concept of bandwidth.",
    time: "5h",
    likes: 214,
    comments: 31,
    images: ["/yapping-13k-analytics.png"],
  },
  {
    text: "I always get stuck on the small things for way too long. Both of these earlier versions? I actually liked them too. But for the sake of the overall experience, I had to let them go.",
    time: "1d",
    likes: 143,
    comments: 19,
    images: ["/yapping-rejected-1.png", "/yapping-rejected-2.png"],
  },
  {
    text: "Almost all the illustrations were generated with ChatGPT. Sometimes the most straightforward approach is the most effective one.",
    time: "2d",
    likes: 328,
    comments: 45,
    images: ["/yapping-ai-illustrations.png"],
  },
  {
    text: '"someone viewed your linkedin/portfolio"',
    time: "3d",
    likes: 576,
    comments: 63,
    images: ["/yapping-linkedin-meme.png"],
  },
  {
    text: "My productivity stack:",
    time: "4d",
    likes: 412,
    comments: 38,
    images: ["/yapping-stack-2.png", "/yapping-stack-1.png", "/yapping-stack-3.png"],
  },
];

const ME = {
  name: "Elena Hu",
  handle: "@elenahuxy",
  color: "#1d9bf0",
  initials: "XY",
  avatar: "/avatar.jpg",
};

const LIKES_KEY = "design-resources-likes";

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
      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor"
        style={{ position: "absolute", inset: 0, opacity: filled ? 1 : 0, transform: filled ? "scale(1)" : "scale(0.25)", filter: filled ? "blur(0px)" : "blur(4px)", transition: HEART_TRANSITION }}>
        <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
      </svg>
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

function ActionBar({
  id,
  likes,
  comments,
}: {
  id: string;
  likes: number;
  comments: number;
}) {
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    setIsLiked(getLikedSet().has(id));
  }, [id]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
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

  const baseViews = likes * 30 + 200;

  const formatCount = (n: number) =>
    n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "K" : String(n);

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
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, width: "100%" }}>
      <button aria-label="Comment" style={btnBase} onClick={(e) => e.preventDefault()}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#1d9bf0")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#536471")}>
        <IconComment /> {comments}
      </button>
      <button aria-label="Retweet" style={btnBase} onClick={(e) => e.preventDefault()}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#00ba7c")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#536471")}>
        <IconRetweet /> {Math.floor(likes * 0.3)}
      </button>
      <button aria-label={isLiked ? "Unlike" : "Like"} style={{ ...btnBase, color: isLiked ? "#f91880" : "#536471" }} onClick={handleLike}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#f91880")}
        onMouseLeave={(e) => (e.currentTarget.style.color = isLiked ? "#f91880" : "#536471")}>
        <IconHeart filled={isLiked} /> {isLiked ? likes + 1 : likes}
      </button>
      <button aria-label="View analytics" style={btnBase} onClick={(e) => e.preventDefault()}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#1d9bf0")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#536471")}>
        <IconAnalytics /> {formatCount(baseViews)}
      </button>
      <button aria-label="Bookmark" style={btnBase} onClick={(e) => e.preventDefault()}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#1d9bf0")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#536471")}>
        <IconBookmark />
      </button>
      <button aria-label="Share" style={btnBase} onClick={(e) => e.preventDefault()}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#1d9bf0")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#536471")}>
        <IconShare />
      </button>
    </div>
  );
}

function ClampedText({ text, maxLines = 4 }: { text: string; maxLines?: number }) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 21;
    setClamped(el.scrollHeight > lineHeight * maxLines + 2);
  }, [maxLines]);

  useEffect(() => {
    setExpanded(false);
  }, [text]);

  useEffect(() => {
    measure();
  }, [text, measure]);

  return (
    <div style={{ padding: "4px 16px 6px" }}>
      <div
        ref={ref}
        style={{
          fontSize: 15,
          color: "#536471",
          lineHeight: 1.5,
          whiteSpace: "pre-line",
          ...(!expanded && clamped
            ? {
                display: "-webkit-box",
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
              }
            : {}),
        }}
      >
        {text}
      </div>
      {clamped && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none",
            border: "none",
            color: "#1d9bf0",
            fontSize: 15,
            cursor: "pointer",
            padding: "4px 0 0",
            fontWeight: 400,
          }}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

/** Home (Build Log / Yapping) and portfolio (Sites / Platform) sub-tabs — same visual language. */
function subTabRowItemStyle(active: boolean): React.CSSProperties {
  return {
    padding: "14px 18px",
    fontSize: 14,
    fontWeight: active ? 700 : 400,
    color: active ? "#0f1419" : "#536471",
    cursor: "pointer",
    whiteSpace: "nowrap",
    borderBottom: active ? "2px solid #1d9bf0" : "2px solid transparent",
    transition: "color 0.15s",
  };
}

export function FeedTabs({
  mode,
  activeCategory,
  categories,
  resourceSearch = "",
  onCategoryChange,
  onModeChange,
}: {
  mode: "home" | "resources";
  activeCategory: number;
  categories: Category[];
  /** Client-side filter for the main column (resources + home timeline). */
  resourceSearch?: string;
  onCategoryChange?: (i: number) => void;
  onModeChange?: (m: "home" | "resources") => void;
}) {
  const [homeSubTab, setHomeSubTab] = useState<"buildlog" | "yapping">("buildlog");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [portfolioSubTab, setPortfolioSubTab] = useState<"sites" | "platform">("sites");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [homeBannerDismissed, setHomeBannerDismissed] = useState(false);
  const [bannerToast, setBannerToast] = useState(false);

  useEffect(() => {
    setPortfolioSubTab("sites");
  }, [activeCategory]);

  // ── HOME VIEW ──
  if (mode === "home") {
    const homePostsFiltered = HOME_POSTS.filter((p) => homePostMatchesQuery(p, resourceSearch));
    const yappingFiltered = YAPPING_POSTS.filter((p) => homePostMatchesQuery(p, resourceSearch));
    const searchActive = resourceSearch.trim().length > 0;

    return (
      <>
        <div
          style={{
            position: "sticky",
            top: 0,
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #eff3f4",
            zIndex: 10,
          }}
        >
          <div
            style={{
              padding: "32px 16px 0",
              fontSize: 24,
              fontWeight: 800,
              color: "#0f1419",
            }}
          >
            Welcome to Y!
          </div>
          <div
            style={{ padding: "2px 16px 0", fontSize: 15, color: "#536471", whiteSpace: "pre-line" }}
          >
            X, but your feed is actually useful.{"\n"}How I built a portfolio people actually notice, and every resource that helped.
          </div>
          {!homeBannerDismissed && (
            <div style={{
              margin: "10px 16px 0",
              background: "#d4f0e0",
              borderRadius: 16,
              padding: "16px 20px",
              position: "relative",
            }}>
              <button
                onClick={() => setHomeBannerDismissed(true)}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "#536471",
                  lineHeight: 1,
                  padding: 4,
                }}
              >
                ×
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 20, fontWeight: 700, color: "#0f1419", marginBottom: 10, lineHeight: 1.3, paddingRight: 28 }}>
                New here? Here&apos;s the quick version
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={22} height={22} style={{ flexShrink: 0 }}>
                  <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 0 1 9.75 22.5a.75.75 0 0 1-.75-.75v-4.131A15.838 15.838 0 0 1 6.382 15H2.25a.75.75 0 0 1-.75-.75 6.75 6.75 0 0 1 7.815-6.666ZM15 6.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" clipRule="evenodd" />
                  <path d="M5.26 17.242a.75.75 0 1 0-.897-1.203 5.243 5.243 0 0 0-2.05 5.022.75.75 0 0 0 .625.627 5.243 5.243 0 0 0 5.022-2.051.75.75 0 1 0-1.202-.897 3.744 3.744 0 0 1-3.008 1.51c0-1.23.592-2.323 1.51-3.008Z" />
                </svg>
              </div>
              <div style={{ fontSize: 15, color: "#536471", lineHeight: 1.7 }}>
                This is a design resource library disguised as X. Whether you're a designer, a vibe coder, or just someone who appreciates well-made things, there's something here for you.
              </div>
            </div>
          )}
          <div style={{ display: "flex" }}>
            <div
              style={{
                ...subTabRowItemStyle(homeSubTab === "buildlog"),
                flex: 1,
                textAlign: "center",
              }}
              onClick={() => setHomeSubTab("buildlog")}
            >
              Build Log
            </div>
            <div
              style={{
                ...subTabRowItemStyle(homeSubTab === "yapping"),
                flex: 1,
                textAlign: "center",
              }}
              onClick={() => setHomeSubTab("yapping")}
            >
              Yapping
            </div>
          </div>
        </div>

        {homeSubTab === "buildlog" && (
          <>
            {searchActive && homePostsFiltered.length === 0 && (
              <div
                style={{
                  padding: "48px 24px",
                  textAlign: "center",
                  fontSize: 15,
                  color: "#536471",
                  lineHeight: 1.5,
                  borderBottom: "1px solid #eff3f4",
                }}
              >
                No posts match &quot;{resourceSearch.trim()}&quot;
              </div>
            )}
            {/* Home posts (thread style) */}
            {homePostsFiltered.map((post, i) => {
              const linkPreviewsBefore = homePostsFiltered
                .slice(0, i)
                .filter((p) => Boolean(p.url)).length;
              return (
              <div
                key={i}
                style={{
                  padding: post.time === "pinned" ? "0 16px 0" : "0 16px",
                  borderBottom: "1px solid #eff3f4",
                  cursor: "pointer",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f7f9f9")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {post.time === "pinned" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      paddingLeft: 52,
                      paddingTop: 12,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#536471",
                    }}
                  >
                    <img src="/pinned.svg" alt="" style={{ width: 16, height: 16 }} />
                    Pinned
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    paddingTop: post.time === "pinned" ? 4 : 12,
                    paddingBottom: 12,
                  }}
                >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: ME.color,
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    <img src={ME.avatar} alt={ME.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  {i < HOME_POSTS.length - 1 && (
                    <div
                      style={{
                        width: 2,
                        background: "#cfd9de",
                        margin: "4px auto",
                        flex: 1,
                        minHeight: 12,
                      }}
                    />
                  )}
                </div>
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
                    <span
                      style={{ fontWeight: 700, fontSize: 15, color: "#0f1419" }}
                    >
                      {ME.name}
                    </span>

                    <span style={{ fontSize: 15, color: "#536471" }}>
                      {ME.handle}
                    </span>
                    {post.tag ? (
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 11,
                          color: "#536471",
                          background: "#eff3f4",
                          border: "1px solid #cfd9de",
                          borderRadius: 10,
                          padding: "2px 8px",
                        }}
                      >
                        {post.tag}
                      </span>
                    ) : post.time !== "pinned" ? (
                      <>
                        <span style={{ color: "#536471", fontSize: 11 }}>·</span>
                        <span style={{ fontSize: 13, color: "#536471" }}>
                          {post.time}
                        </span>
                      </>
                    ) : null}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      lineHeight: 1.5,
                      color: "#0f1419",
                      marginBottom: 10,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: post.text.replace(/\n/g, "<br>"),
                    }}
                  />
                  {post.url && post.urlTitle && post.urlLabel && (
                    <ScreenshotCard
                      url={post.url}
                      domain={post.urlLabel}
                      title={post.urlTitle}
                      localImg={post.localImg}
                      previewOrderIndex={linkPreviewsBefore}
                    />
                  )}
                  <ActionBar
                    id={`home-${i}`}
                    likes={post.likes}
                    comments={post.comments}
                  />
                </div>
                </div>
              </div>
            );
            })}
          </>
        )}

        {lightboxImg && (
          <div
            onClick={() => setLightboxImg(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "zoom-out",
            }}
          >
            <img
              src={lightboxImg}
              alt=""
              style={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
          </div>
        )}

        {homeSubTab === "yapping" && (
          <>
            {searchActive && yappingFiltered.length === 0 && (
              <div
                style={{
                  padding: "48px 24px",
                  textAlign: "center",
                  fontSize: 15,
                  color: "#536471",
                  lineHeight: 1.5,
                  borderBottom: "1px solid #eff3f4",
                }}
              >
                No posts match &quot;{resourceSearch.trim()}&quot;
              </div>
            )}
            {yappingFiltered.map((post, i) => (
              <div
                key={i}
                style={{
                  padding: "0 16px",
                  borderBottom: "1px solid #eff3f4",
                  cursor: "pointer",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f7f9f9")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    paddingTop: 12,
                    paddingBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: ME.color,
                        flexShrink: 0,
                        overflow: "hidden",
                      }}
                    >
                      <img src={ME.avatar} alt={ME.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    {i < YAPPING_POSTS.length - 1 && (
                      <div
                        style={{
                          width: 2,
                          background: "#cfd9de",
                          margin: "4px auto",
                          flex: 1,
                          minHeight: 12,
                        }}
                      />
                    )}
                  </div>
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
                      <span style={{ fontWeight: 700, fontSize: 15, color: "#0f1419" }}>
                        {ME.name}
                      </span>
                      <span style={{ fontSize: 15, color: "#536471" }}>
                        {ME.handle}
                      </span>
                      <span style={{ color: "#536471", fontSize: 11 }}>·</span>
                      <span style={{ fontSize: 13, color: "#536471" }}>
                        {post.time}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        lineHeight: 1.5,
                        color: "#0f1419",
                        marginBottom: 10,
                      }}
                      dangerouslySetInnerHTML={{
                        __html: post.text.replace(/\n/g, "<br>"),
                      }}
                    />
                    {post.images && post.images.length === 1 && (
                      <div
                        style={{
                          borderRadius: 14,
                          overflow: "hidden",
                          border: "1px solid #cfd9de",
                          marginBottom: 10,
                        }}
                      >
                        <img
                          src={post.images[0]}
                          alt=""
                          onClick={(e) => { e.stopPropagation(); setLightboxImg(post.images![0]); }}
                          style={{
                            width: "100%",
                            aspectRatio: "16 / 9",
                            objectFit: "cover",
                            display: "block",
                            cursor: "zoom-in",
                          }}
                        />
                      </div>
                    )}
                    {post.images && post.images.length === 2 && (
                      <div
                        style={{
                          display: "flex",
                          gap: 2,
                          borderRadius: 14,
                          overflow: "hidden",
                          border: "1px solid #cfd9de",
                          marginBottom: 10,
                          height: 286,
                        }}
                      >
                        {post.images.map((img, j) => (
                          <img
                            key={j}
                            src={img}
                            alt=""
                            onClick={(e) => { e.stopPropagation(); setLightboxImg(img); }}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              objectFit: "cover",
                              display: "block",
                              cursor: "zoom-in",
                            }}
                          />
                        ))}
                      </div>
                    )}
                    {post.images && post.images.length >= 3 && (
                      <div
                        style={{
                          display: "flex",
                          gap: 2,
                          borderRadius: 14,
                          overflow: "hidden",
                          border: "1px solid #cfd9de",
                          marginBottom: 10,
                          height: 286,
                        }}
                      >
                        <img
                          src={post.images[0]}
                          alt=""
                          onClick={(e) => { e.stopPropagation(); setLightboxImg(post.images![0]); }}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            objectFit: "cover",
                            display: "block",
                            cursor: "zoom-in",
                          }}
                        />
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                          <img
                            src={post.images[1]}
                            alt=""
                            onClick={(e) => { e.stopPropagation(); setLightboxImg(post.images![1]); }}
                            style={{
                              flex: 1,
                              minHeight: 0,
                              width: "100%",
                              objectFit: "cover",
                              display: "block",
                              cursor: "zoom-in",
                            }}
                          />
                          <img
                            src={post.images[2]}
                            alt=""
                            onClick={(e) => { e.stopPropagation(); setLightboxImg(post.images![2]); }}
                            style={{
                              flex: 1,
                              minHeight: 0,
                              width: "100%",
                              objectFit: "cover",
                              display: "block",
                              cursor: "zoom-in",
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <ActionBar
                      id={`yapping-${i}`}
                      likes={post.likes}
                      comments={post.comments}
                    />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </>
    );
  }

  // ── RESOURCES VIEW ──
  const cat = categories[activeCategory];
  const isPortfolio = cat?.id === "portfolio-inspiration";
  const isXBloggers = cat?.id === "x-bloggers";
  const platformCat = categories.find((c) => c.id === "portfolio-platforms");

  const copyFollowAll = () => {
    const handles = categories.find((c) => c.id === "x-bloggers")?.items.map((i) => i.handle).filter(Boolean).join(" ") ?? "";
    const prompt = `I want to follow a list of designers on X (Twitter). Please help me follow all of them one by one using your browser tools.\n\nHere are all the handles:\n${handles}\n\nPlease go to each profile on x.com and click the Follow button. Work through the list in order.`;
    navigator.clipboard.writeText(prompt).then(() => {
      setBannerToast(true);
      setTimeout(() => setBannerToast(false), 4000);
    });
  };

  const activeCat = isPortfolio && portfolioSubTab === "platform" ? platformCat : cat;

  const PINNED: { url: string; position: number }[] = [
    { url: "https://www.unicorn.studio/", position: 1 },
    { url: "https://www.interfacecraft.dev/", position: 2 },
  ];

  const sortedItems = (() => {
    if (!activeCat) return [];
    const sorted = [...activeCat.items].sort((a, b) => {
      const rank = (item: { tier: number; handle?: string | null }) => {
        if (item.tier === 1) return 0;
        if (item.handle === "@elenahuxy") return 0.5;
        return 1;
      };
      return rank(a) - rank(b);
    });
    for (const pin of PINNED) {
      const idx = sorted.findIndex((item) => item.url === pin.url);
      if (idx !== -1 && idx !== pin.position) {
        const [item] = sorted.splice(idx, 1);
        sorted.splice(pin.position, 0, item);
      }
    }
    return sorted;
  })();

  const searchActive = resourceSearch.trim().length > 0;
  const displayItems = searchActive
    ? sortedItems.filter((item) => resourceMatchesQuery(item, resourceSearch))
    : sortedItems;

  return (
    <>
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            padding: "32px 16px 0",
            fontSize: 24,
            fontWeight: 800,
            color: "#0f1419",
          }}
        >
          {cat?.label || "Resources"}
        </div>
        {cat?.description && !isPortfolio && (
          <ClampedText key={cat.id} text={cat.description} />
        )}
        {isPortfolio && (
          <ClampedText
            key="portfolio-desc"
            text={"Hot take: if a portfolio looks impossibly well-designed to you, you probably haven't seen enough yet.\n\nDesign is fundamentally about combining elements in a clever way. Once you recognize the patterns, building your own starts feeling like a puzzle you already know how to solve."}
          />
        )}
        {isPortfolio && (
          <div role="tablist" style={{ display: "flex" }}>
            <button
              role="tab"
              aria-selected={portfolioSubTab === "sites"}
              type="button"
              style={{
                flexGrow: 1,
                flexBasis: 0,
                flexShrink: 0,
                textAlign: "center",
                margin: 0,
                font: "inherit",
                background: "none",
                borderLeft: "none",
                borderTop: "none",
                borderRight: "none",
                ...subTabRowItemStyle(portfolioSubTab === "sites"),
              }}
              onClick={() => setPortfolioSubTab("sites")}
            >
              Sites
            </button>
            <button
              role="tab"
              aria-selected={portfolioSubTab === "platform"}
              type="button"
              style={{
                flexGrow: 1,
                flexBasis: 0,
                flexShrink: 0,
                textAlign: "center",
                margin: 0,
                font: "inherit",
                background: "none",
                borderLeft: "none",
                borderTop: "none",
                borderRight: "none",
                ...subTabRowItemStyle(portfolioSubTab === "platform"),
              }}
              onClick={() => setPortfolioSubTab("platform")}
            >
              Platform
            </button>
          </div>
        )}

        {/* Follow all banner for X Accounts */}
        {isXBloggers && !bannerDismissed && (
        <div style={{
          margin: "8px 16px 0",
          background: "#d4f0e0",
          borderRadius: 16,
          padding: "16px 20px",
          position: "relative",
        }}>
          <button
            aria-label="Dismiss"
            onClick={() => setBannerDismissed(true)}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              color: "#536471",
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 20, fontWeight: 700, color: "#0f1419", marginBottom: 8, lineHeight: 1.3, paddingRight: 28, textWrap: "balance" } as React.CSSProperties}>
            Follow all in one prompt
            <img src="/follow.svg" alt="" style={{ width: 20, height: 20 }} />
          </div>
          <div style={{ fontSize: 15, color: "#536471", marginBottom: 16, lineHeight: 1.5, textWrap: "pretty" } as React.CSSProperties}>
            Copy the prompt and paste it into Claude or any browser AI agent. It will follow everyone for you. Or{" "}
            <a
              href="https://x.com/i/lists/2035576127285325952?s=20"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0f1419", textDecoration: "none", fontWeight: 700 }}
            >
              follow the X List
            </a>
            {" "}(subscribes to the feed, not individual accounts).
          </div>
          <button
            aria-label="Copy AI prompt to clipboard"
            onClick={copyFollowAll}
            className="btn-press"
            style={{
              padding: "10px 20px",
              borderRadius: 50,
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              background: "#0f1419",
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s, transform 0.15s ease-out",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#272c30")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0f1419")}
          >
            Copy AI Prompt
          </button>
          <div aria-live="polite" aria-atomic="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
            {bannerToast ? "Prompt copied to clipboard" : ""}
          </div>
          {bannerToast && (
            <div style={{
              position: "fixed",
              bottom: 32,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#1d9bf0",
              color: "#fff",
              padding: "12px 20px",
              borderRadius: 50,
              fontSize: 14,
              fontWeight: 600,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              zIndex: 9999,
              whiteSpace: "nowrap",
            }}>
              Prompt copied ✦ Paste it into Claude or a browser agent to auto-follow everyone
            </div>
          )}
        </div>
        )}
        {!isPortfolio && <div style={{ borderBottom: "1px solid #eff3f4", marginTop: 12 }} />}
      </div>

      {searchActive && displayItems.length === 0 && activeCat && (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            fontSize: 15,
            color: "#536471",
            lineHeight: 1.5,
            borderBottom: "1px solid #eff3f4",
          }}
        >
          No resources in {activeCat.label} match &quot;{resourceSearch.trim()}&quot;
        </div>
      )}

      {displayItems.map((item, i) => {
        const screenshotPreviewBefore = displayItems
          .slice(0, i)
          .filter((it) => !isXAccount(it)).length;
        return (
        <div key={`${activeCat!.id}-${item.url}-${i}`}>
          <TweetCard
            item={item}
            index={i}
            previewOrderIndex={screenshotPreviewBefore}
          />
          {item.url === "https://reactbits.dev/" && (
            <ReplyCard
              replyingTo="reactbits"
              time="2h"
              text={"Tip: you can use these in Framer too.\n\nJust copy the component code, paste it into an AI like Claude, and ask it to convert it into a Framer-compatible component. Then add the output as a new code file in Framer. Done."}
            />
          )}
          {item.url === "https://www.unicorn.studio/" && (
            <ReplyCard
              replyingTo="unicornstudio"
              time="5h"
              text={"Don't stress. A lot of those jaw-dropping portfolio headers you've seen from top designers? They probably came from this tool.\n\nThat said, I'd be intentional about using flashy effects. Think about whether it actually fits your portfolio's overall style, and whether there's a real reason to use it beyond \"it looks cool.\" The best portfolios use effects with purpose, not just because they can."}
            />
          )}
          {item.url === "https://remixlab.framer.wiki/" && (
            <ReplyCard
              replyingTo="remixlab"
              time="3h"
              text={"That Polaroid component everyone loves on my portfolio? It came from here. I spent a long time looking for the right one, tried a bunch of different versions, and this ended up being my favorite."}
            />
          )}
        </div>
        );
      })}
    </>
  );
}
