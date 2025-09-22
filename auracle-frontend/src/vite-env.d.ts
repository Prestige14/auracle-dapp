/// <reference types="vite/client" />

interface Window {
  ethereum?: any;
}

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS: string;
  // Anda bisa menambahkan variabel env lain di sini jika ada
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}