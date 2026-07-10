// Env-driven client feature flags. Mirrors the backend `app.blog.*` switches.
//   NEXT_PUBLIC_EDITORIAL_ENABLED=false  → hide the News / Editorial nav + routes
export const EDITORIAL_ENABLED = process.env.NEXT_PUBLIC_EDITORIAL_ENABLED !== "false"
