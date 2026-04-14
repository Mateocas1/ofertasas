import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ??
    "https://ofertasas.com.ar";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products/", "/promociones"],
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
