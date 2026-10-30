import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Membership Plans & Developer Tiers",
  description:
    "Upgrade to CodeVanta Pro or VIP Architecture membership. Unlock complete tutorial access, verified production blueprints, M-Pesa referral rewards, and priority support.",
  alternates: {
    canonical: "/plans",
  },
  openGraph: {
    title: "Membership Plans — CodeVanta Advanta Hub",
    description:
      "Unlock complete tutorial access, verified production blueprints, M-Pesa referral rewards, and priority support.",
    url: "https://www.codevanta.online/plans",
  },
};

export default function PlansLayout({ children }: { children: React.ReactNode }) {
  return children;
}
