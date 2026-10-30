import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal & Regulatory Compliance — Kenyan Consumer Protection & Data Privacy",
  description:
    "CodeVanta Advanta Hub compliance statements adhering to the Kenyan Data Protection Act 2019, Consumer Protection Act 2012, and anti-pyramid referral rules.",
  alternates: {
    canonical: "/compliance",
  },
  openGraph: {
    title: "Legal & Regulatory Compliance — CodeVanta Advanta Hub",
    description:
      "Compliance statements adhering to the Kenyan Data Protection Act 2019, Consumer Protection Act 2012, and anti-pyramid referral rules.",
    url: "https://www.codevanta.online/compliance",
  },
};

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
