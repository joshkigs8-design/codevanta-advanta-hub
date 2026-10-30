import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guided Developer Projects & Production Blueprints",
  description:
    "Hands-on coding projects with complete starter repositories: build private local AI chatbots, API currency dashboards, and fullstack notes apps.",
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title: "Guided Developer Projects — CodeVanta Advanta Hub",
    description:
      "Hands-on coding projects with complete starter repositories: build local AI chatbots, currency dashboards, and fullstack applications.",
    url: "https://www.codevanta.online/projects",
  },
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
