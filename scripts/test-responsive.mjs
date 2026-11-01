import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PORT = 3008;
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const VIEWPORTS = [
  { name: "Small phone (portrait)", width: 320, height: 640, isMobile: true },
  { name: "Standard phone (portrait)", width: 375, height: 812, isMobile: true },
  { name: "Large phone (portrait)", width: 430, height: 932, isMobile: true },
  { name: "Small tablet (portrait)", width: 768, height: 1024, isMobile: true },
  { name: "Small tablet (landscape)", width: 1024, height: 768, isMobile: false },
  { name: "Large tablet (portrait)", width: 1024, height: 1366, isMobile: true },
  { name: "Large tablet (landscape)", width: 1366, height: 1024, isMobile: false },
  { name: "Laptop", width: 1366, height: 768, isMobile: false },
  { name: "Desktop", width: 1920, height: 1080, isMobile: false },
];

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function waitForSelector(cdp, selector, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const res = await cdp.send("Runtime.evaluate", {
      expression: `!!document.querySelector('${selector}')`,
      returnByValue: true,
    });
    if (res.result?.value) return true;
    await sleep(250);
  }
  return false;
}

async function run() {
  console.log("=== CodeVanta Advanta Hub Responsive & Device Viewport Verification ===");

  // 1. Start Next.js production server
  console.log(`Starting Next.js on port ${PORT}...`);
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    shell: true,
    stdio: "pipe",
    env: { ...process.env, PORT: String(PORT) },
  });

  // Wait for server to be responsive
  let serverReady = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}`);
      if (res.ok) {
        serverReady = true;
        break;
      }
    } catch {
      await sleep(1000);
    }
  }

  if (!serverReady) {
    console.error("Failed to start server in time.");
    server.kill();
    process.exit(1);
  }

  console.log("Next.js server is ready!");

  // 2. Launch Edge in headless mode with remote debugging
  const userDataDir = path.join(process.cwd(), ".edge-test-profile");
  console.log("Launching Microsoft Edge in headless mode...");
  const edge = spawn(
    EDGE_PATH,
    [
      "--headless=new",
      "--remote-debugging-port=9228",
      `--user-data-dir=${userDataDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--disable-extensions",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  // Wait for remote debugging endpoint
  let pageWsUrl = null;
  for (let attempt = 0; attempt < 25; attempt++) {
    try {
      const versionRes = await fetch("http://127.0.0.1:9228/json");
      const list = await versionRes.json();
      if (Array.isArray(list) && list.length > 0 && list[0].webSocketDebuggerUrl) {
        pageWsUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch {
      await sleep(500);
    }
  }

  if (!pageWsUrl) {
    console.error("Could not obtain Edge CDP debugger URL.");
    edge.kill();
    server.kill();
    process.exit(1);
  }

  console.log(`Connected to Edge CDP target: ${pageWsUrl}`);
  const cdp = new CDPClient(pageWsUrl);
  await cdp.connect();

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("DOM.enable");

  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Testing Device Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);

    // Override device metrics
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.isMobile,
    });

    // Navigate to homepage
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
    await waitForSelector(cdp, "footer", 10000);
    await sleep(800);

    // 1. Check page-level horizontal overflow
    const overflowCheck = await cdp.send("Runtime.evaluate", {
      expression: `
        (() => {
          const body = document.body;
          const html = document.documentElement;
          const scrollWidth = Math.max(body.scrollWidth, html.scrollWidth);
          const clientWidth = window.innerWidth;
          return {
            scrollWidth,
            clientWidth,
            hasHorizontalOverflow: scrollWidth > clientWidth,
            overflowDiff: scrollWidth - clientWidth
          };
        })()
      `,
      returnByValue: true,
    });

    const pageOverflow = overflowCheck.result?.value;
    console.log(`Horizontal page overflow: ${pageOverflow?.hasHorizontalOverflow ? "YES (" + pageOverflow?.overflowDiff + "px)" : "NO (0px - Perfect)"}`);

    // 2. Open Chatbot
    const hasToggle = await waitForSelector(cdp, 'button[aria-label="Open Woolly chat"], button[aria-label="Chat with Woolly"]', 8000);
    if (hasToggle) {
      await cdp.send("Runtime.evaluate", {
        expression: `
          (() => {
            const btn = document.querySelector('button[aria-label="Open Woolly chat"]') ||
                        document.querySelector('button[aria-label="Chat with Woolly"]');
            if (btn) btn.click();
          })()
        `,
      });
    }

    await waitForSelector(cdp, 'section[aria-label="CodeVanta assistant"]', 8000);
    await sleep(600);

    // 3. Inspect Chatbot geometry & accessibility
    const chatMetrics = await cdp.send("Runtime.evaluate", {
      expression: `
        (() => {
          const section = document.querySelector('section[aria-label="CodeVanta assistant"]');
          const input = document.querySelector('input[aria-label="Message Woolly"]');
          const sendBtn = document.querySelector('button[aria-label="Send message"]');
          const closeBtn = document.querySelector('button[aria-label="Close chat"]');

          if (!section) return { error: "Chat modal not found" };

          const sRect = section.getBoundingClientRect();
          const inRect = input ? input.getBoundingClientRect() : null;
          const sendRect = sendBtn ? sendBtn.getBoundingClientRect() : null;

          return {
            chatWidth: Math.round(sRect.width),
            chatHeight: Math.round(sRect.height),
            chatTop: Math.round(sRect.top),
            chatLeft: Math.round(sRect.left),
            chatRight: Math.round(sRect.right),
            chatBottom: Math.round(sRect.bottom),
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            isFullyWithinScreen: sRect.left >= 0 && sRect.right <= window.innerWidth && sRect.bottom <= window.innerHeight + 1,
            hasInput: !!input,
            inputVisible: inRect && inRect.top < window.innerHeight && inRect.bottom <= window.innerHeight + 10,
            hasSendBtn: !!sendBtn,
            sendBtnWidth: sendRect ? Math.round(sendRect.width) : 0,
            sendBtnHeight: sendRect ? Math.round(sendRect.height) : 0,
            hasCloseBtn: !!closeBtn
          };
        })()
      `,
      returnByValue: true,
    });

    const chatData = chatMetrics.result?.value;
    console.log(`Chat size: ${chatData?.chatWidth}px x ${chatData?.chatHeight}px`);
    console.log(`Chat within screen bounds: ${chatData?.isFullyWithinScreen ? "YES (OK)" : "NO"}`);
    console.log(`Input accessible & visible: ${chatData?.inputVisible ? "YES (OK)" : "NO"}`);
    console.log(`Send button touch target: ${chatData?.sendBtnWidth}x${chatData?.sendBtnHeight}px (Accessible >= 36px)`);

    // 4. Click the Referral prompt chip inside the chat
    await cdp.send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const refBtn = btns.find(b => b.textContent && b.textContent.includes('Referrals'));
          if (refBtn) {
            refBtn.click();
            return true;
          }
          return false;
        })()
      `,
    });
    await sleep(2500);

    // 5. Inspect response table and code block inside the chat bubble
    const markdownMetrics = await cdp.send("Runtime.evaluate", {
      expression: `
        (() => {
          const chatModal = document.querySelector('section[aria-label="CodeVanta assistant"]');
          if (!chatModal) return null;

          const tables = chatModal.querySelectorAll('table');
          const tableWrappers = chatModal.querySelectorAll('.overflow-x-auto');
          const preBlocks = chatModal.querySelectorAll('pre');
          const copyButtons = chatModal.querySelectorAll('button[aria-label="Copy assistant response"], button[aria-label="Copy code snippet"]');

          return {
            tableCount: tables.length,
            tableWrapperCount: tableWrappers.length,
            preCount: preBlocks.length,
            copyButtonsCount: copyButtons.length,
            modalScrollWidth: chatModal.scrollWidth,
            modalClientWidth: chatModal.clientWidth,
            modalHasOverflow: chatModal.scrollWidth > chatModal.clientWidth
          };
        })()
      `,
      returnByValue: true,
    });

    const mdData = markdownMetrics.result?.value;
    console.log(`Chat modal scrollWidth vs clientWidth: ${mdData?.modalScrollWidth}px vs ${mdData?.modalClientWidth}px`);
    console.log(`Modal horizontal overflow: ${mdData?.modalHasOverflow ? "YES (FAIL)" : "NO (Clean layout)"}`);
    console.log(`Rendered tables: ${mdData?.tableCount}, Table scroll wrappers: ${mdData?.tableWrapperCount}, Copy buttons: ${mdData?.copyButtonsCount}`);

    // 6. Test Navigation to /referrals page
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${PORT}/referrals` });
    await waitForSelector(cdp, "footer", 10000);
    await sleep(800);

    const refPageCheck = await cdp.send("Runtime.evaluate", {
      expression: `
        (() => {
          const body = document.body;
          const html = document.documentElement;
          const scrollWidth = Math.max(body.scrollWidth, html.scrollWidth);
          const clientWidth = window.innerWidth;
          const heading = document.querySelector('h1')?.textContent || '';
          return {
            scrollWidth,
            clientWidth,
            hasHorizontalOverflow: scrollWidth > clientWidth,
            heading
          };
        })()
      `,
      returnByValue: true,
    });

    const refData = refPageCheck.result?.value;
    console.log(`/referrals page overflow: ${refData?.hasHorizontalOverflow ? "YES" : "NO (0px - Perfect)"}`);
    console.log(`/referrals heading: "${refData?.heading?.trim()?.replace(/\\s+/g, " ")}"`);

    results.push({
      viewport: vp,
      pageOverflow: !!pageOverflow?.hasHorizontalOverflow,
      chatWithinBounds: !!chatData?.isFullyWithinScreen,
      inputVisible: !!chatData?.inputVisible,
      modalOverflow: !!mdData?.modalHasOverflow,
      referralsPageOverflow: !!refData?.hasHorizontalOverflow,
    });
  }

  // Cleanup
  cdp.close();
  edge.kill();
  server.kill();

  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {}

  console.log("\n=======================================================");
  console.log("             RESPONSIVE TESTING SUMMARY                ");
  console.log("=======================================================");
  console.table(
    results.map((r) => ({
      Profile: r.viewport.name,
      Dimensions: `${r.viewport.width}x${r.viewport.height}`,
      "Page Overflow": r.pageOverflow ? "FAIL" : "PASS (0px)",
      "Chat Bounds": r.chatWithinBounds ? "PASS" : "FAIL",
      "Input Visible": r.inputVisible ? "PASS" : "FAIL",
      "Modal Layout": r.modalOverflow ? "FAIL" : "PASS",
      "/referrals Overflow": r.referralsPageOverflow ? "FAIL" : "PASS (0px)",
    }))
  );

  const allPassed = results.every(
    (r) =>
      !r.pageOverflow &&
      r.chatWithinBounds &&
      r.inputVisible &&
      !r.modalOverflow &&
      !r.referralsPageOverflow
  );

  if (allPassed) {
    console.log("\n>>> ALL VIEWPORTS PASSED VERIFICATION WITH ZERO OVERFLOW! <<<");
    process.exit(0);
  } else {
    console.error("\n>>> SOME CHECKS FAILED! <<<");
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
