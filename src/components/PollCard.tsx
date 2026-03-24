"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface PollData {
  question: string;
  options: string[];
}

const POLLS: Record<string, PollData> = {
  home: {
    question: "Was this site helpful?",
    options: ["Helpful", "Life-changing, actually"],
  },
  "x-bloggers": {
    question: "Are you burnt out from AI today?",
    options: ["A little", "Completely fried"],
  },
  "design-inspiration": {
    question: "How did you find this site?",
    options: ["From Linkedin", "From X", "Someone sent it to me"],
  },
  "ui-components": {
    question: "Are you a designer, a vibe coder, or both?",
    options: ["Designer", "Vibe coder", "Both somehow"],
  },
  "framer-resources": {
    question: "Have you tried Framer before?",
    options: ["Yes, love it", "No, but curious", "Tried it, got lost"],
  },
  "portfolio-inspiration": {
    question: "What will you use to build your next portfolio?",
    options: ["Framer", "Vibe coding", "Other"],
  },
};

function lsKey(tabId: string) {
  return `poll_voted_${tabId}`;
}

function cacheKey(tabId: string) {
  return `poll_counts_${tabId}`;
}

interface CachedCounts {
  counts: number[];
  ts: number;
}

const CACHE_TTL = 60_000;

export function PollCard({ tabId }: { tabId: string }) {
  const poll = POLLS[tabId];
  const [votedIndex, setVotedIndex] = useState<number | null>(null);
  const [counts, setCounts] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!poll) return;

    const stored = localStorage.getItem(lsKey(tabId));
    if (stored !== null) {
      setVotedIndex(parseInt(stored, 10));
      setShowResults(true);
    } else {
      setVotedIndex(null);
      setShowResults(false);
    }

    setCounts(new Array(poll.options.length).fill(0));
    loadCounts(tabId, poll.options.length);
  }, [tabId, poll]);

  const loadCounts = useCallback(
    async (tid: string, optCount: number) => {
      const cached = localStorage.getItem(cacheKey(tid));
      if (cached) {
        try {
          const parsed: CachedCounts = JSON.parse(cached);
          if (Date.now() - parsed.ts < CACHE_TTL) {
            if (mountedRef.current) setCounts(parsed.counts);
            return;
          }
        } catch {
          /* ignore bad cache */
        }
      }

      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from("polls")
          .select("option_index, count")
          .eq("tab_id", tid);

        if (error || !data) return;

        const fresh = new Array(optCount).fill(0);
        for (const row of data) {
          if (row.option_index >= 0 && row.option_index < optCount) {
            fresh[row.option_index] = row.count;
          }
        }

        const entry: CachedCounts = { counts: fresh, ts: Date.now() };
        localStorage.setItem(cacheKey(tid), JSON.stringify(entry));
        if (mountedRef.current) setCounts(fresh);
      } catch {
        /* network error — show zeros */
      }
    },
    [],
  );

  const vote = useCallback(
    async (optionIndex: number) => {
      if (votedIndex !== null || !poll) return;

      localStorage.setItem(lsKey(tabId), String(optionIndex));
      setVotedIndex(optionIndex);

      const newCounts = [...counts];
      newCounts[optionIndex] = (newCounts[optionIndex] || 0) + 1;
      setCounts(newCounts);

      const entry: CachedCounts = { counts: newCounts, ts: Date.now() };
      localStorage.setItem(cacheKey(tabId), JSON.stringify(entry));

      setTimeout(() => {
        if (mountedRef.current) setShowResults(true);
      }, 50);

      if (supabase) {
        try {
          await supabase.rpc("increment_poll_vote", {
            p_tab_id: tabId,
            p_option_index: optionIndex,
          });
        } catch {
          /* vote recorded locally even if remote fails */
        }
      }
    },
    [votedIndex, poll, tabId, counts],
  );

  if (!poll) return null;

  const total = counts.reduce((s, c) => s + c, 0);
  const maxPct = total > 0 ? Math.max(...counts.map((c) => Math.round((c / total) * 100))) : 0;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #cfd9de",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#0f1419",
          lineHeight: 1.4,
          marginBottom: 12,
        }}
      >
        {poll.question}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: showResults ? 6 : 8 }}>
        {poll.options.map((opt, i) => {
          const pct = total > 0 ? Math.round((counts[i] / total) * 100) : 0;
          const isVoted = votedIndex === i;
          const isWinning = pct === maxPct && pct > 0;

          if (showResults) {
            return (
              <div
                key={i}
                style={{
                  position: "relative",
                  borderRadius: 4,
                  overflow: "hidden",
                  height: 32,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    width: `${pct}%`,
                    minWidth: pct > 0 ? 4 : 0,
                    background: "#cfd9de",
                    opacity: isVoted ? 0.55 : 0.4,
                    borderRadius: 4,
                    transition: "width 300ms ease",
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    height: "100%",
                    padding: "0 10px",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: isWinning || isVoted ? 700 : 400,
                      color: "#0f1419",
                    }}
                  >
                    {opt}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: isWinning || isVoted ? 700 : 400,
                      color: "#0f1419",
                    }}
                  >
                    {pct}%
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={i}
              onClick={() => vote(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                borderRadius: 4,
                padding: "0 2px",
                transition: "background 0.15s",
                background: hovered === i ? "#f7f9f9" : "transparent",
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 28,
                  borderRadius: 2,
                  background: "#cfd9de",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: 400,
                  color: "#0f1419",
                  lineHeight: "28px",
                }}
              >
                {opt}
              </span>
              <span
                style={{
                  fontSize: 15,
                  color: "#536471",
                  flexShrink: 0,
                }}
              >
                0%
              </span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontSize: 13,
          color: "#536471",
          marginTop: 10,
        }}
      >
        {total} vote{total !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
