/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GROQ_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "logo/*.png" {
  const value: string;
  export default value;
}

declare module "logo/*.svg" {
  const value: string;
  export default value;
}

declare module "logo/*.jpg" {
  const value: string;
  export default value;
}

declare module "logo/*.jpeg" {
  const value: string;
  export default value;
}
