import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/about",
    "/services",
    "/contact",
    "/case-studies",
    "/case-studies/hodlstay",
    "/case-studies/satoshi-gazette",
    "/privacy",
    "/terms",
  ];

  const lastModified = new Date();

  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
  }));
}
