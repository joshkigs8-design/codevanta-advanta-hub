import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service & Developer Agreement",
  description: "Terms and conditions governing the use of CodeVanta Advanta Hub resources, APIs, and membership features.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

