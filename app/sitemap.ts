import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
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
    url: `${SITE_URL}${path}`,
    lastModified,
  }));
}
