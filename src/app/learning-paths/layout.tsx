import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Structured Learning Paths for Modern Developers",
  description:
    "Curated milestone paths to master local AI engineering, Kenyan fintech & M-Pesa payments, and full-stack cloud application development.",
  alternates: {
    canonical: "/learning-paths",
  },
  openGraph: {
    title: "Structured Learning Paths — CodeVanta Advanta Hub",
    description:
      "Curated milestone paths to master local AI engineering, Kenyan fintech & M-Pesa payments, and full-stack cloud application development.",
    url: "https://www.codevanta.online/learning-paths",
  },
};

export default function LearningPathsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
