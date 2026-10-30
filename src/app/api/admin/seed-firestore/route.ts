import { NextRequest, NextResponse } from "next/server";
import { firestore, isFirebaseConfigured } from "@/lib/firebase";
import { doc, setDoc, writeBatch } from "firebase/firestore";
import { initialTutorials } from "@/lib/seeds/tutorials";
import { initialLearningPaths } from "@/lib/seeds/paths";
import { initialTroubleshooting } from "@/lib/seeds/troubleshooting";
import { initialProjects } from "@/lib/seeds/projects";
import { initialStudentBenefits } from "@/lib/seeds/students";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

const DEFAULT_CATEGORIES = [
  { id: "ai-coding-agents", name: "AI Coding Agents & Models", slug: "ai-coding-agents", description: "Local and cloud-based AI code assistants and autonomous development agents.", icon: "Bot", display_order: 1 },
  { id: "backend-apis", name: "Backend APIs & Microservices", slug: "backend-apis", description: "REST, GraphQL, and serverless backends with generous developer tiers.", icon: "Server", display_order: 2 },
  { id: "databases", name: "Databases & Storage", slug: "databases", description: "Managed relational, document, and vector databases with free allowances.", icon: "Database", display_order: 3 },
  { id: "hosting-devops", name: "Hosting & DevOps", slug: "hosting-devops", description: "Continuous deployment, edge networks, container runtimes, and compute platforms.", icon: "Cloud", display_order: 4 },
  { id: "auth-security", name: "Authentication & Security", slug: "auth-security", description: "Identity providers, token security, rule auditors, and access control platforms.", icon: "Shield", display_order: 5 },
];

const DEFAULT_PLANS = [
  { id: "plan_basic", name: "Basic Developer", slug: "basic", price_kes: 50, billing_cycle: "lifetime", description: "Access to curated developer tools, basic tutorials, and community forum." },
  { id: "plan_pro", name: "Pro Engineer", slug: "pro", price_kes: 100, billing_cycle: "monthly", description: "Full access to all tutorials, OpenClaw guides, verified code templates, and priority AI assistant." },
  { id: "plan_vip", name: "VIP Architecture", slug: "vip", price_kes: 150, billing_cycle: "annual", description: "Complete platform access, direct engineering consultation, early access to tools, and private repository reviews." },
];

export async function POST(req: NextRequest) {
  // 1. Verify admin privilege
  const sessionToken = req.cookies.get("cv_hub_session")?.value;
  const user = sessionToken ? verifyToken(sessionToken) : null;
  const secretKey = req.headers.get("x-admin-key");

  const isAuthorized = user?.role === "admin" || (process.env.ADMIN_SEED_SECRET && secretKey === process.env.ADMIN_SEED_SECRET);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  if (!isFirebaseConfigured() || !firestore) {
    return NextResponse.json({ error: "Firebase is not configured in environment variables." }, { status: 500 });
  }

  try {
    let seededCategories = 0;
    let seededPlans = 0;
    let seededTutorials = 0;
    let seededResources = 0;

    // Seed Categories
    for (const cat of DEFAULT_CATEGORIES) {
      await setDoc(doc(firestore, "categories", cat.id), cat, { merge: true });
      seededCategories++;
    }

    // Seed Plans
    for (const plan of DEFAULT_PLANS) {
      await setDoc(doc(firestore, "plans", plan.id), plan, { merge: true });
      seededPlans++;
    }

    // Seed Tutorials
    for (const tut of initialTutorials) {
      await setDoc(
        doc(firestore, "tutorials", tut.id),
        {
          ...tut,
          published: tut.is_published ?? true,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
      seededTutorials++;
    }

    // Seed Resources from existing SQLite if available
    try {
      const db = getDb();
      const resources = db.prepare("SELECT * FROM resources LIMIT 50").all() as any[];
      for (const res of resources) {
        await setDoc(
          doc(firestore, "resources", res.id),
          {
            ...res,
            published: true,
            platforms: typeof res.platforms === "string" ? JSON.parse(res.platforms || "[]") : res.platforms,
            programming_languages: typeof res.programming_languages === "string" ? JSON.parse(res.programming_languages || "[]") : res.programming_languages,
          },
          { merge: true }
        );
        seededResources++;
      }
    } catch (e) {
      console.warn("Could not read local SQLite resources for migration:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Firestore seeded successfully.",
      stats: {
        categories: seededCategories,
        plans: seededPlans,
        tutorials: seededTutorials,
        resources: seededResources,
      },
    });
  } catch (err: any) {
    console.error("Firestore seed error:", err);
    return NextResponse.json({ error: err.message || "Failed to seed Firestore" }, { status: 500 });
  }
}

