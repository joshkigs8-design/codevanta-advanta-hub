import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://codevanta.com";

  const routes = [
    "",
    "/directory",
    "/guides",
    "/plans",
    "/downloader-codes",
    "/terms",
    "/privacy",
    "/refund-policy",
    "/compliance",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/directory" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route === "/directory" || route === "/plans" ? 0.9 : 0.7,
  }));
}
