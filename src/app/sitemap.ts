import { MetadataRoute } from "next";
import { getDb } from "@/lib/db";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.codevanta.online";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/directory`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${baseUrl}/tutorials`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${baseUrl}/plans`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/downloader-codes`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/projects`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/learning-paths`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/troubleshooting`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/students`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/compliance`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/refund-policy`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const db = getDb();

    // Query published tutorials
    const tutorials = db
      .prepare("SELECT slug, updated_at FROM tutorials WHERE is_published = 1")
      .all() as Array<{ slug: string; updated_at?: string }>;

    const tutorialRoutes: MetadataRoute.Sitemap = tutorials.map((t) => ({
      url: `${baseUrl}/tutorials/${t.slug}`,
      lastModified: t.updated_at ? new Date(t.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.85,
    }));

    // Query resource categories
    const categories = db
      .prepare("SELECT slug FROM categories")
      .all() as Array<{ slug: string }>;

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${baseUrl}/directory?category=${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    }));

    return [...staticRoutes, ...tutorialRoutes, ...categoryRoutes];
  } catch {
    return staticRoutes;
  }
}
