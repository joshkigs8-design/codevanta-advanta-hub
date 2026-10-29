import type { GuidedProject } from "../../types";

const now = "2026-10-29T10:00:00.000Z";

export const initialProjects: GuidedProject[] = [
  {
    id: "proj-local-ai-chatbot",
    slug: "build-private-local-ai-chatbot",
    title: "Build a Private Local AI Chatbot with Ollama & Next.js",
    summary: "Create a fast, responsive streaming chatbot that runs 100% offline on your own computer with zero API costs.",
    difficulty: "beginner",
    estimated_hours: 3,
    prerequisites: ["Node.js v18+", "Ollama installed locally"],
    tech_stack: ["Next.js 14", "TypeScript", "Tailwind CSS", "Ollama API"],
    expected_outcomes: "A fully working desktop/mobile web interface that streams responses from local Llama 3.2 or DeepSeek Coder.",
    content: `# Build a Private Local AI Chatbot

---

## Architecture Overview
The user interface connects directly to your local Ollama daemon at \`http://127.0.0.1:11434\` via a Next.js API route handler to avoid CORS restrictions.

## Implementation Steps
1. **Initialize Project:** \`npx create-next-app@latest my-local-ai --typescript --tailwind --app\`
2. **Create Route Handler:** Implement \`src/app/api/chat/route.ts\` to proxy requests to Ollama.
3. **Build Chat UI:** Create a message list and sticky prompt input.
4. **Stream Text:** Read the ReadableStream response using TextDecoder.
`,
    starter_code_repo_url: "https://github.com/codevanta/local-ai-chatbot-starter",
    demo_url: "/tutorials/running-local-llms-ollama-hardware-guide",
    paid_services_warning: "100% Free. Runs entirely on local hardware with zero cloud subscriptions.",
    is_published: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "proj-api-weather-currency-site",
    slug: "api-powered-developer-dashboard",
    title: "Build an API-Powered Currency & Tech Stack Tracker",
    summary: "Learn to fetch, cache, and display live currency exchange rates and cloud infrastructure uptime with server components.",
    difficulty: "beginner",
    estimated_hours: 2,
    prerequisites: ["Basic JavaScript / React"],
    tech_stack: ["React", "Next.js", "Public APIs", "Tailwind CSS"],
    expected_outcomes: "A live dashboard displaying KES/USD conversion and real-time status of top developer clouds.",
    content: `# Build an API-Powered Dashboard

---

## Implementation Steps
1. Register for free tier open exchange rates or public weather APIs.
2. Implement caching with Next.js \`fetch(url, { next: { revalidate: 3600 } })\`.
3. Display metrics in clean frosted bento cards.
`,
    starter_code_repo_url: "https://github.com/codevanta/api-dashboard-starter",
    demo_url: "/directory",
    paid_services_warning: "Uses verified zero-card free tiers only.",
    is_published: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "proj-fullstack-ai-notes",
    slug: "fullstack-ai-notes-and-summarizer",
    title: "Build a Full-Stack AI Notes App with SQLite & Gemini 2.0",
    summary: "Build a note-taking web application with instant AI document summarization, tag filtering, and local SQLite persistence.",
    difficulty: "intermediate",
    estimated_hours: 4,
    prerequisites: ["Next.js basics", "Google AI Studio API key (free tier)"],
    tech_stack: ["Next.js", "SQLite", "Google Gemini 2.0 Flash", "Tailwind CSS"],
    expected_outcomes: "A complete CRUD application with database persistence and AI-generated executive summaries.",
    content: `# Full-Stack AI Notes & Summarizer

---

## Implementation Steps
1. Setup SQLite database with \`notes\` table.
2. Implement CRUD server actions or route handlers.
3. Add 'Summarize with Gemini' button connecting to Gemini 2.0 Flash free tier.
4. Deploy to Vercel or local server.
`,
    starter_code_repo_url: "https://github.com/codevanta/ai-notes-starter",
    demo_url: "/guides",
    paid_services_warning: "Gemini 2.0 Flash offers a generous free tier of up to 15 RPM with no credit card required.",
    is_published: true,
    created_at: now,
    updated_at: now,
  },
];

