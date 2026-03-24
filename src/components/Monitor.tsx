"use client";

export function Monitor({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 1280 }}>
        {children}
      </div>
    </div>
  );
}
