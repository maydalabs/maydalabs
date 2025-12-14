import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://emayda.com"; // change to MaydaLabs domain later

  const routes = [
    "",
    "/programs",
    "/pricing",
    "/about",
    "/contact",
    "/roi-quickcheck",
    "/case-studies",
    "/playbooks",
    "/newsletter",
    "/privacy",
    "/terms",
  ];

  const lastModified = new Date();

  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
  }));
}
