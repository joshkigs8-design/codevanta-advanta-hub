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
  variant?: "document" | "chat";
  className?: string;
}

export default function MarkdownRenderer({
  content,
  variant = "document",
  className = "",
}: MarkdownRendererProps) {
  if (!content) return null;

  const isChat = variant === "chat";
  const blocks = parseMarkdownBlocks(content);

  const containerClasses = isChat
    ? `markdown-chat space-y-2.5 text-xs sm:text-[13px] leading-relaxed text-hub-text-secondary select-text ${className}`
    : `markdown-body space-y-6 text-sm leading-relaxed text-hub-text-secondary ${className}`;

  return (
    <div className={containerClasses}>
      {blocks.map((block, idx) => (
        <React.Fragment key={idx}>{renderBlock(block, idx, isChat)}</React.Fragment>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Block Parser Types
// ---------------------------------------------------------------------------

export interface ListItemData {
  text: string;
  subItems?: {
    ordered: boolean;
    text: string;
  }[];
}

export type BlockType =
  | { type: "heading"; level: number; text: string }
  | { type: "code"; lang: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "callout"; variant: "warning" | "note" | "tip" | "important"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "hr" }
  | { type: "list"; ordered: boolean; items: ListItemData[] }
  | { type: "paragraph"; text: string };

export function parseMarkdownBlocks(raw: string): BlockType[] {
  // Normalize Windows/Mac line endings
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const blocks: BlockType[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. Skip blank lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. Fenced Code Block: ```lang
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim() || "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      // If closing ``` exists, advance past it; if streaming/unclosed, process gracefully
      if (i < lines.length && lines[i].trim().startsWith("```")) {
        i++;
      }
      blocks.push({
        type: "code",
        lang,
        code: codeLines.join("\n"),
      });
      continue;
    }

    // 3. Horizontal Rule: ---, ***, ___
    if (/^(\*\*\*|---|___)$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // 4. Headings: # Heading, ## Heading, ### Heading (Strip literal hashtags)
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

    // 5. GitHub-style Callouts: > [!WARNING], > [!NOTE], etc.
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
        calloutLines.push(lines[i].replace(/^>\s?/, ""));
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
        type: "blockquote",
        text: quoteLines.join("\n").trim(),
      });
      continue;
    }

    // 7. Markdown Table: lines containing pipes |
    if (trimmed.startsWith("|") && (trimmed.endsWith("|") || trimmed.includes("|"))) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const parseRow = (rowLine: string) =>
          rowLine
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((c) => c.trim());

        const headers = parseRow(tableLines[0]);
        // Filter out markdown alignment divider row (|:---|:---|)
        const contentRows = tableLines.slice(1).filter((r) => !/^[\|\s:\-]+$/.test(r));
        const dataRows = contentRows.map(parseRow);

        blocks.push({
          type: "table",
          headers,
          rows: dataRows,
        });
        continue;
      } else if (tableLines.length === 1) {
        // Fallback for partial table line or single line
        blocks.push({
          type: "paragraph",
          text: tableLines[0],
        });
        continue;
      }
    }

    // 8. Ordered Lists (e.g. "1. ", "1) ") with nested sub-items
    if (/^\d+[\.\)]\s+/.test(trimmed)) {
      const items: ListItemData[] = [];
      while (i < lines.length) {
        const curRaw = lines[i];
        const curTrim = curRaw.trim();
        if (!curTrim) {
          if (i + 1 < lines.length && (/^\s*\d+[\.\)]\s+/.test(lines[i + 1]) || /^\s{2,}/.test(lines[i + 1]))) {
            i++;
            continue;
          }
          break;
        }

        // Top-level numbered item
        if (/^\d+[\.\)]\s+/.test(curTrim) && !/^\s{2,}/.test(curRaw)) {
          items.push({
            text: curTrim.replace(/^\d+[\.\)]\s+/, ""),
            subItems: [],
          });
          i++;
        } else if (/^\s{2,}/.test(curRaw) && items.length > 0) {
          // Indented line (sub-item or continuation)
          const lastItem = items[items.length - 1];
          if (/^[-*•·]\s+/.test(curTrim)) {
            lastItem.subItems = lastItem.subItems || [];
            lastItem.subItems.push({
              ordered: false,
              text: curTrim.replace(/^[-*•·]\s+/, ""),
            });
          } else if (/^\d+[\.\)]\s+/.test(curTrim)) {
            lastItem.subItems = lastItem.subItems || [];
            lastItem.subItems.push({
              ordered: true,
              text: curTrim.replace(/^\d+[\.\)]\s+/, ""),
            });
          } else {
            lastItem.text += " " + curTrim;
          }
          i++;
        } else {
          break;
        }
      }
      blocks.push({
        type: "list",
        ordered: true,
        items,
      });
      continue;
    }

    // 9. Unordered Lists (e.g. "- ", "* ", "• ", "· ") with nested sub-items
    if (/^[-*•·]\s+/.test(trimmed)) {
      const items: ListItemData[] = [];
      while (i < lines.length) {
        const curRaw = lines[i];
        const curTrim = curRaw.trim();
        if (!curTrim) {
          if (i + 1 < lines.length && (/^\s*[-*•·]\s+/.test(lines[i + 1]) || /^\s{2,}/.test(lines[i + 1]))) {
            i++;
            continue;
          }
          break;
        }

        // Top-level bullet item (no or minimal indentation)
        if (/^[-*•·]\s+/.test(curTrim) && !/^\s{2,}/.test(curRaw)) {
          items.push({
            text: curTrim.replace(/^[-*•·]\s+/, ""),
            subItems: [],
          });
          i++;
        } else if (/^\s{2,}/.test(curRaw) && items.length > 0) {
          // Indented line (sub-item or continuation)
          const lastItem = items[items.length - 1];
          if (/^[-*•·]\s+/.test(curTrim)) {
            lastItem.subItems = lastItem.subItems || [];
            lastItem.subItems.push({
              ordered: false,
              text: curTrim.replace(/^[-*•·]\s+/, ""),
            });
          } else if (/^\d+[\.\)]\s+/.test(curTrim)) {
            lastItem.subItems = lastItem.subItems || [];
            lastItem.subItems.push({
              ordered: true,
              text: curTrim.replace(/^\d+[\.\)]\s+/, ""),
            });
          } else {
            lastItem.text += " " + curTrim;
          }
          i++;
        } else {
          break;
        }
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
      !/^[-*•·]\s+/.test(lines[i].trim()) &&
      !/^\d+[\.\)]\s+/.test(lines[i].trim()) &&
      !/^(\*\*\*|---|___)$/.test(lines[i].trim())
    ) {
      pLines.push(lines[i].trim());
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

function renderBlock(block: BlockType, key: number, isChat: boolean) {
  switch (block.type) {
    case "heading": {
      const id = block.text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      if (isChat) {
        // Scaled and tuned heading styles for chat window
        if (block.level === 1) {
          return (
            <h3
              key={key}
              id={id}
              className="text-sm font-black text-white tracking-tight border-b border-white/10 pb-1.5 mt-3 mb-1.5 first:mt-0 font-sans"
            >
              {renderInline(block.text, isChat)}
            </h3>
          );
        }
        if (block.level === 2) {
          return (
            <h4
              key={key}
              id={id}
              className="text-xs font-bold text-hub-gold tracking-tight flex items-center gap-1.5 mt-2.5 mb-1 font-sans"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-hub-gold inline-block" />
              <span>{renderInline(block.text, isChat)}</span>
            </h4>
          );
        }
        return (
          <h5
            key={key}
            id={id}
            className="text-xs font-semibold text-white tracking-tight mt-2 mb-0.5 font-sans"
          >
            {renderInline(block.text, isChat)}
          </h5>
        );
      }

      // Document view (Tutorials / Guides detail pages)
      if (block.level === 1) {
        return (
          <h1
            key={key}
            id={id}
            className="text-2xl sm:text-3xl font-black text-white tracking-tight border-b border-white/10 pb-3 mt-8 mb-4 first:mt-0 font-sans"
          >
            {renderInline(block.text, isChat)}
          </h1>
        );
      }
      if (block.level === 2) {
        return (
          <h2
            key={key}
            id={id}
            className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-8 mb-3 border-l-4 border-hub-gold pl-3 font-sans"
          >
            {renderInline(block.text, isChat)}
          </h2>
        );
      }
      if (block.level === 3) {
        return (
          <h3
            key={key}
            id={id}
            className="text-base sm:text-lg font-bold text-hub-gold tracking-tight mt-6 mb-2 font-sans"
          >
            {renderInline(block.text, isChat)}
          </h3>
        );
      }
      return (
        <h4 key={key} id={id} className="text-sm font-bold text-white mt-4 mb-2 font-sans">
          {renderInline(block.text, isChat)}
        </h4>
      );
    }

    case "code":
      return <CodeCard key={key} lang={block.lang} code={block.code} isChat={isChat} />;

    case "table":
      return (
        <div
          key={key}
          className={`overflow-x-auto my-2.5 rounded-xl border border-white/15 bg-black/60 shadow-lg ${
            isChat ? "-mx-1 sm:mx-0 scrollbar-thin max-w-full" : "my-6"
          }`}
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.04] border-b border-white/10 text-white font-mono uppercase tracking-wider">
                {block.headers.map((h, hIdx) => (
                  <th
                    key={hIdx}
                    className={`font-bold text-hub-gold whitespace-nowrap ${
                      isChat ? "px-3 py-2 text-[10px]" : "px-4 py-3 text-[11px]"
                    }`}
                  >
                    {renderInline(h, isChat)}
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
                    <td
                      key={cIdx}
                      className={`text-white/90 align-top leading-relaxed ${
                        isChat ? "px-3 py-2 text-[11px]" : "px-4 py-3 text-xs sm:text-sm"
                      }`}
                    >
                      {renderInline(cell, isChat)}
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
      let icon = <Sparkles className="w-3.5 h-3.5 shrink-0 text-hub-gold" />;
      let title = "Tip";

      if (block.variant === "warning") {
        borderClass = "border-rose-600/50 bg-rose-950/40 text-rose-300";
        icon = <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />;
        title = "Important Warning";
      } else if (block.variant === "important") {
        borderClass = "border-amber-600/50 bg-amber-950/40 text-amber-300";
        icon = <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />;
        title = "Essential Note";
      } else if (block.variant === "note") {
        borderClass = "border-emerald-600/50 bg-emerald-950/30 text-emerald-300";
        icon = <Info className="w-3.5 h-3.5 shrink-0 text-emerald-400" />;
        title = "Note";
      }

      return (
        <div
          key={key}
          className={`rounded-xl border ${borderClass} space-y-1 ${
            isChat ? "p-2.5 my-2 text-xs" : "p-4 my-4"
          }`}
        >
          <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-xs uppercase tracking-wider font-bold">
            {icon}
            <span>{title}</span>
          </div>
          <div className="text-white/90 leading-relaxed pl-5 whitespace-pre-line text-xs sm:text-[13px]">
            {renderInline(block.text, isChat)}
          </div>
        </div>
      );
    }

    case "blockquote":
      return (
        <blockquote
          key={key}
          className={`border-l-2 sm:border-l-4 border-hub-gold/70 bg-white/[0.02] pl-3 py-1.5 rounded-r my-2 text-hub-text-secondary italic ${
            isChat ? "text-xs" : "text-sm sm:text-base my-4"
          }`}
        >
          {renderInline(block.text, isChat)}
        </blockquote>
      );

    case "hr":
      return <hr key={key} className={`border-t border-white/10 ${isChat ? "my-2.5" : "my-8"}`} />;

    case "list":
      if (block.ordered) {
        return (
          <ol
            key={key}
            className={`list-decimal list-outside pl-4 text-white/90 ${
              isChat ? "space-y-1 my-1.5 text-xs sm:text-[13px]" : "space-y-2 my-4"
            }`}
          >
            {block.items.map((item, iIdx) => (
              <li key={iIdx} className="leading-relaxed pl-1">
                <div>{renderInline(item.text, isChat)}</div>
                {item.subItems && item.subItems.length > 0 && (
                  item.subItems[0].ordered ? (
                    <ol className={`list-decimal list-outside pl-4 mt-1 ${isChat ? "space-y-0.5 text-xs" : "space-y-1"}`}>
                      {item.subItems.map((sub, sIdx) => (
                        <li key={sIdx} className="pl-1">
                          {renderInline(sub.text, isChat)}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <ul className={`list-disc list-outside pl-4 mt-1 ${isChat ? "space-y-0.5 text-xs" : "space-y-1"}`}>
                      {item.subItems.map((sub, sIdx) => (
                        <li key={sIdx} className="pl-1">
                          {renderInline(sub.text, isChat)}
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul
          key={key}
          className={`list-disc list-outside pl-4 text-white/90 ${
            isChat ? "space-y-1 my-1.5 text-xs sm:text-[13px]" : "space-y-2 my-4"
          }`}
        >
          {block.items.map((item, iIdx) => (
            <li key={iIdx} className="leading-relaxed pl-1">
              <div>{renderInline(item.text, isChat)}</div>
              {item.subItems && item.subItems.length > 0 && (
                item.subItems[0].ordered ? (
                  <ol className={`list-decimal list-outside pl-4 mt-1 ${isChat ? "space-y-0.5 text-xs" : "space-y-1"}`}>
                    {item.subItems.map((sub, sIdx) => (
                      <li key={sIdx} className="pl-1">
                        {renderInline(sub.text, isChat)}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <ul className={`list-disc list-outside pl-4 mt-1 ${isChat ? "space-y-0.5 text-xs" : "space-y-1"}`}>
                    {item.subItems.map((sub, sIdx) => (
                      <li key={sIdx} className="pl-1">
                        {renderInline(sub.text, isChat)}
                      </li>
                    ))}
                  </ul>
                )
              )}
            </li>
          ))}
        </ul>
      );

    case "paragraph":
      return (
        <p
          key={key}
          className={`text-white/90 leading-relaxed ${
            isChat ? "my-1.5 text-xs sm:text-[13px]" : "my-3 text-sm text-white/85"
          }`}
        >
          {renderInline(block.text, isChat)}
        </p>
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Security Helper: Safe Link Protocol Validation
// ---------------------------------------------------------------------------

function isSafeUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  if (
    clean.startsWith("https://") ||
    clean.startsWith("http://") ||
    clean.startsWith("mailto:") ||
    clean.startsWith("tel:") ||
    clean.startsWith("/") ||
    clean.startsWith("#")
  ) {
    // Block script injection schemes
    if (clean.includes("javascript:") || clean.includes("data:") || clean.includes("vbscript:")) {
      return false;
    }
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Inline Formatter (Bold, Italic, Bold+Italic, Inline Code, Safe Links, <br>)
// ---------------------------------------------------------------------------

export function renderInline(text: string, isChat: boolean = false): React.ReactNode[] {
  if (!text) return [];

  // Match token patterns in precedence order:
  // 1. Inline code: `...`
  // 2. Bold+Italic: ***...*** or ___...___
  // 3. Bold: **...** or __...__
  // 4. Italic: *...* or _..._
  // 5. Links: [...](...)
  // 6. Line break tag: <br> or <br/>
  // 7. Plain autolinks: https://...
  const tokenRegex = /(`[^`]+`|\*\*\*[^*]+\*\*\*|___[^_]+___|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|(?<!\w)_[^_]+_(?!\w)|\[[^\]]+\]\([^)]+\)|<br\s*\/?>|https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;

  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // 1. Inline code: `code`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono font-medium bg-black/70 text-emerald-300 border border-white/10 selection:bg-hub-gold/30"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // 2. Bold + Italic: ***text*** or ___text___
    if (
      (part.startsWith("***") && part.endsWith("***") && part.length >= 6) ||
      (part.startsWith("___") && part.endsWith("___") && part.length >= 6)
    ) {
      return (
        <strong key={idx} className="font-extrabold italic text-white">
          {renderInline(part.slice(3, -3), isChat)}
        </strong>
      );
    }

    // 3. Bold: **text** or __text__
    if (
      (part.startsWith("**") && part.endsWith("**") && part.length >= 4) ||
      (part.startsWith("__") && part.endsWith("__") && part.length >= 4)
    ) {
      return (
        <strong key={idx} className="font-bold text-white">
          {renderInline(part.slice(2, -2), isChat)}
        </strong>
      );
    }

    // 4. Italic: *text* or _text_
    if (
      (part.startsWith("*") && part.endsWith("*") && part.length >= 2) ||
      (part.startsWith("_") && part.endsWith("_") && part.length >= 2)
    ) {
      return (
        <em key={idx} className="italic text-white/95">
          {renderInline(part.slice(1, -1), isChat)}
        </em>
      );
    }

    // 5. Links: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const linkUrl = linkMatch[2].trim();
      const isSafe = isSafeUrl(linkUrl);

      if (!isSafe) {
        return <span key={idx}>{linkText}</span>;
      }

      const isExternal = linkUrl.startsWith("http://") || linkUrl.startsWith("https://");

      return (
        <a
          key={idx}
          href={linkUrl}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="text-hub-gold hover:text-white underline underline-offset-2 inline-flex items-center gap-0.5 transition-colors font-medium font-sans"
        >
          <span>{renderInline(linkText, isChat)}</span>
          {isExternal && <ExternalLink className="w-3 h-3 inline ml-0.5 opacity-70 shrink-0" />}
        </a>
      );
    }

    // 6. Line break: <br> or <br/>
    if (/^<br\s*\/?>$/i.test(part)) {
      return <br key={idx} />;
    }

    // 7. Plain URL autolink
    if (/^https?:\/\//.test(part)) {
      const isSafe = isSafeUrl(part);
      if (!isSafe) return <span key={idx}>{part}</span>;
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-hub-gold hover:text-white underline underline-offset-2 inline-flex items-center gap-0.5 transition-colors break-all"
        >
          <span>{part}</span>
          <ExternalLink className="w-3 h-3 inline ml-0.5 opacity-70 shrink-0" />
        </a>
      );
    }

    // Regular text (preserves linebreaks if string contains \n)
    if (part.includes("\n")) {
      const subLines = part.split("\n");
      return (
        <React.Fragment key={idx}>
          {subLines.map((s, sIdx) => (
            <React.Fragment key={sIdx}>
              {s}
              {sIdx < subLines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </React.Fragment>
      );
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

// ---------------------------------------------------------------------------
// Interactive Code Block Card
// ---------------------------------------------------------------------------

function CodeCard({ lang, code, isChat }: { lang: string; code: string; isChat?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("Copy code error:", e);
    }
  };

  return (
    <div
      className={`relative rounded-xl border border-white/15 bg-black/80 shadow-xl overflow-hidden group ${
        isChat ? "my-2 max-w-full" : "my-4"
      }`}
    >
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] text-white/60 uppercase">
          <Terminal className="w-3.5 h-3.5 text-hub-gold shrink-0" />
          <span>{lang || "code"}</span>
        </div>

        <button
          onClick={handleCopy}
          type="button"
          aria-label="Copy code snippet"
          className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-white/70" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre
        className={`font-mono text-emerald-300/95 overflow-x-auto leading-relaxed selection:bg-hub-gold/30 scrollbar-thin ${
          isChat ? "p-3 text-[11px]" : "p-4 text-xs"
        }`}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
