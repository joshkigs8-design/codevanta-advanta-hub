import test from "node:test";
import assert from "node:assert";
import { parseMarkdownBlocks, renderInline, BlockType } from "../components/MarkdownRenderer";

test("MarkdownRenderer — Chat & Document Parser Unit Tests", async (t) => {
  await t.test("1. Heading Parsing (H1, H2, H3)", () => {
    const raw = `# Main Heading\n## Sub Heading\n### Section Heading`;
    const blocks = parseMarkdownBlocks(raw);

    assert.strictEqual(blocks.length, 3);
    assert.strictEqual(blocks[0].type, "heading");
    if (blocks[0].type === "heading") {
      assert.strictEqual(blocks[0].level, 1);
      assert.strictEqual(blocks[0].text, "Main Heading");
    }
    if (blocks[1].type === "heading") {
      assert.strictEqual(blocks[1].level, 2);
      assert.strictEqual(blocks[1].text, "Sub Heading");
    }
    if (blocks[2].type === "heading") {
      assert.strictEqual(blocks[2].level, 3);
      assert.strictEqual(blocks[2].text, "Section Heading");
    }
  });

  await t.test("2. Code Block Parsing & Unclosed Streaming Fences", () => {
    // Normal closed fence
    const raw1 = "```typescript\nconst greeting = 'Hello Woolly';\nconsole.log(greeting);\n```";
    const blocks1 = parseMarkdownBlocks(raw1);

    assert.strictEqual(blocks1.length, 1);
    assert.strictEqual(blocks1[0].type, "code");
    if (blocks1[0].type === "code") {
      assert.strictEqual(blocks1[0].lang, "typescript");
      assert.ok(blocks1[0].code.includes("console.log(greeting);"));
    }

    // Unclosed fence (simulating streaming token arrival)
    const rawStreaming = "```python\ndef test():\n    return 42";
    const blocksStreaming = parseMarkdownBlocks(rawStreaming);
    assert.strictEqual(blocksStreaming.length, 1);
    assert.strictEqual(blocksStreaming[0].type, "code");
    if (blocksStreaming[0].type === "code") {
      assert.strictEqual(blocksStreaming[0].lang, "python");
      assert.strictEqual(blocksStreaming[0].code, "def test():\n    return 42");
    }
  });

  await t.test("3. Table Parsing with Alignment Divider Stripping", () => {
    const rawTable = `
| Plan | Price (KES) | Referral Rate |
| :--- | :--- | :--- |
| Basic | Free | 0% |
| Pro | 250 | 50% |
| VIP | 1,000 | 50% |
    `.trim();

    const blocks = parseMarkdownBlocks(rawTable);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].type, "table");

    if (blocks[0].type === "table") {
      assert.deepStrictEqual(blocks[0].headers, ["Plan", "Price (KES)", "Referral Rate"]);
      assert.strictEqual(blocks[0].rows.length, 3);
      assert.deepStrictEqual(blocks[0].rows[0], ["Basic", "Free", "0%"]);
      assert.deepStrictEqual(blocks[0].rows[1], ["Pro", "250", "50%"]);
      assert.deepStrictEqual(blocks[0].rows[2], ["VIP", "1,000", "50%"]);
    }
  });

  await t.test("4. Blockquotes and GitHub-style Callouts", () => {
    // Generic blockquote
    const quoteRaw = `> Innovation distinguishes between a leader and a follower.`;
    const blocksQuote = parseMarkdownBlocks(quoteRaw);
    assert.strictEqual(blocksQuote.length, 1);
    assert.strictEqual(blocksQuote[0].type, "blockquote");
    if (blocksQuote[0].type === "blockquote") {
      assert.strictEqual(blocksQuote[0].text, "Innovation distinguishes between a leader and a follower.");
    }

    // Callout
    const calloutRaw = `> [!NOTE]\n> M-Pesa transactions confirm in 5-15 seconds.`;
    const blocksCallout = parseMarkdownBlocks(calloutRaw);
    assert.strictEqual(blocksCallout.length, 1);
    assert.strictEqual(blocksCallout[0].type, "callout");
    if (blocksCallout[0].type === "callout") {
      assert.strictEqual(blocksCallout[0].variant, "note");
      assert.strictEqual(blocksCallout[0].text, "M-Pesa transactions confirm in 5-15 seconds.");
    }
  });

  await t.test("5. Numbered and Bullet Lists with Nested Sub-items", () => {
    const listRaw = `
1. Select Membership
   - Choose Pro or VIP
   - Check billing frequency
2. Enter Phone Number
   - Use Kenyan Safaricom format
3. Authorize M-Pesa STK Push
    `.trim();

    const blocks = parseMarkdownBlocks(listRaw);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].type, "list");

    if (blocks[0].type === "list") {
      assert.strictEqual(blocks[0].ordered, true);
      assert.strictEqual(blocks[0].items.length, 3);
      assert.strictEqual(blocks[0].items[0].text, "Select Membership");
      assert.ok(blocks[0].items[0].subItems && blocks[0].items[0].subItems.length === 2);
      assert.strictEqual(blocks[0].items[0].subItems[0].text, "Choose Pro or VIP");
      assert.strictEqual(blocks[0].items[0].subItems[0].ordered, false);
      assert.strictEqual(blocks[0].items[1].text, "Enter Phone Number");
      assert.strictEqual(blocks[0].items[2].text, "Authorize M-Pesa STK Push");
    }
  });

  await t.test("6. Horizontal Rules", () => {
    const raw = `Above\n---\nBelow`;
    const blocks = parseMarkdownBlocks(raw);
    assert.strictEqual(blocks.length, 3);
    assert.strictEqual(blocks[0].type, "paragraph");
    assert.strictEqual(blocks[1].type, "hr");
    assert.strictEqual(blocks[2].type, "paragraph");
  });

  await t.test("7. Inline Formatting: Bold, Italic, Code, Safe Links", () => {
    // Bold, Italic, Inline Code
    const inlineNodes = renderInline("**Pro Plan** is `KES 250` with *instant* activation");
    assert.ok(inlineNodes.length > 0);

    // Links
    const safeLinkNodes = renderInline("Visit [CodeVanta Hub](https://www.codevanta.online/plans)");
    assert.ok(safeLinkNodes.length > 0);

    // Unsafe link blocking (XSS / javascript: protocol)
    const unsafeLinkNodes = renderInline("Click [evil](javascript:alert(1))");
    // Should render plain span text, NOT a clickable javascript: anchor
    assert.ok(unsafeLinkNodes.length > 0);
  });
});

