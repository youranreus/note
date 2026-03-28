/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SSO_URL?: string;
  readonly VITE_SSO_ID?: string;
  readonly VITE_SSO_REDIRECT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
