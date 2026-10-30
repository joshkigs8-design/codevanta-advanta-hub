import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Developer Benefits & Free Cloud Perks",
  description:
    "Directory of verified student developer benefits: GitHub Student Developer Pack, JetBrains educational licenses, AWS Educate, and Azure for Students.",
  alternates: {
    canonical: "/students",
  },
  openGraph: {
    title: "Student Developer Benefits — CodeVanta Advanta Hub",
    description:
      "Directory of verified student developer benefits: GitHub Student Pack, JetBrains educational licenses, AWS Educate, and Azure for Students.",
    url: "https://www.codevanta.online/students",
  },
};

export default function StudentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

