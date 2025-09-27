import type { NextConfig } from "next";
import { hostname } from "os";

const nextConfig: NextConfig = {
  /* config options here */
  remotePatterns: [
    {
      protocol: "https",
      hostname: "static.vecteezy.com",
    },
    {
      protocol: "https",
      hostname: "lh3.googleusercontent.com"
    },
    {
      protocol: "https",
      hostname: "avatar.iran.liara.run"
    },
    {
      protocol: "https",
      hostname: "www.google.com"
    }
  ],
  reactStrictMode: true,
  serverActions: {
    bodySizeLimit: '5mb', // <-- increase to 5 MB
  },
};

export default nextConfig;
