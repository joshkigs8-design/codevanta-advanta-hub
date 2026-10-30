import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Troubleshooting & Error Solutions Matrix",
  description:
    "Verified fixes for common developer stumbling blocks: Ollama connection failures, CORS policy errors, Next.js hydration mismatch, and M-Pesa webhook signature errors.",
  alternates: {
    canonical: "/troubleshooting",
  },
  openGraph: {
    title: "Developer Troubleshooting Matrix — CodeVanta Advanta Hub",
    description:
      "Verified fixes for developer stumbling blocks: Ollama connection failures, CORS policy errors, and M-Pesa webhook signature errors.",
    url: "https://www.codevanta.online/troubleshooting",
  },
};

export default function TroubleshootingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

