/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin without `/api/v1`. Blank (default) uses the Vite dev proxy. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
