import { DatabaseSync } from "node:sqlite";
import { initialTutorials } from "./tutorials";
import { initialLearningPaths } from "./paths";
import { initialTroubleshooting } from "./troubleshooting";
import { initialProjects } from "./projects";
import { initialStudentBenefits } from "./students";

export function initPhase2SchemaAndData(db: DatabaseSync) {
  // 1. Schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS tutorials (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      estimated_minutes INTEGER NOT NULL DEFAULT 15,
      prerequisites TEXT NOT NULL DEFAULT '[]',
      supported_os TEXT NOT NULL DEFAULT '[]',
      content TEXT NOT NULL,
      troubleshooting_notes TEXT NOT NULL DEFAULT '',
      security_warnings TEXT NOT NULL DEFAULT '',
      official_docs_url TEXT NOT NULL DEFAULT '',
      last_verified_date TEXT NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 1,
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS learning_paths (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'Compass',
      estimated_hours INTEGER NOT NULL DEFAULT 10,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS learning_path_milestones (
      id TEXT PRIMARY KEY,
      path_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      target_type TEXT NOT NULL DEFAULT 'tutorial',
      target_id TEXT,
      target_url TEXT,
      FOREIGN KEY (path_id) REFERENCES learning_paths(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS troubleshooting_entries (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      error_message TEXT NOT NULL,
      affected_tool TEXT NOT NULL,
      category TEXT NOT NULL,
      likely_causes TEXT NOT NULL,
      step_by_step_fix TEXT NOT NULL,
      verification_steps TEXT NOT NULL,
      official_docs_url TEXT NOT NULL DEFAULT '',
      last_verified_date TEXT NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS guided_projects (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      estimated_hours INTEGER NOT NULL DEFAULT 3,
      prerequisites TEXT NOT NULL DEFAULT '[]',
      tech_stack TEXT NOT NULL DEFAULT '[]',
      expected_outcomes TEXT NOT NULL,
      content TEXT NOT NULL,
      starter_code_repo_url TEXT NOT NULL DEFAULT '',
      demo_url TEXT NOT NULL DEFAULT '',
      paid_services_warning TEXT NOT NULL DEFAULT '',
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_benefits (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      provider TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      benefits_included TEXT NOT NULL,
      eligibility_requirements TEXT NOT NULL,
      application_url TEXT NOT NULL,
      limitations TEXT NOT NULL DEFAULT '',
      last_verified_date TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2. Seed Tutorials
  const insertTutorial = db.prepare(`
    INSERT OR IGNORE INTO tutorials (
      id, slug, title, summary, category, difficulty, estimated_minutes,
      prerequisites, supported_os, content, troubleshooting_notes, security_warnings,
      official_docs_url, last_verified_date, is_published, featured, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of initialTutorials) {
    insertTutorial.run(
      t.id,
      t.slug,
      t.title,
      t.summary,
      t.category,
      t.difficulty,
      t.estimated_minutes,
      JSON.stringify(t.prerequisites),
      JSON.stringify(t.supported_os),
      t.content,
      t.troubleshooting_notes,
      t.security_warnings,
      t.official_docs_url,
      t.last_verified_date,
      t.is_published ? 1 : 0,
      t.featured ? 1 : 0,
      t.created_at,
      t.updated_at
    );
  }

  // 3. Seed Learning Paths
  const insertPath = db.prepare(`
    INSERT OR IGNORE INTO learning_paths (
      id, slug, title, description, category, difficulty, icon,
      estimated_hours, display_order, is_published, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of initialLearningPaths) {
    insertPath.run(
      p.id,
      p.slug,
      p.title,
      p.description,
      p.category,
      p.difficulty,
      p.icon,
      p.estimated_hours,
      p.display_order,
      p.is_published ? 1 : 0,
      p.created_at,
      p.updated_at
    );
  }

  // 4. Seed Troubleshooting Entries
  const insertTrouble = db.prepare(`
    INSERT OR IGNORE INTO troubleshooting_entries (
      id, slug, error_message, affected_tool, category, likely_causes,
      step_by_step_fix, verification_steps, official_docs_url,
      last_verified_date, is_published, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const tr of initialTroubleshooting) {
    insertTrouble.run(
      tr.id,
      tr.slug,
      tr.error_message,
      tr.affected_tool,
      tr.category,
      tr.likely_causes,
      tr.step_by_step_fix,
      tr.verification_steps,
      tr.official_docs_url,
      tr.last_verified_date,
      tr.is_published ? 1 : 0,
      tr.created_at,
      tr.updated_at
    );
  }

  // 5. Seed Guided Projects
  const insertProject = db.prepare(`
    INSERT OR IGNORE INTO guided_projects (
      id, slug, title, summary, difficulty, estimated_hours,
      prerequisites, tech_stack, expected_outcomes, content,
      starter_code_repo_url, demo_url, paid_services_warning,
      is_published, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const pr of initialProjects) {
    insertProject.run(
      pr.id,
      pr.slug,
      pr.title,
      pr.summary,
      pr.difficulty,
      pr.estimated_hours,
      JSON.stringify(pr.prerequisites),
      JSON.stringify(pr.tech_stack),
      pr.expected_outcomes,
      pr.content,
      pr.starter_code_repo_url,
      pr.demo_url,
      pr.paid_services_warning,
      pr.is_published ? 1 : 0,
      pr.created_at,
      pr.updated_at
    );
  }

  // 6. Seed Student Benefits
  const insertStudent = db.prepare(`
    INSERT OR IGNORE INTO student_benefits (
      id, slug, title, provider, category, description,
      benefits_included, eligibility_requirements, application_url,
      limitations, last_verified_date, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const sb of initialStudentBenefits) {
    insertStudent.run(
      sb.id,
      sb.slug,
      sb.title,
      sb.provider,
      sb.category,
      sb.description,
      sb.benefits_included,
      sb.eligibility_requirements,
      sb.application_url,
      sb.limitations,
      sb.last_verified_date,
      sb.is_active ? 1 : 0,
      sb.created_at,
      sb.updated_at
    );
  }
}
