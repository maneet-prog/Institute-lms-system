// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   reactStrictMode: true,
//   output: "standalone",
//   compress: true,
//   poweredByHeader: false,
// };

// export default nextConfig;


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  // Add this block below
  experimental: {
    serverActions: {
      allowedOrigins: ["192.168.1.144:3000"],
    },
  },
};

export default nextConfig;
