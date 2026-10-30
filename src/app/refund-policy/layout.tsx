import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy & Dispute Resolution",
  description: "CodeVanta Advanta Hub refund policy, satisfaction guarantees, and dispute handling processes for paid membership plans.",
  alternates: {
    canonical: "/refund-policy",
  },
};

export default function RefundPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

