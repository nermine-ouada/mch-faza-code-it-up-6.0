/**
 * Lab UI without login — only when explicitly enabled (local demos).
 * Set VITE_SKIP_AUTH=true in `.env` (and SKIP_AUTH=true on the API) if you need that mode.
 */
export function skipAuthUi(): boolean {
  return (
    import.meta.env.VITE_SKIP_AUTH === "true" || import.meta.env.VITE_SKIP_AUTH === "1"
  );
}
