import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/pricing", destination: "/contact", permanent: true },
      { source: "/programs", destination: "/services", permanent: true },
      { source: "/playbooks", destination: "/case-studies", permanent: true },
      { source: "/newsletter", destination: "/", permanent: true },
      { source: "/roi-quickcheck", destination: "/services", permanent: true },
    ];
  },
};

export default nextConfig;
