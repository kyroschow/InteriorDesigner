/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `live` sends real requests; anything else (default) uses the in-browser mock API. */
  readonly VITE_API_MODE?: string
  /** Backend origin/prefix without `/api/v1`. Blank means same origin. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
