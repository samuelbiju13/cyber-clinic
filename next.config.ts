import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// DEV ONLY: Bypass self-signed cert errors (fixes 'fetch failed' / 'UNABLE_TO_VERIFY_LEAF_SIGNATURE')
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export default nextConfig;
