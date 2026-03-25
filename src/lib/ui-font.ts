/** App-wide sans stack so UI never falls back to serif if Inter/CSS vars hiccup. */
export const UI_SANS =
  'var(--font-inter), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' as const;
