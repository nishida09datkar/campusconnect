/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCKS: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SOCKET_URL: string;
  readonly VITE_STUN_URL: string;
  readonly VITE_TURN_URL: string;
  readonly VITE_TURN_USER: string;
  readonly VITE_TURN_PASS: string;
  readonly VITE_MAX_UPLOAD_MB: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
