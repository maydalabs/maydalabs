import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    const legacyRedirects = [
      { source: "/pricing", destination: "/contact", permanent: true },
      { source: "/programs", destination: "/services", permanent: true },
      { source: "/playbooks", destination: "/case-studies", permanent: true },
      { source: "/newsletter", destination: "/", permanent: true },
      { source: "/roi-quickcheck", destination: "/services", permanent: true },
    ];

    return [
      ...legacyRedirects,
      ...legacyRedirects.map(({ source, destination, permanent }) => ({
        source: `/:lang(en|tr|fr)${source}`,
        destination: `/:lang${destination}`,
        permanent,
      })),
    ];
  },
};

export default nextConfig;
