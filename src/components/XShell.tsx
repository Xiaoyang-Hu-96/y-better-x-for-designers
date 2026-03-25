"use client";

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { FeedTabs } from "./FeedTabs";
import { SuggestModal } from "./SuggestModal";
import { PollCard } from "./PollCard";
import type { Category } from "@/types";
import dataJson from "@/lib/data.json";
import { UI_SANS } from "@/lib/ui-font";
import { withBasePath } from "@/lib/site-url";

const CATEGORIES: Category[] = (dataJson as { categories: Category[] }).categories ?? [];

const COPY_AI_PROMPT_TOAST_STYLE: CSSProperties = {
  position: "fixed",
  top: "max(16px, env(safe-area-inset-top, 0px))",
  left: "50%",
  transform: "translateX(-50%)",
  boxSizing: "border-box",
  maxWidth: "min(calc(100vw - 24px), 560px)",
  background: "#1d9bf0",
  color: "#fff",
  padding: "12px 20px",
  borderRadius: 50,
  fontSize: 14,
  fontWeight: 600,
  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  zIndex: 100000,
  textAlign: "center",
  lineHeight: 1.35,
};

const SKILL_INSTALL_CMD = "npx skills add Xiaoyang-Hu-96/design-resource-library";

/** Visual line breaks at `/` only; copy still uses full SKILL_INSTALL_CMD. */
function SkillInstallDisplay() {
  const i = SKILL_INSTALL_CMD.indexOf("/");
  if (i < 0) return <>{SKILL_INSTALL_CMD}</>;
  return (
    <>
      {SKILL_INSTALL_CMD.slice(0, i)}
      <wbr />/<wbr />
      {SKILL_INSTALL_CMD.slice(i + 1)}
    </>
  );
}

const SHORT_LABELS: Record<string, string> = {
  "x-bloggers": "X Accounts",
  "design-inspiration": "Inspirations",
  "ui-components": "UI Components",
  "framer-resources": "Framer",
  "portfolio-inspiration": "Portfolios",
  "portfolio-platforms": "Platforms",
};

const ACCOUNT_MENU_ITEMS: { label: string; href: string }[] = [
  { label: "Open profile on X", href: "https://x.com/elenahuxy" },
  { label: "Personal site", href: "https://xiaoyanghu.com" },
];

/** Popover `minWidth` in styles; used to clamp fixed position so the bubble stays in the viewport. */
const ACCOUNT_MENU_POPOVER_MIN_WIDTH = 260;
const ACCOUNT_MENU_VIEWPORT_PAD = 12;

function NavRow({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "10px 12px",
        borderRadius: 50,
        cursor: "pointer",
        transition: "background 0.15s",
        marginBottom: 2,
        userSelect: "none",
        background: "transparent",
        border: "none",
        width: "100%",
        textAlign: "left",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f9f9")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {icon}
      <span style={{ fontSize: 20, fontWeight: active ? 700 : 400, color: "#0f1419" }}>
        {label}
      </span>
    </button>
  );
}

const CAT_ICONS: Record<string, React.ReactNode> = {
  "x-bloggers": (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
      <path d="M17.863 13.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44zM12 2C9.791 2 8 3.79 8 6s1.791 4 4 4 4-1.79 4-4-1.791-4-4-4z" />
    </svg>
  ),
  "design-inspiration": (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  ),
  "ui-components": (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
      <path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z" />
    </svg>
  ),
  "framer-resources": (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
      <path d="M4 0h16v8H4V0zm0 8h8l8 8H4V8zm0 8h8v8L4 16z" />
    </svg>
  ),
  "portfolio-inspiration": (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
      <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-9-7l-3 3.72L7 13l-3 4h16l-5-7z" />
    </svg>
  ),
  "portfolio-platforms": (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
      <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
    </svg>
  ),
};

export function XShell() {
  const [activeView, setActiveView] = useState<"home" | number>("home");
  const categories = CATEGORIES;
  const [resourceSearch, setResourceSearch] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [skillCmdCopied, setSkillCmdCopied] = useState(false);
  const [skillCopyFailed, setSkillCopyFailed] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountMenuPlacement, setAccountMenuPlacement] = useState<{ left: number; top: number } | null>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const accountPopoverRef = useRef<HTMLDivElement>(null);
  const accountFirstMenuItemRef = useRef<HTMLAnchorElement>(null);

  /** Do not mount mobile chrome on desktop — avoids overlap if CSS loses specificity. */
  const [isMobileNarrow, setIsMobileNarrow] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // #region agent log
  useEffect(() => {
    const gf = (el: Element | null | undefined) =>
      el ? getComputedStyle(el).fontFamily : null;
    const html = document.documentElement;
    const interVar = getComputedStyle(html).getPropertyValue("--font-inter");
    const chip = document.querySelector(
      ".feed-main div[style*='rgba(0, 0, 0, 0.77)'], .feed-main div[style*='rgba(0,0,0,0.77)']"
    );
    const data = {
      bodyFont: gf(document.body),
      htmlClass: html.className,
      bodyClass: document.body.className,
      interVarHead: (interVar || "").trim().slice(0, 160),
      shellFont: gf(document.querySelector(".shell-root")),
      feedFont: gf(document.querySelector(".feed-main")),
      navBtnFont: gf(document.querySelector(".sidebar-left button")),
      previewChipFont: gf(chip),
    };
    const payload = {
      sessionId: "f383a1",
      location: "XShell.tsx:FontDebugProbe",
      message: "computed fonts",
      data,
      timestamp: Date.now(),
      hypothesisId: "H1-H5",
    };
    fetch("http://127.0.0.1:7508/ingest/8d9099a7-4a77-4c9f-a1f1-5b7e491cf96d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "f383a1",
      },
      body: JSON.stringify(payload),
    }).catch(() => {});
    fetch(withBasePath("/api/agent-debug-log"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }, []);
  // #endregion agent log

  const updateAccountMenuPlacement = useCallback(() => {
    const el = accountTriggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const idealCenterX = r.left + r.width / 2;
    const halfW = ACCOUNT_MENU_POPOVER_MIN_WIDTH / 2;
    const minX = ACCOUNT_MENU_VIEWPORT_PAD + halfW;
    const maxX = window.innerWidth - ACCOUNT_MENU_VIEWPORT_PAD - halfW;
    const centerX =
      maxX >= minX ? Math.min(maxX, Math.max(minX, idealCenterX)) : window.innerWidth / 2;
    setAccountMenuPlacement({ left: centerX, top: r.top - 8 });
  }, []);

  useLayoutEffect(() => {
    if (!accountMenuOpen) {
      setAccountMenuPlacement(null);
      return;
    }
    updateAccountMenuPlacement();
    const onScrollOrResize = () => updateAccountMenuPlacement();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [accountMenuOpen, updateAccountMenuPlacement]);

  useLayoutEffect(() => {
    if (!accountMenuOpen || !accountMenuPlacement) return;
    const id = requestAnimationFrame(() => {
      accountFirstMenuItemRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [accountMenuOpen, accountMenuPlacement]);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      const node = e.target as Node;
      if (accountTriggerRef.current?.contains(node)) return;
      if (accountPopoverRef.current?.contains(node)) return;
      setAccountMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!skillCmdCopied) return;
    const t = setTimeout(() => setSkillCmdCopied(false), 2000);
    return () => clearTimeout(t);
  }, [skillCmdCopied]);

  useEffect(() => {
    if (!skillCopyFailed) return;
    const t = setTimeout(() => setSkillCopyFailed(false), 2000);
    return () => clearTimeout(t);
  }, [skillCopyFailed]);

  const copySkillInstallCmd = useCallback(async () => {
    setSkillCopyFailed(false);
    try {
      await navigator.clipboard.writeText(SKILL_INSTALL_CMD);
      setSkillCmdCopied(true);
      return;
    } catch {
      /* fall through */
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = SKILL_INSTALL_CMD;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) setSkillCmdCopied(true);
      else setSkillCopyFailed(true);
    } catch {
      setSkillCopyFailed(true);
    }
  }, []);

  const copyFollowAll = useCallback(() => {
    const xCat = categories.find((c) => c.id === "x-bloggers");
    const handles = xCat?.items.map((i) => i.handle).filter(Boolean).join("\n") ?? "";
    const prompt = `I want to follow every account in this curated X (Twitter) list. Use your browser tools: for each handle below, open https://x.com/ plus the username with the @ removed, then click Follow only if I'm not already following. Work top to bottom; skip profiles that already show Following.

Handles (one per line):
${handles}

When done, briefly say how many new follows you made vs. already following.`;
    navigator.clipboard.writeText(prompt).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    });
  }, [categories]);

  return (
    <div
      className="shell-root"
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#ffffff",
        color: "#0f1419",
        fontFamily: UI_SANS,
      }}
    >
      {/* ── Mobile top bar (only mounted ≤767px) ── */}
      {isMobileNarrow ? (
      <div className="mobile-topbar">
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#1d9bf0",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <img
            src={withBasePath("/avatar.jpg")}
            alt="Elena Hu"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
        <img src={withBasePath("/ylogo.png")} alt="Y" width={24} height={24} style={{ objectFit: "contain" }} />
        <button
          onClick={() => setSuggestOpen(true)}
          aria-label="Suggest new resource"
          style={{
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#0f1419",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f9f9")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" aria-hidden="true">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
      </div>
      ) : null}

      {/* ── Left sidebar ── */}
      <div
        className="sidebar-left [&::-webkit-scrollbar]:hidden"
        style={{
          flex: 1,
          minWidth: 200,
          borderRight: "1px solid #eff3f4",
          height: "100%",
          overflowY: "auto",
          scrollbarWidth: "none",
        }}
      >
        <div
          style={{
            maxWidth: 275,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            padding: "12px 12px 12px 8px",
          }}
        >
        {/* X Logo */}
        <div style={{ padding: "6px 12px 2px" }}>
          <div
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img src={withBasePath("/ylogo.png")} alt="Y" width={32} height={32} style={{ objectFit: "contain" }} />
          </div>
        </div>

        {/* Home */}
        <NavRow
          active={activeView === "home"}
          onClick={() => setActiveView("home")}
          label="Home"
          icon={
            activeView === "home" ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} fill="currentColor" color="#0f1419">
                <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
                <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={24} height={24} strokeWidth={1.5} stroke="currentColor" color="#0f1419">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            )
          }
        />

        {/* Categories as nav items */}
        {categories.map((cat, i) => {
          if (cat.id === "portfolio-platforms") return null;
          const isActive = activeView === i;
          return (
            <NavRow
              key={cat.id}
              active={isActive}
              onClick={() => setActiveView(i)}
              label={SHORT_LABELS[cat.id] || cat.label}
              icon={
                <span style={{ color: "#0f1419", display: "flex" }}>
                  {cat.id === "x-bloggers" ? (
                    isActive ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
                        <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={24} height={24} strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                      </svg>
                    )
                  ) : cat.id === "design-inspiration" ? (
                    isActive ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
                        <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z" clipRule="evenodd"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={24} height={24} strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"/>
                      </svg>
                    )
                  ) : cat.id === "ui-components" ? (
                    isActive ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
                        <path d="M11.644 1.59a.75.75 0 0 1 .712 0l9.75 5.25a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.712 0l-9.75-5.25a.75.75 0 0 1 0-1.32l9.75-5.25Z"/>
                        <path d="m3.265 10.602 7.668 4.129a2.25 2.25 0 0 0 2.134 0l7.668-4.13 1.37.739a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.71 0l-9.75-5.25a.75.75 0 0 1 0-1.32l1.37-.738Z"/>
                        <path d="m10.933 19.231-7.668-4.13-1.37.739a.75.75 0 0 0 0 1.32l9.75 5.25c.221.12.489.12.71 0l9.75-5.25a.75.75 0 0 0 0-1.32l-1.37-.738-7.668 4.13a2.25 2.25 0 0 1-2.134-.001Z"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={24} height={24} strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3"/>
                      </svg>
                    )
                  ) : cat.id === "portfolio-inspiration" ? (
                    isActive ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
                        <path fillRule="evenodd" d="M20.599 1.5c-.376 0-.743.111-1.055.32l-5.08 3.385a18.747 18.747 0 0 0-3.471 2.987 10.04 10.04 0 0 1 4.815 4.815 18.748 18.748 0 0 0 2.987-3.472l3.386-5.079A1.902 1.902 0 0 0 20.599 1.5Zm-8.3 14.025a18.76 18.76 0 0 0 1.896-1.207 8.026 8.026 0 0 0-4.513-4.513A18.75 18.75 0 0 0 8.475 11.7l-.278.5a5.26 5.26 0 0 1 3.601 3.602l.502-.278ZM6.75 13.5A3.75 3.75 0 0 0 3 17.25a1.5 1.5 0 0 1-1.601 1.497.75.75 0 0 0-.7 1.123 5.25 5.25 0 0 0 9.8-2.62 3.75 3.75 0 0 0-3.75-3.75Z" clipRule="evenodd"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={24} height={24} strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"/>
                      </svg>
                    )
                  ) : cat.id === "framer-resources" ? (
                    isActive ? (
                      <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
                        <path d="M4 0h16v8H4V0zm0 8h8l8 8H4V8zm0 8h8v8L4 16z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={24} height={24} strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 0h16v8h-8l8 8h-8v8L4 16V0z"/>
                      </svg>
                    )
                  ) : (
                    CAT_ICONS[cat.id] ?? (
                      <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                      </svg>
                    )
                  )}
                </span>
              }
            />
          );
        })}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Suggest new (Post-style button) */}
        <div style={{ padding: "16px 4px" }}>
          <button
            onClick={() => setSuggestOpen(true)}
            className="btn-press"
            style={{
              display: "block",
              width: "100%",
              padding: "14px 0",
              borderRadius: 50,
              fontSize: 16,
              fontWeight: 700,
              color: "#fff",
              background: "#0f1419",
              border: "none",
              textAlign: "center",
              cursor: "pointer",
              transition: "background 0.2s, transform 0.15s ease-out",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#272c30")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0f1419")}
          >
            Suggest new
          </button>
        </div>

        {/* User profile + account menu (X-style popover) */}
        <div style={{ position: "relative", width: "100%" }}>
          {accountMenuOpen && accountMenuPlacement ? (
            <div
              ref={accountPopoverRef}
              role="menu"
              aria-label="Account actions"
              style={{
                position: "fixed",
                left: accountMenuPlacement.left,
                top: accountMenuPlacement.top,
                transform: "translate(-50%, -100%)",
                zIndex: 10000,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  border: "1px solid #eff3f4",
                  boxShadow: "0 4px 24px rgba(15, 20, 25, 0.15), 0 0 1px rgba(15, 20, 25, 0.08)",
                  minWidth: 260,
                  padding: "6px 0",
                }}
              >
                {ACCOUNT_MENU_ITEMS.map((item, i) => (
                  <a
                    key={item.href}
                    ref={i === 0 ? accountFirstMenuItemRef : undefined}
                    href={item.href}
                    role="menuitem"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setAccountMenuOpen(false)}
                    style={{
                      display: "block",
                      padding: "14px 18px",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#0f1419",
                      textDecoration: "none",
                      lineHeight: 1.25,
                      borderRadius: 4,
                      margin: "0 6px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f9f9")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
              <div
                aria-hidden
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "9px solid transparent",
                  borderRight: "9px solid transparent",
                  borderTop: "10px solid #fff",
                  marginTop: -1,
                  filter: "drop-shadow(0 2px 2px rgba(15, 20, 25, 0.06))",
                }}
              />
            </div>
          ) : null}
          <button
            ref={accountTriggerRef}
            type="button"
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
            onClick={() => setAccountMenuOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 50,
              cursor: "pointer",
              transition: "background 0.2s",
              marginBottom: 8,
              background: accountMenuOpen ? "#f7f9f9" : "transparent",
              border: "none",
              width: "100%",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              if (!accountMenuOpen) e.currentTarget.style.background = "#f7f9f9";
            }}
            onMouseLeave={(e) => {
              if (!accountMenuOpen) e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "#1d9bf0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
                overflow: "hidden",
                padding: 0,
              }}
            >
              <img
                src={withBasePath("/avatar.jpg")}
                alt="Elena Hu"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement!.textContent = "XY";
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f1419", lineHeight: 1.3 }}>
                Elena Hu
              </div>
              <div style={{ fontSize: 13, color: "#536471", lineHeight: 1.3 }}>
                @elenahuxy
              </div>
            </div>
            <span aria-hidden="true" style={{ color: "#536471", fontSize: 18 }}>
              ···
            </span>
          </button>
        </div>
        </div>
      </div>

      {/* ── Main feed ── */}
      <div
        className="feed-main [&::-webkit-scrollbar]:hidden"
        style={{
          width: 620,
          flexShrink: 0,
          borderRight: "1px solid #eff3f4",
          overflowY: "auto",
          height: "100%",
          scrollbarWidth: "none",
        }}
      >
        <FeedTabs
          mode={activeView === "home" ? "home" : "resources"}
          activeCategory={typeof activeView === "number" ? activeView : 0}
          categories={categories}
          resourceSearch={resourceSearch}
          onCategoryChange={(i) => setActiveView(i)}
          onModeChange={(m) => setActiveView(m === "home" ? "home" : 0)}
        />
      </div>

      {/* ── Right sidebar ── */}
      <div
        className="sidebar-right [&::-webkit-scrollbar]:hidden"
        style={{
          width: 350,
          flexShrink: 0,
          height: "100%",
          overflowY: "auto",
          scrollbarWidth: "none",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Sticky search */}
        <div style={{ position: "sticky", top: 0, background: "#fff", paddingBottom: 4, zIndex: 10 }}>
          <div
            style={{
              background: "#fff",
              border: "1px solid #cfd9de",
              borderRadius: 50,
              display: "flex",
              alignItems: "center",
              padding: "10px 16px",
              gap: 10,
            }}
          >
            <svg viewBox="0 0 24 24" width={18} height={18} fill="#536471" aria-hidden="true">
              <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.814 5.262l4.276 4.276-1.414 1.414-4.276-4.276A8.456 8.456 0 0110.25 18.75c-4.694 0-8.5-3.806-8.5-8.5z" />
            </svg>
            <input
              aria-label="Search resources and posts"
              name="search"
              autoComplete="off"
              placeholder="Search resources"
              value={resourceSearch}
              onChange={(e) => setResourceSearch(e.target.value)}
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "#0f1419",
                fontSize: 15,
                flex: 1,
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {/* Hire card */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #cfd9de",
            borderRadius: 16,
            padding: "16px",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f1419", lineHeight: 1.5, marginBottom: 10, textWrap: "balance" } as React.CSSProperties}>
            Hire the person who built this
          </div>
          <div style={{ fontSize: 15, color: "#536471", lineHeight: 1.5, marginBottom: 16, textWrap: "pretty" } as React.CSSProperties}>
            Designer who can also vibe code. Currently open to work in the US.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a
              href="https://xiaoyanghu.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-press"
              style={{
                flex: 1,
                display: "block",
                padding: "9px 0",
                borderRadius: 50,
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                background: "#0f1419",
                border: "none",
                cursor: "pointer",
                textDecoration: "none",
                textAlign: "center",
                transition: "background 0.15s, transform 0.15s ease-out",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#272c30")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#0f1419")}
            >
              Portfolio
            </a>
            <a
              href="https://www.linkedin.com/in/xiaoyang-hu-elena/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-press"
              style={{
                flex: 1,
                display: "block",
                padding: "9px 0",
                borderRadius: 50,
                fontSize: 14,
                fontWeight: 700,
                color: "#0f1419",
                background: "#fff",
                border: "1px solid #cfd9de",
                cursor: "pointer",
                textDecoration: "none",
                textAlign: "center",
                transition: "background 0.15s, transform 0.15s ease-out",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f9f9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              LinkedIn
            </a>
          </div>
        </div>

        {/* Claude Skill — third sidebar block (after search + Hire) */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #cfd9de",
            borderRadius: 16,
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 700, color: "#0f1419", lineHeight: 1.3 }}>
              Available as a Claude Skill
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                background: "#fff6cc",
                color: "rgba(237, 136, 12, 1)",
                fontSize: 11,
                fontWeight: 800,
                lineHeight: 1,
                padding: "4px 8px",
                borderRadius: 4,
                letterSpacing: "0.02em",
              }}
            >
              New
            </span>
          </div>
          <div
            style={{
              fontSize: 15,
              color: "#536471",
              lineHeight: 1.55,
              marginBottom: 12,
              textWrap: "pretty",
            }}
          >
            Install once. Then ask Claude to recommend portfolios, UI libraries, Framer tools, and who to follow on X, based on
            what you&apos;re building.
          </div>
          <div style={{ marginBottom: 10 }}>
            <span className="sr-only" aria-live="polite">
              {skillCmdCopied ? "Install command copied to clipboard" : skillCopyFailed ? "Copy failed" : ""}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                background: "#f7f9f9",
                border: "1px solid #eff3f4",
                borderRadius: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    padding: "10px 8px 10px 12px",
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                    fontSize: 12,
                    color: "#0f1419",
                    lineHeight: 1.5,
                    overflowWrap: "break-word",
                  }}
                >
                  <span style={{ color: "#536471" }}>$</span> <SkillInstallDisplay />
                </div>
              </div>
              <div
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 6px 0 2px",
                }}
              >
                <button
                  type="button"
                  onClick={() => void copySkillInstallCmd()}
                  aria-label={skillCmdCopied ? "Copied" : "Copy install command"}
                  title={skillCmdCopied ? "Copied" : "Copy"}
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    borderRadius: 6,
                    background: "transparent",
                    cursor: "pointer",
                    color: "#536471",
                  }}
                  onMouseEnter={(e) => {
                    if (!skillCmdCopied) e.currentTarget.style.background = "#eff3f4";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {skillCmdCopied ? (
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {skillCopyFailed && (
              <div style={{ fontSize: 12, color: "#f4212e", marginTop: 6 }}>Copy failed — select the command manually</div>
            )}
          </div>
          <div style={{ fontSize: 13, color: "#536471" }}>
            Or{" "}
            <a
              href="https://github.com/Xiaoyang-Hu-96/design-resource-library/raw/main/SKILL.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", fontWeight: 700, textDecoration: "none" }}
            >
              download SKILL.md
            </a>
            {" · "}
            <a
              href="https://github.com/Xiaoyang-Hu-96/design-resource-library"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", fontWeight: 700, textDecoration: "none" }}
            >
              View on GitHub
            </a>
          </div>
        </div>

        {/* Poll card */}
        <PollCard
          tabId={
            activeView === "home"
              ? "home"
              : categories[activeView]?.id ?? "home"
          }
        />

        <div style={{ fontSize: 13, color: "#536471", paddingBottom: 16 }}>© 2026 Xiaoyang Hu</div>
      </div>

      {/* ── Mobile bottom nav (only mounted ≤767px) ── */}
      {isMobileNarrow ? (
      <nav className="mobile-bottomnav" aria-label="Main navigation">
        {/* Home */}
        <button
          onClick={() => setActiveView("home")}
          aria-label="Home"
          aria-current={activeView === "home" ? "page" : undefined}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: activeView === "home" ? "#0f1419" : "#536471",
            padding: "10px 0",
          }}
        >
          {activeView === "home" ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden="true">
              <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
              <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={24} height={24} strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          )}
        </button>
        {/* Category buttons — same icons as desktop sidebar */}
        {categories.filter((c) => c.id !== "portfolio-platforms").map((cat, i) => {
          const isActive = activeView === i;
          const btnStyle = {
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: isActive ? "#0f1419" : "#536471",
            padding: "10px 0",
          } as const;
          return (
            <button key={cat.id} onClick={() => setActiveView(i)} aria-label={SHORT_LABELS[cat.id] || cat.label} aria-current={isActive ? "page" : undefined} style={btnStyle}>
              {cat.id === "x-bloggers" ? (
                isActive ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={24} height={24} strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )
              ) : cat.id === "design-inspiration" ? (
                isActive ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={24} height={24} strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                  </svg>
                )
              ) : cat.id === "ui-components" ? (
                isActive ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden="true">
                    <path d="M11.644 1.59a.75.75 0 0 1 .712 0l9.75 5.25a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.712 0l-9.75-5.25a.75.75 0 0 1 0-1.32l9.75-5.25Z" />
                    <path d="m3.265 10.602 7.668 4.129a2.25 2.25 0 0 0 2.134 0l7.668-4.13 1.37.739a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.71 0l-9.75-5.25a.75.75 0 0 1 0-1.32l1.37-.738Z" />
                    <path d="m10.933 19.231-7.668-4.13-1.37.739a.75.75 0 0 0 0 1.32l9.75 5.25c.221.12.489.12.71 0l9.75-5.25a.75.75 0 0 0 0-1.32l-1.37-.738-7.668 4.13a2.25 2.25 0 0 1-2.134-.001Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={24} height={24} strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" />
                  </svg>
                )
              ) : cat.id === "framer-resources" ? (
                isActive ? (
                  <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden="true">
                    <path d="M4 0h16v8H4V0zm0 8h8l8 8H4V8zm0 8h8v8L4 16z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={24} height={24} strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 0h16v8h-8l8 8h-8v8L4 16V0z" />
                  </svg>
                )
              ) : cat.id === "portfolio-inspiration" ? (
                isActive ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M20.599 1.5c-.376 0-.743.111-1.055.32l-5.08 3.385a18.747 18.747 0 0 0-3.471 2.987 10.04 10.04 0 0 1 4.815 4.815 18.748 18.748 0 0 0 2.987-3.472l3.386-5.079A1.902 1.902 0 0 0 20.599 1.5Zm-8.3 14.025a18.76 18.76 0 0 0 1.896-1.207 8.026 8.026 0 0 0-4.513-4.513A18.75 18.75 0 0 0 8.475 11.7l-.278.5a5.26 5.26 0 0 1 3.601 3.602l.502-.278ZM6.75 13.5A3.75 3.75 0 0 0 3 17.25a1.5 1.5 0 0 1-1.601 1.497.75.75 0 0 0-.7 1.123 5.25 5.25 0 0 0 9.8-2.62 3.75 3.75 0 0 0-3.75-3.75Z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={24} height={24} strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
                  </svg>
                )
              ) : null}
            </button>
          );
        })}
      </nav>
      ) : null}

      {/* Toast — portal so position:fixed is relative to viewport (not sticky/filter ancestors). */}
      {showToast
        ? createPortal(
            <div role="status" style={COPY_AI_PROMPT_TOAST_STYLE}>
              Prompt copied ✦ Paste into a browser-capable agent to follow everyone on the list
            </div>,
            document.body
          )
        : null}

      <SuggestModal open={suggestOpen} onClose={() => setSuggestOpen(false)} />
    </div>
  );
}
