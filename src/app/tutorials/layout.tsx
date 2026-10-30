import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Engineering Tutorials & Local AI Setup Guides",
  description:
    "Practical step-by-step developer tutorials: Ollama Windows setup, DeepSeek local models, MovieBox-TUI & VLC IPTV, VS Code AI pairs, and Next.js 15 production deployments.",
  alternates: {
    canonical: "/tutorials",
  },
  openGraph: {
    title: "Engineering Tutorials & Local AI Setup Guides — CodeVanta Advanta Hub",
    description:
      "Step-by-step developer tutorials: Ollama, local models, MovieBox-TUI, VLC IPTV, and production web engineering.",
    url: "https://www.codevanta.online/tutorials",
  },
};

export default function TutorialsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
