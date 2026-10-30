import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Engineering Guides & Architectural Blueprints",
  description: "Comprehensive guides for production engineering: microservices, authentication security, database scaling, and local AI agent integration.",
  alternates: {
    canonical: "/guides",
  },
  openGraph: {
    title: "Engineering Guides & Blueprints — CodeVanta Advanta Hub",
    description: "Comprehensive guides for production engineering: microservices, authentication, databases, and local AI agents.",
    url: "https://www.codevanta.online/guides",
  },
};

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

