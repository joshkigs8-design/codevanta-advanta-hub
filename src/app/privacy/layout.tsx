import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy & Data Protection Notice",
  description: "Learn how CodeVanta Ventures collects, handles, and protects developer data under the Kenya Data Protection Act (DPA 2019) and global privacy standards.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
