import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ??
    "https://ofertasas.com.ar";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/promociones`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    // Product pages would be dynamically generated from a DB query
    // For now, static entries. In production, fetch from /api/products?limit=1000
  ];
}
