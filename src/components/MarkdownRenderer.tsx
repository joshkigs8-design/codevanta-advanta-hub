"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  AlertTriangle,
  Info,
  Sparkles,
  AlertCircle,
  Terminal,
  ExternalLink,
} from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Split content into blocks: code blocks, tables, callout alerts, headers, lists, paragraphs
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="markdown-body space-y-6 text-sm leading-relaxed text-hub-text-secondary">
      {blocks.map((block, idx) => (
        <React.Fragment key={idx}>{renderBlock(block, idx)}</React.Fragment>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Block Parser
// ---------------------------------------------------------------------------

type BlockType =
  | { type: "heading"; level: number; text: string }
  | { type: "code"; lang: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "callout"; variant: "warning" | "note" | "tip" | "important"; text: string }
  | { type: "hr" }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "paragraph"; text: string };

function parseMarkdownBlocks(raw: string): BlockType[] {
  const lines = raw.split("\n");
  const blocks: BlockType[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Skip completely empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. Fenced Code Block
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim() || "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({
        type: "code",
        lang,
        code: codeLines.join("\n"),
      });
      continue;
    }

    // 3. Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // 4. Headings: #, ##, ###, #### (Strip the hashtags!)
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      blocks.push({
        type: "heading",
        level,
        text,
      });
      i++;
      continue;
    }

    // 5. GitHub-style Callouts: > [!WARNING], > [!NOTE], > [!TIP], > [!IMPORTANT]
    const calloutHeaderMatch = trimmed.match(/^>\s*\[!(WARNING|NOTE|TIP|IMPORTANT|CAUTION)\]/i);
    if (calloutHeaderMatch) {
      const rawVariant = calloutHeaderMatch[1].toUpperCase();
      let variant: "warning" | "note" | "tip" | "important" = "note";
      if (rawVariant === "WARNING" || rawVariant === "CAUTION") variant = "warning";
      else if (rawVariant === "TIP") variant = "tip";
      else if (rawVariant === "IMPORTANT") variant = "important";

      const calloutLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        const textInLine = lines[i].replace(/^>\s?/, "");
        calloutLines.push(textInLine);
        i++;
      }
      blocks.push({
        type: "callout",
        variant,
        text: calloutLines.join("\n").trim(),
      });
      continue;
    }

    // 6. Generic Blockquote: > text
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "callout",
        variant: "note",
        text: quoteLines.join("\n").trim(),
      });
      continue;
    }

    // 7. Markdown Table: lines starting and ending with |
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headers = tableLines[0]
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());
        // row 1 is separator |:---|:---|
        const dataRows = tableLines.slice(2).map((rowLine) =>
          rowLine
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim())
        );
        blocks.push({
          type: "table",
          headers,
          rows: dataRows,
        });
        continue;
      }
    }

    // 8. Ordered Lists (e.g. "1. ", "2. ")
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({
        type: "list",
        ordered: true,
        items,
      });
      continue;
    }

    // 9. Unordered Lists (e.g. "- ", "* ")
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({
        type: "list",
        ordered: false,
        items,
      });
      continue;
    }

    // 10. Standard Paragraph (collect consecutive non-empty lines)
    const pLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("|") &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !/^(\*\*\*|---|___)$/.test(lines[i].trim())
    ) {
      pLines.push(lines[i]);
      i++;
    }
    if (pLines.length > 0) {
      blocks.push({
        type: "paragraph",
        text: pLines.join(" "),
      });
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Render Individual Block Elements
// ---------------------------------------------------------------------------

function renderBlock(block: BlockType, key: number) {
  switch (block.type) {
    case "heading": {
      const id = block.text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      if (block.level === 1) {
        return (
          <h1
            id={id}
            className="text-2xl sm:text-3xl font-black text-white tracking-tight border-b border-white/10 pb-3 mt-8 mb-4 first:mt-0 font-sans"
          >
            {renderInline(block.text)}
          </h1>
        );
      }
      if (block.level === 2) {
        return (
          <h2
            id={id}
            className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-8 mb-3 border-l-4 border-hub-gold pl-3 font-sans"
          >
            {renderInline(block.text)}
          </h2>
        );
      }
      if (block.level === 3) {
        return (
          <h3
            id={id}
            className="text-base sm:text-lg font-bold text-hub-gold tracking-tight mt-6 mb-2 font-sans"
          >
            {renderInline(block.text)}
          </h3>
        );
      }
      return (
        <h4 id={id} className="text-sm font-bold text-white mt-4 mb-2 font-sans">
          {renderInline(block.text)}
        </h4>
      );
    }

    case "code":
      return <CodeCard key={key} lang={block.lang} code={block.code} />;

    case "table":
      return (
        <div key={key} className="overflow-x-auto my-6 rounded-xl border border-white/15 bg-black/50 shadow-lg">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-hub-surface-elevated/80 border-b border-white/10 text-white font-mono text-[11px] uppercase tracking-wider">
                {block.headers.map((h, hIdx) => (
                  <th key={hIdx} className="px-4 py-3 font-bold text-hub-gold">
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {block.rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="hover:bg-white/[0.03] transition-colors odd:bg-transparent even:bg-white/[0.015]"
                >
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-3 text-white/90 align-top">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "callout": {
      let borderClass = "border-hub-gold/50 bg-hub-gold/10 text-hub-gold";
      let icon = <Sparkles className="w-4 h-4 shrink-0 text-hub-gold" />;
      let title = "Tip";

      if (block.variant === "warning") {
        borderClass = "border-rose-600/50 bg-rose-950/40 text-rose-300";
        icon = <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />;
        title = "Important Warning";
      } else if (block.variant === "important") {
        borderClass = "border-amber-600/50 bg-amber-950/40 text-amber-300";
        icon = <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />;
        title = "Essential Note";
      } else if (block.variant === "note") {
        borderClass = "border-emerald-600/50 bg-emerald-950/30 text-emerald-300";
        icon = <Info className="w-4 h-4 shrink-0 text-emerald-400" />;
        title = "Note";
      }

      return (
        <div key={key} className={`p-4 rounded-xl border ${borderClass} space-y-1.5 my-4`}>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold">
            {icon}
            <span>{title}</span>
          </div>
          <div className="text-xs sm:text-sm text-white/90 leading-relaxed pl-6 whitespace-pre-line">
            {renderInline(block.text)}
          </div>
        </div>
      );
    }

    case "hr":
      return <hr key={key} className="border-t border-white/10 my-8" />;

    case "list":
      if (block.ordered) {
        return (
          <ol key={key} className="space-y-2 my-4 list-decimal list-inside pl-2 text-white/90">
            {block.items.map((item, iIdx) => (
              <li key={iIdx} className="leading-relaxed">
                {renderInline(item)}
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul key={key} className="space-y-2 my-4 list-disc list-inside pl-2 text-white/90">
          {block.items.map((item, iIdx) => (
            <li key={iIdx} className="leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );

    case "paragraph":
      return (
        <p key={key} className="my-3 text-sm text-white/85 leading-relaxed">
          {renderInline(block.text)}
        </p>
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Inline Formatter (Bold, Code, Links)
// ---------------------------------------------------------------------------

function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Split by inline code: `code`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, idx) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 rounded text-[12px] font-mono font-medium bg-black/60 text-emerald-300 border border-white/10"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold formatting: **bold**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return (
      <React.Fragment key={idx}>
        {boldParts.map((bPart, bIdx) => {
          if (bPart.startsWith("**") && bPart.endsWith("**") && bPart.length > 4) {
            return (
              <strong key={bIdx} className="font-bold text-white">
                {bPart.slice(2, -2)}
              </strong>
            );
          }

          // Links: [text](url)
          const linkParts = bPart.split(/(\[[^\]]+\]\([^)]+\))/g);
          return (
            <React.Fragment key={bIdx}>
              {linkParts.map((lPart, lIdx) => {
                const linkMatch = lPart.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                if (linkMatch) {
                  const linkText = linkMatch[1];
                  const linkUrl = linkMatch[2];
                  return (
                    <a
                      key={lIdx}
                      href={linkUrl}
                      target={linkUrl.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="text-hub-gold hover:text-white underline inline-flex items-center gap-0.5 transition-colors font-medium"
                    >
                      <span>{linkText}</span>
                      {linkUrl.startsWith("http") && <ExternalLink className="w-3 h-3 inline ml-0.5 opacity-70" />}
                    </a>
                  );
                }
                return lPart;
              })}
            </React.Fragment>
          );
        })}
      </React.Fragment>
    );
  });
}

// ---------------------------------------------------------------------------
// Interactive Code Block Card
// ---------------------------------------------------------------------------

function CodeCard({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl border border-white/15 bg-black/75 shadow-xl overflow-hidden group">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2 font-mono text-[11px] text-white/60 uppercase">
          <Terminal className="w-3.5 h-3.5 text-hub-gold" />
          <span>{lang || "terminal"}</span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed selection:bg-hub-gold/30">
        <code>{code}</code>
      </pre>
    </div>
  );
}

