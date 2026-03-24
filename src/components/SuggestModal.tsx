"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #cfd9de",
  fontSize: 14,
  color: "#0f1419",
  background: "#fff",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s",
};

type SubmitState = "idle" | "submitting" | "success" | "error";

export function SuggestModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [reason, setReason] = useState("");
  const [state, setState] = useState<SubmitState>("idle");

  if (!open) return null;

  const canSubmit = name.trim() && url.trim() && state !== "submitting";

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setState("submitting");

    if (!supabase) {
      setState("error");
      return;
    }

    try {
      const { error } = await supabase.from("suggestions").insert({
        name: name.trim(),
        url: url.trim(),
        reason: reason.trim() || null,
      });

      if (error) {
        console.error("Suggestion insert error:", error);
        setState("error");
        return;
      }

      setState("success");
      setName("");
      setUrl("");
      setReason("");

      setTimeout(() => {
        setState("idle");
        onClose();
      }, 1800);
    } catch (err) {
      console.error("Suggestion submit error:", err);
      setState("error");
    }
  };

  const handleClose = () => {
    if (state === "submitting") return;
    setState("idle");
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          margin: "0 16px",
          borderRadius: 16,
          padding: 24,
          background: "#ffffff",
          border: "1px solid #cfd9de",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {state === "success" ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#0f1419",
                marginBottom: 6,
              }}
            >
              Thanks for sharing!
            </h2>
            <p style={{ fontSize: 14, color: "#536471" }}>
              Your suggestion has been received.
            </p>
          </div>
        ) : (
          <>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#0f1419",
                marginBottom: 4,
              }}
            >
              Suggest a resource
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "#536471",
                marginBottom: 20,
                lineHeight: 1.4,
              }}
            >
              Know something great? Share it with me.
            </p>

            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#0f1419",
                marginBottom: 6,
              }}
            >
              Resource name
            </label>
            <input
              type="text"
              placeholder="e.g. Design Spells"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ ...inputStyle, marginBottom: 14 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#1d9bf0")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#cfd9de")}
              disabled={state === "submitting"}
            />

            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#0f1419",
                marginBottom: 6,
              }}
            >
              URL
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ ...inputStyle, marginBottom: 14 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#1d9bf0")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#cfd9de")}
              disabled={state === "submitting"}
            />

            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#0f1419",
                marginBottom: 6,
              }}
            >
              Why recommend it?{" "}
              <span style={{ fontWeight: 400, color: "#536471" }}>
                (optional)
              </span>
            </label>
            <textarea
              placeholder="One line is enough"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              style={{
                ...inputStyle,
                marginBottom: 6,
                resize: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#1d9bf0")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#cfd9de")}
              disabled={state === "submitting"}
            />

            {state === "error" && (
              <p
                style={{
                  fontSize: 13,
                  color: "#f4212e",
                  marginBottom: 6,
                  marginTop: 4,
                }}
              >
                Something went wrong. Please try again.
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 14,
              }}
            >
              <button
                onClick={handleClose}
                disabled={state === "submitting"}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#0f1419",
                  background: "transparent",
                  border: "1px solid #cfd9de",
                  cursor: state === "submitting" ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                  padding: "8px 20px",
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#fff",
                  background: canSubmit ? "#0f1419" : "#9aa2a8",
                  border: "none",
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  opacity: canSubmit ? 1 : 0.6,
                }}
              >
                {state === "submitting" ? "Submitting…" : "Submit"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
