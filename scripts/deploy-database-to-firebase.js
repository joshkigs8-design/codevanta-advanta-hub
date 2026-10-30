const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const configPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
if (!fs.existsSync(configPath)) {
  console.error('Firebase CLI configuration not found at:', configPath);
  console.error('Please run "npx firebase login" first.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const token = config.tokens?.access_token;
if (!token) {
  console.error('No access token found in firebase-tools.json. Please run "npx firebase login".');
  process.exit(1);
}

const dbPath = path.resolve(__dirname, '../codevanta.sqlite');
if (!fs.existsSync(dbPath)) {
  console.error('SQLite database not found at:', dbPath);
  process.exit(1);
}

const db = new DatabaseSync(dbPath);
const PROJECT_ID = 'codevanta-hub';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function toFirestoreValue(val) {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }
  return fields;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeDocument(collectionId, docId, data, maxRetries = 4) {
  const url = `${BASE_URL}/${collectionId}/${encodeURIComponent(docId)}`;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: toFirestoreFields(data) })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to write ${collectionId}/${docId}: ${res.status} ${res.statusText} - ${errText}`);
      }
      return;
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      console.warn(`  [Retry ${attempt}/${maxRetries}] for ${collectionId}/${docId}: ${err.message || err}`);
      await sleep(1000 * attempt);
    }
  }
}

function safeParseJson(str, fallback) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

async function deployAll() {
  console.log(`\n==================================================`);
  console.log(`Deploying CodeVanta Database to Cloud Firestore`);
  console.log(`Target Project: ${PROJECT_ID}`);
  console.log(`==================================================\n`);

  // 1. Categories
  const categories = db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all();
  console.log(`Uploading ${categories.length} Categories...`);
  for (const cat of categories) {
    await writeDocument('categories', cat.id, {
      ...cat,
      published: true
    });
  }
  console.log(`✓ Categories uploaded successfully.`);

  // 2. Membership Plans
  const plans = db.prepare('SELECT * FROM membership_plans').all();
  console.log(`\nUploading ${plans.length} Membership Plans...`);
  for (const plan of plans) {
    await writeDocument('plans', plan.id, {
      ...plan,
      entitlements: safeParseJson(plan.entitlements, {}),
      published: true
    });
  }
  console.log(`✓ Membership Plans uploaded successfully.`);

  // 3. Resources
  const resources = db.prepare('SELECT * FROM resources').all();
  console.log(`\nUploading ${resources.length} Developer Resources...`);
  let resCount = 0;
  for (const res of resources) {
    await writeDocument('resources', res.id, {
      ...res,
      published: Boolean(res.is_published ?? true),
      featured: Boolean(res.featured),
      api_key_required: Boolean(res.api_key_required),
      account_required: Boolean(res.account_required),
      credit_card_required: Boolean(res.credit_card_required),
      commercial_use_allowed: Boolean(res.commercial_use_allowed),
      platforms: safeParseJson(res.platforms, []),
      programming_languages: safeParseJson(res.programming_languages, []),
      alternatives: safeParseJson(res.alternatives, []),
      tags: safeParseJson(res.tags, [])
    });
    resCount++;
    if (resCount % 10 === 0 || resCount === resources.length) {
      process.stdout.write(`  ... ${resCount}/${resources.length} resources saved\n`);
    }
    await sleep(50); // slight throttle to be gentle with network connections
  }
  console.log(`✓ Developer Resources uploaded successfully.`);

  // 4. Tutorials (including OpenClaw on Windows)
  const tutorials = db.prepare('SELECT * FROM tutorials').all();
  console.log(`\nUploading ${tutorials.length} Tutorials & Setup Guides...`);
  let tutCount = 0;
  for (const tut of tutorials) {
    await writeDocument('tutorials', tut.id, {
      ...tut,
      published: Boolean(tut.is_published ?? true),
      featured: Boolean(tut.featured),
      prerequisites: safeParseJson(tut.prerequisites, []),
      supported_os: safeParseJson(tut.supported_os, [])
    });
    tutCount++;
    if (tutCount % 5 === 0 || tutCount === tutorials.length) {
      process.stdout.write(`  ... ${tutCount}/${tutorials.length} tutorials saved\n`);
    }
    await sleep(50);
  }
  console.log(`✓ Tutorials uploaded successfully.`);

  // 5. Learning Paths
  const paths = db.prepare('SELECT * FROM learning_paths').all();
  console.log(`\nUploading ${paths.length} Learning Paths...`);
  for (const p of paths) {
    await writeDocument('learning_paths', p.id, {
      ...p,
      published: Boolean(p.is_published ?? true)
    });
    await sleep(50);
  }
  console.log(`✓ Learning Paths uploaded successfully.`);

  // 6. Guided Projects
  const projects = db.prepare('SELECT * FROM guided_projects').all();
  console.log(`\nUploading ${projects.length} Guided Projects...`);
  for (const proj of projects) {
    await writeDocument('projects', proj.id, {
      ...proj,
      published: Boolean(proj.is_published ?? true),
      technologies: safeParseJson(proj.technologies, []),
      learning_outcomes: safeParseJson(proj.learning_outcomes, []),
      starter_files: safeParseJson(proj.starter_files, [])
    });
    await sleep(50);
  }
  console.log(`✓ Guided Projects uploaded successfully.`);

  console.log(`\n==================================================`);
  console.log(`🎉 DATABASE DEPLOYMENT TO FIREBASE COMPLETE!`);
  console.log(`- Categories:     ${categories.length}`);
  console.log(`- Plans:          ${plans.length}`);
  console.log(`- Resources:      ${resources.length}`);
  console.log(`- Tutorials:      ${tutorials.length}`);
  console.log(`- Learning Paths: ${paths.length}`);
  console.log(`- Projects:       ${projects.length}`);
  console.log(`Total Documents:  ${categories.length + plans.length + resources.length + tutorials.length + paths.length + projects.length}`);
  console.log(`==================================================\n`);
}

deployAll().catch((err) => {
  console.error('\nDeployment failed with error:', err);
  process.exit(1);
});
