import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Resource Directory — Free APIs, AI Models & Cloud Tiers",
  description:
    "Explore 100+ verified developer resources: free cloud databases, AI model providers, hosting platforms, open-source blueprints, and Kenyan payment tools.",
  alternates: {
    canonical: "/directory",
  },
  openGraph: {
    title: "Developer Resource Directory — CodeVanta Advanta Hub",
    description:
      "Explore 100+ verified developer resources: free cloud databases, AI model providers, hosting platforms, and open-source blueprints.",
    url: "https://www.codevanta.online/directory",
  },
};

export default function DirectoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
