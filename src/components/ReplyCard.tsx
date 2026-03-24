"use client";

import { useState } from "react";

const ME = {
  name: "Elena Hu",
  handle: "@elenahuxy",
  avatar: "/avatar.jpg",
};

export function ReplyCard({
  replyingTo,
  text,
  time,
}: {
  replyingTo: string;
  text: string;
  time?: string;
}) {
  const [avatarError, setAvatarError] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "12px 16px",
        borderBottom: "1px solid #eff3f4",
        background: "transparent",
      }}
    >
      {/* Avatar */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#1d9bf0",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!avatarError ? (
            <img
              src={ME.avatar}
              alt={ME.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>EH</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#0f1419" }}>
            {ME.name}
          </span>
          <span style={{ fontSize: 13, color: "#536471" }}>{ME.handle}</span>
          {time && (
            <>
              <span style={{ color: "#536471", fontSize: 11 }}>·</span>
              <span style={{ fontSize: 13, color: "#536471" }}>{time}</span>
            </>
          )}
        </div>

        <div style={{ fontSize: 13, color: "#536471", marginBottom: 4 }}>
          Replying to <span style={{ color: "#1d9bf0" }}>@{replyingTo}</span>
        </div>

        <div
          style={{
            fontSize: 15,
            lineHeight: 1.55,
            color: "#0f1419",
            whiteSpace: "pre-line",
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
