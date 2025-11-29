declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string;
      SIWE_DOMAIN: string;
    }
  }
}

export {};
