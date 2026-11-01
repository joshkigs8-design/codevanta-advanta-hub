import type { Tutorial } from "../../types";

const now = "2026-10-29T10:00:00.000Z";

export const initialTutorials: Tutorial[] = [
  {
    id: "tut-openclaw-windows-ollama-nvidia",
    slug: "openclaw-windows-ollama-nvidia",
    title: "OpenClaw on Windows: Install, Configure, and Run It with Ollama or NVIDIA",
    summary: "A verified Windows guide for OpenClaw, the Windows Hub, Ollama models, and NVIDIA-hosted inference, with safe setup and troubleshooting steps.",
    category: "ai-coding-agents",
    difficulty: "beginner",
    estimated_minutes: 35,
    prerequisites: [
      "Windows 10 or Windows 11 with current updates",
      "A Windows 10 20H2+ or Windows 11 computer",
      "Administrator access only when your chosen installer requires it",
      "Node.js 24.16.0+ if you install the CLI directly",
      "PowerShell and basic terminal familiarity",
    ],
    supported_os: ["Windows 10/11", "Windows 10/11 with WSL2"],
    content: `# OpenClaw on Windows with Ollama or NVIDIA

> **Scope:** This guide follows the current OpenClaw install and Windows documentation. Commands and provider names can change; always compare them with the linked official pages before installing.

## What you will build

OpenClaw is the agent application. Its **Gateway** manages sessions, channels, tools, and permissions; the **Control UI** or desktop app is the interface; and a **model provider** generates responses. Ollama can run a model locally or provide Ollama-hosted models. NVIDIA AI provides hosted inference endpoints; an NVIDIA GPU on your computer is a separate local-inference option.

The agent can do more than answer a chat message because tools and integrations can give it access to files, commands, browsers, or messaging channels. Begin with a harmless test and grant only the permissions you need.

## Requirements and choices

- Windows 10 version 20H2 or newer, or Windows 11, for the Windows Hub.
- Use the **Windows Hub** when you want the supported desktop setup, tray status, chat, diagnostics, and local Windows-node features.
- Use the PowerShell installer when you specifically want the CLI.
- Use WSL2 when your Gateway and existing automation are Linux-based. Keep the Gateway and model runtime in the same environment while troubleshooting localhost connections.
- Direct CLI installation requires Node 24.16.0+ on the 24.x line or Node 26.1.0+. The installer can provision a supported Node version.
- Ollama model memory, disk usage, context length, and tool support vary by model. Do not use a fixed RAM/VRAM table as a guarantee.

## 1. Install OpenClaw on Windows

### Recommended: Windows Hub

Download the signed installer from the [Windows Hub releases page](https://github.com/openclaw/openclaw-windows-node/releases/latest). Choose x64 or ARM64 for your computer. The Hub does not require administrator privileges. Launch **OpenClaw Companion** from Start or the system tray.

On first launch choose **Set up locally** to provision the app-owned WSL Gateway, or choose **Advanced setup** to connect to an existing local, remote, or SSH-tunneled Gateway. A green tray status and a successful Command Center connection confirm that setup completed.

Do not confuse device approval with command-surface approval. If the Hub asks for pairing, use the device and node approval commands documented in the [Windows guide](https://docs.openclaw.ai/platforms/windows).

### CLI: PowerShell

Review the installer source and your organization's policy before executing a remote script:

\`\`\`powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
\`\`\`

For a non-interactive install, use the documented \`-NoOnboard\` form:

\`\`\`powershell
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
\`\`\`

After installation, run onboarding and install the Gateway daemon:

\`\`\`powershell
openclaw onboard --install-daemon
openclaw --version
openclaw doctor
openclaw gateway status
\`\`\`

Use the exact commands exposed by your installed version. \`openclaw dashboard\` is useful when that command is available; otherwise open the Control UI using the URL shown by onboarding or the Gateway status command.

### WSL2

Install WSL2 using Microsoft's current documentation, then follow the OpenClaw Linux instructions inside the distribution. Do not assume a Windows Ollama process is reachable from WSL2 without testing it from the Gateway environment.

## 2. Configure Ollama

[Ollama](https://ollama.com/) is a model runtime, not OpenClaw itself. A local Ollama model uses your computer's resources and can keep prompts local. An Ollama cloud model still sends requests to a hosted service and may have account, quota, or cost conditions.

Install Ollama from its [official download page](https://ollama.com/download), open a new PowerShell window, and verify:

\`\`\`powershell
ollama --version
ollama list
\`\`\`

The official OpenClaw tutorial currently documents this integrated path:

\`\`\`powershell
ollama launch openclaw --model kimi-k2.5:cloud
\`\`\`

Use that command only when your Ollama version exposes \`ollama launch openclaw\`. Ollama's model selector may offer other cloud or local models. Model names, context length, tool calling, and hardware needs are model-specific.

To test a local model independently, choose a current tag from the [Ollama library](https://ollama.com/library):

\`\`\`powershell
ollama pull <model-tag-from-the-library>
ollama run <model-tag-from-the-library>
\`\`\`

Exit the interactive session only after a response is returned. Then use OpenClaw's current onboarding/provider settings to select the same model. Verify the Gateway is connected and send a harmless request such as: “List three filenames I could use for a notes folder; do not read or change files.”

If you need to test Ollama without OpenClaw, its local API is normally available at \`http://127.0.0.1:11434\`. Use the API documentation and a model that appears in \`ollama list\`; do not expose this port to the public internet.

## 3. Configure NVIDIA-hosted inference

[NVIDIA Build](https://build.nvidia.com/) provides hosted inference endpoints and agentic skills. This is different from running a model on a local NVIDIA GPU. Create an account, choose an available model page, and generate an API key according to NVIDIA's current instructions. Availability, rate limits, and pricing can change.

Store the key in a local secret manager or an environment variable that is not committed:

\`\`\`powershell
$env:NVIDIA_API_KEY = "<load-the-real-key-from-your-secret-store>"
\`\`\`

Test the endpoint using the request example on the selected NVIDIA model page before connecting OpenClaw. Record the provider name, endpoint URL, and exact model identifier. Then configure OpenClaw only if its current provider settings support that provider or a compatible OpenAI-style endpoint. A valid NVIDIA key alone does not prove that the selected model is compatible with OpenClaw tools.

For local NVIDIA GPU inference, install the current driver and a supported serving runtime separately. Check the runtime's model, VRAM, CUDA, and tool-calling requirements. Do not describe a local GPU setup as NVIDIA-hosted inference.

## 4. Ollama versus NVIDIA-hosted inference

| Consideration | Ollama local model | NVIDIA-hosted endpoint |
| --- | --- | --- |
| Internet | Not required after model download, unless using hosted Ollama models | Required |
| Privacy | Prompts can remain on the device | Prompts go to the provider |
| Hardware | Uses local disk, RAM, and possibly GPU memory | Local model hardware is not required |
| Cost | Electricity and hardware; no per-request cloud fee for local inference | Account limits, pricing, and quotas can change |
| Setup | Install runtime and download a compatible model | Create account, key, endpoint, and provider configuration |
| Reliability | Depends on local resources and service health | Depends on network, quotas, and provider service |

Neither option guarantees tool use. Confirm the model and OpenClaw version support the capabilities you need.

## 5. Safe first project

1. Install the Windows Hub or CLI and confirm Gateway health.
2. Connect one model provider.
3. Keep file, shell, browser, and messaging tools disabled or restricted.
4. Send a harmless request asking for a three-item checklist.
5. Confirm the response came from the expected model/provider.
6. Only then enable one narrowly scoped tool and test it on a disposable folder.
7. Review logs, permissions, and the resulting diff before expanding access.

## Troubleshooting

| Symptom | Diagnose | Fix |
| --- | --- | --- |
| \`openclaw\` or \`ollama\` is not recognized | Open a new PowerShell window and check the install completed and PATH | Re-run the supported installer or use the Windows Hub |
| Gateway will not start | Run \`openclaw doctor\` and \`openclaw gateway status\` | Follow the reported repair step; do not start a second Gateway blindly |
| Ollama connection refused | Check \`ollama list\` and whether the Ollama service is running in the same environment | Start Ollama, then retest before changing OpenClaw settings |
| Model unavailable | Compare the exact identifier with \`ollama list\` or the provider catalog | Pull/select a currently available model |
| NVIDIA authentication fails | Test the model endpoint independently and check the key, endpoint, quota, and model ID | Create a new key if necessary and keep it outside source control |
| Port already in use | Inspect the process owning the documented port | Stop the intended duplicate process or choose the supported configured port |
| Slow or out-of-memory responses | Check model requirements and local resource usage | Use a smaller compatible model, shorter context, or fewer concurrent applications |

## Security checklist

- Never commit API keys, installer output containing secrets, or private Gateway tokens.
- Keep OpenClaw and Ollama on loopback/private networks unless the official security guidance and an authenticated design justify exposure.
- Use least-privilege workspaces and disposable test data.
- Review every tool permission, pairing request, and command-surface expansion.
- Back up configuration before changing providers.
- Treat messaging integrations and shell access as high-impact capabilities.

## Official references

- [OpenClaw installation](https://docs.openclaw.ai/install)
- [OpenClaw Windows guide](https://docs.openclaw.ai/platforms/windows)
- [OpenClaw security](https://docs.openclaw.ai/gateway/security)
- [Ollama download](https://ollama.com/download)
- [Ollama OpenClaw tutorial](https://ollama.com/blog/openclaw-tutorial)
- [Ollama model library](https://ollama.com/library)
- [NVIDIA Build](https://build.nvidia.com/)
`,
    troubleshooting_notes: "Use the official OpenClaw Windows and install pages for version-specific commands. Test Gateway and Ollama from the same environment, compare model identifiers exactly, and diagnose NVIDIA endpoint, model, key, and quota errors independently before changing OpenClaw configuration.",
    security_warnings: "Review remote installer scripts before execution. Keep Gateway and Ollama private, restrict tools and workspaces, approve only expected devices and command surfaces, and store provider keys outside source control.",
    official_docs_url: "https://docs.openclaw.ai/install",
    last_verified_date: "2026-11-01",
    is_published: true,
    featured: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "tut-ollama-multi-os-setup",
    slug: "running-local-llms-ollama-hardware-guide",
    title: "Running Local LLMs with Ollama: Windows, macOS & Linux Hardware Sizing Guide",
    summary: "Complete guide to local AI inference: install Ollama, size models based on RAM/VRAM, configure the local REST API, and diagnose memory bottlenecks.",
    category: "local-ai",
    difficulty: "beginner",
    estimated_minutes: 20,
    prerequisites: ["Terminal familiarity", "Minimum 8GB RAM (16GB recommended for 7B/8B models)"],
    supported_os: ["Windows 10/11", "macOS (Apple Silicon & Intel)", "Ubuntu / Debian / Fedora Linux"],
    content: `# Running Local LLMs with Ollama: Setup & Hardware Sizing

Running language models locally provides complete data privacy, offline execution, and zero token API costs. However, performance depends on system RAM, GPU VRAM, and memory bandwidth.

---

## 1. Hardware Sizing & Model Selection Matrix

Before pulling any model, match your hardware against verified memory footprints:

| System Memory | Max Practical Model | Quantization | Context Window | Inference Speed |
| :--- | :--- | :--- | :--- | :--- |
| **8 GB RAM (No dedicated GPU)** | Llama 3.2 1B, Llama 3.2 3B | Q4_K_M | 4,096 tokens | 15 - 28 tok/s |
| **16 GB RAM (or 6-8GB VRAM)** | Llama 3.1 8B, Mistral 7B, Qwen 2.5 7B | Q4_K_M | 8,192 tokens | 25 - 50 tok/s |
| **32 GB RAM (or 12-16GB VRAM)** | DeepSeek Coder 14B, Qwen 2.5 14B | Q4_K_M | 16,384 tokens | 30 - 65 tok/s |
| **64 GB+ RAM (Apple M-Series Max)** | Llama 3.3 70B, Qwen 2.5 32B | Q4_K_M | 32,768 tokens | 15 - 35 tok/s |

> [!WARNING]
> Do NOT attempt to run 70B models on 16GB of RAM. The operating system will swap to disk, causing high disk thrashing and terminal freezes.

---

## 2. Installation Across Platforms

### Windows (10/11 64-bit)
1. Download the installer from the official site: \`https://ollama.com/download/windows\`.
2. Run \`OllamaSetup.exe\`. Ollama registers a background daemon and detects NVIDIA CUDA GPUs automatically.
3. Open PowerShell and verify:
\`\`\`powershell
ollama --version
\`\`\`

### macOS (Apple Silicon M1/M2/M3/M4 & Intel)
Install via official archive or Homebrew:
\`\`\`bash
brew install ollama
\`\`\`
Launch Ollama to start the background service:
\`\`\`bash
ollama serve
\`\`\`

### Linux (Ubuntu, Debian, Fedora, Arch)
Run the verified official installation script:
\`\`\`bash
curl -fsSL https://ollama.ai/install.sh | sh
\`\`\`
Verify systemd status:
\`\`\`bash
sudo systemctl status ollama
\`\`\`

---

## 3. Pulling, Running & Managing Models

### Pulling a Model
\`\`\`bash
ollama pull llama3.2:3b
\`\`\`

### Starting an Interactive Chat Session
\`\`\`bash
ollama run llama3.2:3b
\`\`\`
To exit the interactive prompt, type:
\`\`\`bash
/bye
\`\`\`

### Listing Downloaded Models & Storage
\`\`\`bash
ollama list
\`\`\`

### Removing Unused Models to Reclaim Disk
\`\`\`bash
ollama rm llama3.2:3b
\`\`\`

---

## 4. Connecting Compatible Tools to Ollama API

Ollama exposes a local HTTP REST service at \`http://127.0.0.1:11434\`.

### Test with cURL:
\`\`\`bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:3b",
  "prompt": "Write a TypeScript function to calculate Fibonacci numbers iteratively.",
  "stream": false
}'
\`\`\`

### Node.js / Next.js Integration Example:
\`\`\`typescript
export async function queryLocalModel(prompt: string) {
  const res = await fetch("http://127.0.0.1:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.2:3b",
      messages: [{ role: "user", content: prompt }],
      stream: false,
    }),
  });
  const data = await res.json();
  return data.message.content;
}
\`\`\`
`,
    troubleshooting_notes: "If you encounter 'connect ECONNREFUSED 127.0.0.1:11434', verify Ollama is running in the background. On Windows, check the taskbar icon. On Linux, run 'sudo systemctl start ollama'.",
    security_warnings: "Never bind Ollama to 0.0.0.0 or expose port 11434 to public networks without an authenticated reverse proxy (e.g. Nginx with HTTP Basic Auth), as it permits unauthenticated remote code execution.",
    official_docs_url: "https://github.com/ollama/ollama/blob/main/docs/api.md",
    last_verified_date: "2026-10-29",
    is_published: true,
    featured: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "tut-ai-coding-agents-guide",
    slug: "ai-coding-agents-opencode-claude-codex-antigravity",
    title: "AI Coding Agents: OpenCode, Claude Code, Codex & Antigravity Workflows",
    summary: "Set up and orchestrate terminal-based autonomous AI coding agents with safe permission controls, repository instruction files, and diff verification.",
    category: "ai-coding-agents",
    difficulty: "intermediate",
    estimated_minutes: 25,
    prerequisites: ["Node.js v18+ or Python 3.10+", "Git initialized in project", "Model provider API key or local Ollama"],
    supported_os: ["Windows (PowerShell / WSL2)", "macOS", "Linux"],
    content: `# Autonomous AI Coding Agents: Production Workflows

Coding agents differ from chatbots: they read your project files, run terminal commands, write atomic diffs, and verify code with test suites.

---

## 1. Establishing Repository Guardrails (\`CLAUDE.md\` / \`.agent-rules\`)

Always create a repository instruction file in your project root before launching an agent.

Create \`CLAUDE.md\`:
\`\`\`markdown
# PROJECT GUIDELINES & AGENT INSTRUCTIONS

## Commands
- Build: \`npm run build\`
- Test: \`npm test\`
- Lint: \`npm run lint\`

## Architectural Standards
- Primary Palette: Obsidian navy \`#080a0f\` (bg-hub-bg), Ruby accent \`#c9003d\`.
- Never commit secrets or hardcoded API keys.
- Preserve existing comments and docstrings.
- Verify changes by running tests before finishing turns.
\`\`\`

---

## 2. Installing Claude Code

Install the official Claude CLI globally:
\`\`\`bash
npm install -g @anthropic-ai/claude-code
\`\`\`

Initialize and log in:
\`\`\`bash
cd /path/to/project
claude
\`\`\`

Set context limit warnings:
\`\`\`bash
claude config set max_tokens 4096
\`\`\`

---

## 3. Configuring OpenCode with Local Models

For zero cloud spend, connect OpenCode to your local Ollama runner:
\`\`\`bash
npm install -g opencode-ai
opencode config set provider ollama
opencode config set base_url http://localhost:11434
opencode config set model deepseek-coder:6.7b
\`\`\`

---

## 4. Code Review & Diff Verification Routine

Always review what the agent changed before committing:
\`\`\`bash
# 1. Inspect modified files
git status

# 2. Review exact line-by-line diffs
git diff

# 3. Run your automated test suite
npm test
\`\`\`
`,
    troubleshooting_notes: "If an agent produces circular imports or hallucinated package versions, specify your exact Node.js and Next.js versions in CLAUDE.md.",
    security_warnings: "Never run agents with sudo/root privileges. Always verify that .env and .env.local are listed in .gitignore before running agents.",
    official_docs_url: "https://docs.anthropic.com/en/docs/agents-and-tools/claude-code",
    last_verified_date: "2026-10-29",
    is_published: true,
    featured: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "tut-vscode-ai-workspace",
    slug: "production-vscode-ai-workspace-continue-ollama",
    title: "Production VS Code AI Setup: Continue.dev, Local Models & Secret Security",
    summary: "Transform Visual Studio Code into an AI development workstation with privacy-first autocompletion, Continue.dev, local Ollama endpoints, and secret protection.",
    category: "ides-tools",
    difficulty: "beginner",
    estimated_minutes: 15,
    prerequisites: ["Visual Studio Code installed", "Git configured"],
    supported_os: ["Windows", "macOS", "Linux"],
    content: `# Production VS Code AI Development Setup

---

## 1. Essential AI Extensions

Install via the official VS Code Marketplace:
- **Continue (\`Continue.continue\`):** Open-source copilot supporting local Ollama, Claude, and OpenAI endpoints.
- **GitLens (\`eamodio.gitlens\`):** Line-by-line git blame and diff navigation.
- **Tailwind CSS IntelliSense (\`bradlc.vscode-tailwindcss\`):** Class autocompletion.
- **DotENV (\`mikestead.dotenv\`):** Syntax highlighting for environment files.

---

## 2. Configuring Continue with Local Ollama

Edit \`~/.continue/config.json\`:
\`\`\`json
{
  "models": [
    {
      "title": "Local DeepSeek Coder 6.7B",
      "provider": "ollama",
      "model": "deepseek-coder:6.7b",
      "apiBase": "http://localhost:11434"
    },
    {
      "title": "Local Llama 3.2 3B",
      "provider": "ollama",
      "model": "llama3.2:3b",
      "apiBase": "http://localhost:11434"
    }
  ],
  "tabAutocompleteModel": {
    "title": "Tab Autocomplete",
    "provider": "ollama",
    "model": "qwen2.5-coder:1.5b",
    "apiBase": "http://localhost:11434"
  }
}
\`\`\`

---

## 3. Secret Protection: Preventing Accidental Key Leaks

Configure exclusion rules in \`.vscode/settings.json\`:
\`\`\`json
{
  "files.exclude": {
    "**/.git": true,
    "**/.env.local": false
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true
  }
}
\`\`\`
`,
    troubleshooting_notes: "If Continue shows 'Failed to fetch', ensure Ollama is running and responding on http://localhost:11434.",
    security_warnings: "Be cautious when copying code snippets containing API keys into public chat windows.",
    official_docs_url: "https://docs.continue.dev",
    last_verified_date: "2026-10-29",
    is_published: true,
    featured: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "tut-cloud-remote-dev-ssh",
    slug: "cloud-coding-remote-ssh-headless-agents",
    title: "Cloud & Remote Development: Running Headless Coding Agents via SSH",
    summary: "Run heavy coding agents, builds, and test suites on remote cloud servers via SSH, tmux, and browser IDEs without draining your local laptop battery.",
    category: "cloud-remote",
    difficulty: "intermediate",
    estimated_minutes: 20,
    prerequisites: ["Basic SSH knowledge", "A Linux VPS (e.g. Hetzner, DigitalOcean, or AWS EC2)"],
    supported_os: ["Windows", "macOS", "Linux"],
    content: `# Cloud Coding & Remote Development Architecture

Running autonomous agents on local machines can consume significant CPU and battery. Offloading workloads to an inexpensive cloud virtual machine keeps builds running 24/7.

---

## 1. Setting Up an SSH Keypair

Generate an Ed25519 keypair locally:
\`\`\`bash
ssh-keygen -t ed25519 -C "developer@codevanta"
\`\`\`

Copy to your remote server:
\`\`\`bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub ubuntu@your-server-ip
\`\`\`

---

## 2. Keeping Autonomous Sessions Alive with \`tmux\`

Launch a persistent session:
\`\`\`bash
tmux new -s agent-session
\`\`\`

Run your coding agent inside tmux:
\`\`\`bash
claude
\`\`\`

Detach cleanly by pressing \`Ctrl+B\` then \`D\`. Disconnecting your laptop will NOT terminate the agent.

Re-attach anytime:
\`\`\`bash
tmux attach -t agent-session
\`\`\`

---

## 3. Quota & Cost Guardrails

- Choose cost-effective virtual servers (e.g. Hetzner Cloud CPX21: 3 vCPU, 4GB RAM for ~\$8/mo).
- Set billing alert thresholds on AWS or DigitalOcean at \$15 to prevent bill surprises.
`,
    troubleshooting_notes: "If SSH disconnects after a few minutes of inactivity, add 'ServerAliveInterval 60' to your local ~/.ssh/config.",
    security_warnings: "Disable root password login in /etc/ssh/sshd_config and rely exclusively on public key authentication.",
    official_docs_url: "https://code.visualstudio.com/docs/remote/ssh",
    last_verified_date: "2026-10-29",
    is_published: true,
    featured: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: "tut-production-deployment-guide",
    slug: "deploying-nextjs-15-supabase-vercel-edge",
    title: "Deploying Full-Stack Next.js 15 with Supabase & Vercel Edge",
    summary: "Production blueprint for launching Next.js 15 applications with Supabase PostgreSQL, pooled database connections, Row Level Security, and custom domains.",
    category: "deployment",
    difficulty: "advanced",
    estimated_minutes: 30,
    prerequisites: ["GitHub account", "Vercel account", "Supabase account"],
    supported_os: ["Windows", "macOS", "Linux"],
    content: `# Production Next.js 15 + Supabase Deployment Blueprint

---

## 1. Environment Variable Architecture

Configure your production environment variables in Vercel:

| Variable | Target | Purpose |
| :--- | :--- | :--- |
| \`NEXT_PUBLIC_SUPABASE_URL\` | Client & Server | Public Supabase API gateway URL |
| \`NEXT_PUBLIC_SUPABASE_ANON_KEY\` | Client & Server | Safe client-side anonymous key |
| \`SUPABASE_SERVICE_ROLE_KEY\` | Server Only | Privileged database admin key |
| \`JWT_SECRET\` | Server Only | High-entropy session secret |

---

## 2. Connection Pooling & Scale-to-Zero

In serverless architectures (Vercel Edge & Serverless Functions), each invocation can open a new database connection. 
Always use Supabase **Transaction Pooler** (port 6543) or **Session Pooler** (port 5432) to prevent \`FATAL: too many connections for role\`.

---

## 3. Row Level Security (RLS) Checklist

Before deploying, ensure RLS is enabled on all tables:
\`\`\`sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);
\`\`\`
`,
    troubleshooting_notes: "If you encounter 'Module not found: Can't resolve...' during Vercel build, ensure all dependencies are listed in package.json under 'dependencies' rather than 'devDependencies'.",
    security_warnings: "NEVER expose SUPABASE_SERVICE_ROLE_KEY with a NEXT_PUBLIC_ prefix in frontend code.",
    official_docs_url: "https://nextjs.org/docs/app/building-your-application/deploying",
    last_verified_date: "2026-10-29",
    is_published: true,
    featured: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "tut-ollama-model-run",
    slug: "download-and-run-a-local-language-model",
    title: "Download and Run a Local Language Model",
    summary: "Use Ollama to download a model, start a chat, and reclaim disk space safely.",
    category: "local-ai",
    difficulty: "beginner",
    estimated_minutes: 15,
    prerequisites: ["Ollama installed", "Stable internet connection", "Enough disk space for the model"],
    supported_os: ["Windows", "macOS", "Linux"],
    content: `# Download and Run a Local Language Model\n\nReview the current model library before choosing a tag. Start small and test the model with your real workload.\n\n\`\`\`powershell\nollama pull llama3.2:3b\nollama run llama3.2:3b\nollama list\nollama rm llama3.2:3b\n\`\`\`\n\nExit an interactive session with \`/bye\`. Model sizes and requirements change, so use the model page as the source of truth.`,
    troubleshooting_notes: "If the model is slow, use a smaller quantized tag and close memory-heavy applications.",
    security_warnings: "Only download models from the official library or a source you understand and trust.",
    official_docs_url: "https://ollama.com/library",
    last_verified_date: "2026-10-29",
    is_published: true,
    featured: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: "tut-limited-ram-model-selection",
    slug: "choose-an-ai-model-for-limited-ram",
    title: "Choose an AI Model for a Computer with Limited RAM",
    summary: "Match model size and quantization to available memory, then benchmark on your own prompts.",
    category: "local-ai",
    difficulty: "beginner",
    estimated_minutes: 12,
    prerequisites: ["Your computer's RAM amount", "A clear task to test", "A memory monitor"],
    supported_os: ["Windows", "macOS", "Linux"],
    content: `# Choose an AI Model for Limited RAM\n\nLeave memory for the operating system and your editor. As a starting point, try a 3B model on 8 GB RAM, a 7B/8B model on 16 GB, and larger models only after measuring actual usage.\n\nRun the same five prompts against each candidate and record response quality, latency, and memory pressure. A smaller reliable model is often more useful than a larger model that swaps to disk.`,
    troubleshooting_notes: "If the computer becomes unresponsive, stop the model and reduce model size or context length.",
    security_warnings: "Do not use model benchmarks as a guarantee of performance on your hardware.",
    official_docs_url: "https://ollama.com/library",
    last_verified_date: "2026-10-29",
    is_published: true,
    featured: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: "tut-opencode-cloud-providers",
    slug: "connect-opencode-to-cloud-model-providers",
    title: "Connect OpenCode to Cloud Model Providers",
    summary: "Configure a provider key with least privilege and verify a cloud model connection safely.",
    category: "ai-coding-agents",
    difficulty: "intermediate",
    estimated_minutes: 18,
    prerequisites: ["OpenCode installed", "Provider account", "A local secret store or environment variable"],
    supported_os: ["Windows", "macOS", "Linux"],
    content: `# Connect OpenCode to Cloud Providers\n\nCreate a key in the provider's official console, apply usage limits, and follow OpenCode's current provider configuration documentation. Test with a low-cost model first.\n\nKeep the key outside source control. The exact provider name, model ID, and environment variable can change, so do not copy undocumented settings from an old blog post.`,
    troubleshooting_notes: "Check the provider dashboard, model identifier, account permissions, and local environment reload before changing application code.",
    security_warnings: "Never paste provider keys into source files, screenshots, chat transcripts, or issue reports.",
    official_docs_url: "https://opencode.ai/docs",
    last_verified_date: "2026-10-29",
    is_published: true,
    featured: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: "tut-local-model-coding-tools",
    slug: "connect-local-models-to-coding-tools",
    title: "Connect Compatible Local Models to Coding Tools",
    summary: "Verify a local Ollama endpoint and configure a coding client without guessing its provider format.",
    category: "ai-coding-agents",
    difficulty: "intermediate",
    estimated_minutes: 20,
    prerequisites: ["A local model runner", "A downloaded model", "A coding tool with local provider support"],
    supported_os: ["Windows", "macOS", "Linux"],
    content: `# Connect Local Models to Coding Tools\n\nVerify the local service before configuring your editor:\n\n\`\`\`powershell\ncurl http://localhost:11434/api/tags\n\`\`\`\n\nUse the exact base URL, model name, and API mode documented by the client. If the tool expects OpenAI compatibility, use the compatibility endpoint documented by the tool and start with a read-only task.`,
    troubleshooting_notes: "For connection failures, confirm the runner is active, the model name matches `ollama list`, and the client supports the selected API mode.",
    security_warnings: "Keep local model ports bound to localhost unless you have deliberately configured authentication and network controls.",
    official_docs_url: "https://docs.ollama.com/openai",
    last_verified_date: "2026-10-29",
    is_published: true,
    featured: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: "tut-api-key-security",
    slug: "use-api-keys-securely",
    title: "Use API Keys Securely",
    summary: "Scope, store, rotate, and revoke API keys without exposing them in code or browser bundles.",
    category: "cloud-remote",
    difficulty: "beginner",
    estimated_minutes: 14,
    prerequisites: ["Provider key-management access", "A local environment file excluded from Git", "A rotation plan"],
    supported_os: ["Windows", "macOS", "Linux"],
    content: `# Use API Keys Securely\n\nTreat API keys as passwords. Store them in environment variables or a managed secret store, restrict their permissions and spend, and keep server-only credentials out of browser bundles.\n\nIf a key is exposed, revoke it first, inspect recent usage, and create a replacement. Deleting a commit does not make an exposed key safe.`,
    troubleshooting_notes: "If a deployment cannot read a secret, check the deployment environment scope and restart or redeploy after updating it.",
    security_warnings: "Never commit `.env` files or hardcode credentials. Enable secret scanning where your Git provider supports it.",
    official_docs_url: "https://docs.github.com/code-security/secret-scanning",
    last_verified_date: "2026-10-29",
    is_published: true,
    featured: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: "tut-moviebox-tui-vlc-iptv",
    slug: "moviebox-tui-vlc-iptv-streaming-setup",
    title: "MovieBox-TUI & VLC IPTV: Setup Terminal Streaming and 8,000+ Free Live TV Channels",
    summary: "Step-by-step setup guide for MovieBox-TUI (Rust) and VLC Media Player to stream movies, series, anime, and global legal IPTV channels directly from the command line.",
    category: "ides-tools",
    difficulty: "beginner",
    estimated_minutes: 25,
    prerequisites: [
      "Windows 10/11, macOS, Linux, or Android Termux",
      "VLC Media Player or mpv installed locally",
      "Basic terminal or PowerShell knowledge",
      "Optional: Scoop on Windows or Homebrew on macOS",
    ],
    supported_os: ["Windows 10/11", "macOS", "Linux", "Android (Termux)"],
    content: `# MovieBox-TUI & VLC IPTV: Terminal Streaming and Live TV Guide

> **Overview:** Stream movies, series, anime, and thousands of free, legal live television broadcasts directly from your command line using MovieBox-TUI and VLC Media Player.

---

## 1. What is MovieBox-TUI?

**[MovieBox-TUI](https://github.com/mesamirh/MovieBox-Tui)** is an open-source, high-performance terminal user interface written in Rust. It enables developers to browse, search, and stream multimedia content without opening heavy web browsers or ad-cluttered websites.

### Key Capabilities:
- **Zero Ads / Zero Popups:** Bypasses browser trackers and ad networks by directly extracting clean media streams.
- **Hardware-Accelerated External Players:** Automatically launches **VLC**, **mpv**, or **IINA** with proper user-agent headers and cookie forwarding.
- **Resolution Control:** Pick your stream quality (4K, 1080p, 720p, 480p, or Auto) before playback.
- **Batch Downloading:** Download entire seasons or individual episodes concurrently via \`yt-dlp\` and \`ffmpeg\`.
- **Live IPTV & M3U Playlists:** Integrated IPTV player with category filtering, search, and Electronic Program Guide (EPG).

---

## 2. Installing MovieBox-TUI

### Windows (Recommended via Scoop)
\`\`\`powershell
# Add the MovieBox Scoop bucket
scoop bucket add moviebox https://github.com/mesamirh/MovieBox-Tui

# Install the application
scoop install moviebox-tui
\`\`\`

### Windows / Linux (via Cargo / Rust)
\`\`\`bash
cargo install --git https://github.com/mesamirh/MovieBox-Tui
\`\`\`

### macOS & Linux (via Homebrew)
\`\`\`bash
brew tap mesamirh/moviebox-tui https://github.com/mesamirh/MovieBox-Tui
brew install moviebox-tui
\`\`\`

### Linux / macOS (One-Line Automated Script)
\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/mesamirh/MovieBox-Tui/main/install.sh | bash
\`\`\`

### Arch Linux (via AUR)
\`\`\`bash
yay -S moviebox-tui
\`\`\`

---

## 3. Configuring VLC Media Player as the Default Player

MovieBox-TUI requires a local media player engine to render video streams. While **mpv** is lightweight, **VLC Media Player** offers the widest codec compatibility.

1. Install VLC from [videolan.org](https://www.videolan.org/vlc/) or via winget:
   \`\`\`powershell
   winget install VideoLAN.VLC
   \`\`\`
2. Verify VLC is accessible in your PATH, or launch MovieBox-TUI and open the settings dialog (\`/settings\` or press \`S\`).
3. Set **Default Video Player** to \`vlc\`.
4. Now, selecting any movie, anime, or series episode will automatically launch VLC in borderless or fullscreen mode with synced subtitles!

---

## 4. Streaming 8,000+ Legal Live TV Channels with VLC & IPTV-Org

**[IPTV-Org](https://github.com/iptv-org/iptv)** is a community project indexing publicly available, legal broadcast streams from television networks across the globe (news, sports, nature, public access, and regional stations).

### Method A: Direct Streaming in VLC
1. Open VLC Media Player.
2. Click **Media** (top menu) ➔ **Open Network Stream...** (Shortcut: \`Ctrl + N\` on Windows/Linux, \`Cmd + N\` on Mac).
3. Paste one of the official verified IPTV-Org playlist URLs:
   - **Global Master Playlist:** \`https://iptv-org.github.io/iptv/index.m3u\`
   - **English Language Channels:** \`https://iptv-org.github.io/iptv/languages/eng.m3u\`
   - **News Channels Only:** \`https://iptv-org.github.io/iptv/categories/news.m3u\`
   - **Sports Channels Only:** \`https://iptv-org.github.io/iptv/categories/sports.m3u\`
4. Click **Play**.
5. Press \`Ctrl + L\` (or \`Cmd + L\` on Mac) to view the channel playlist drawer. Double-click any channel to start streaming instantly.

### Method B: Streaming IPTV inside MovieBox-TUI
1. Launch MovieBox-TUI:
   \`\`\`bash
   moviebox-tui
   \`\`\`
2. Navigate to the **Live TV / IPTV** tab using the arrow keys or Vim keys (\`h\`, \`j\`, \`k\`, \`l\`).
3. Press \`A\` to add a custom M3U source and enter:
   \`https://iptv-org.github.io/iptv/index.m3u\`
4. Search or filter by country or category and hit \`Enter\` to launch your selected channel directly in VLC!

---

## 5. Troubleshooting Common Issues

- **Stream Buffering or Freezing:** Free public broadcast streams rely on host server bandwidth. If a stream freezes, switch to a regional mirror or check another channel in the playlist.
- **Playlist Lag in VLC:** The master \`index.m3u\` contains over 8,000 entries and may take a few seconds to parse. For faster performance, use language or category-specific M3U links.
- **Font / Icon Glitches:** MovieBox-TUI looks best with a Nerd Font (such as JetBrains Mono Nerd Font or FiraCode Nerd Font) installed in your terminal emulator.
`,
    troubleshooting_notes: "If VLC fails to launch from MovieBox-TUI, confirm `vlc` is in your system PATH or specify the full path to `vlc.exe` in the configuration file `~/.config/moviebox/config.toml`.",
    security_warnings: "Only use verified public broadcast playlists from trusted repositories like iptv-org/iptv. Never download suspicious third-party playlist executables or untrusted player binaries.",
    official_docs_url: "https://github.com/mesamirh/MovieBox-Tui",
    last_verified_date: "2026-10-30",
    is_published: true,
    featured: true,
    created_at: now,
    updated_at: now,
  },
];
