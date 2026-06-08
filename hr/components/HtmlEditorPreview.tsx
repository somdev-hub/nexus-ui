"use client";

import { useState, useRef, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, Code2, Columns2, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Boilerplate ─────────────────────────────────────────────────────────────
export const BOILERPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: system-ui, sans-serif;
        padding: 2rem;
        color: #1a1a1a;
        line-height: 1.6;
      }
      h1 { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
      p  { color: #555; }
    </style>
  </head>
  <body>
    <h1>Hello, World!</h1>
    <p>Edit the HTML on the <strong>Editor</strong> tab to see changes here.</p>
  </body>
</html>`;

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg: "#0d1117", footerBorder: "#21262d", footerText: "#8b949e",
    lineNums: "#3d4450", code: "#c9d1d9", caret: "#58a6ff",
    tag: "#7ee787", bracket: "#8b949e", attr: "#79c0ff",
    eq: "#8b949e", string: "#a5d6ff", comment: "#8b949e", doctype: "#8b949e",
  },
  light: {
    bg: "#ffffff", footerBorder: "#e2e8f0", footerText: "#64748b",
    lineNums: "#94a3b8", code: "#1e293b", caret: "#2563eb",
    tag: "#16a34a", bracket: "#64748b", attr: "#7c3aed",
    eq: "#64748b", string: "#b45309", comment: "#94a3b8", doctype: "#94a3b8",
  },
} as const;

type ThemeKey = keyof typeof THEMES;

// ─── Syntax highlighting (character-level tokenizer, no regex on tag bodies) ──
// Escape once → tokenize → colour. Quoted attribute values are consumed as a
// single token so they can NEVER be re-processed by another pattern.

function escapeHtml(raw: string): string {
  return raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Colour attribute string: walks char-by-char, handles quoted values safely. */
function colorAttrs(attrs: string): string {
  if (!attrs.trim()) return attrs;
  let out = "";
  let i = 0;
  const len = attrs.length;

  while (i < len) {
    // Whitespace
    if (/\s/.test(attrs[i])) { out += attrs[i++]; continue; }

    // Attribute name
    let name = "";
    while (i < len && attrs[i] !== "=" && !/\s/.test(attrs[i])) name += attrs[i++];
    if (!name) { out += attrs[i++]; continue; }
    out += `<span class="hl-attr">${name}</span>`;

    // Skip whitespace
    while (i < len && /\s/.test(attrs[i])) out += attrs[i++];

    // = sign
    if (i < len && attrs[i] === "=") {
      out += `<span class="hl-eq">=</span>`;
      i++;
      while (i < len && /\s/.test(attrs[i])) out += attrs[i++];

      if (i < len && (attrs[i] === '"' || attrs[i] === "'")) {
        // Quoted value — consume until matching close quote (or end of string)
        const q = attrs[i];
        let val = q; i++;
        while (i < len && attrs[i] !== q) val += attrs[i++];
        if (i < len) val += attrs[i++]; // closing quote (may be absent mid-type)
        out += `<span class="hl-string">${val}</span>`;
      } else if (i < len) {
        // Unquoted value
        let val = "";
        while (i < len && !/\s/.test(attrs[i])) val += attrs[i++];
        out += `<span class="hl-string">${val}</span>`;
      }
    }
  }
  return out;
}

/** Colour a single tag token (already HTML-escaped, including the &lt; / &gt;). */
function colorTag(raw: string): string {
  // Closing tag: &lt;/tag&gt;
  if (raw.startsWith("&lt;/")) {
    const inner = raw.slice(5, raw.endsWith("&gt;") ? raw.length - 4 : undefined);
    return (
      `<span class="hl-bracket">&lt;/</span>` +
      `<span class="hl-tag">${inner.trim()}</span>` +
      (raw.endsWith("&gt;") ? `<span class="hl-bracket">&gt;</span>` : "")
    );
  }

  // Opening / void tag
  const afterLt = raw.slice(4); // strip &lt;
  const nameMatch = afterLt.match(/^[\w-]+/);
  if (!nameMatch) return raw;

  const tagName = nameMatch[0];
  let rest = afterLt.slice(tagName.length);

  // Peel off closing bracket(s)
  let closingBracket = "";
  if (rest.endsWith("&gt;")) { closingBracket = "&gt;"; rest = rest.slice(0, -4); }
  if (rest.endsWith("/")) { closingBracket = "/&gt;"; rest = rest.slice(0, -1); }

  return (
    `<span class="hl-bracket">&lt;</span>` +
    `<span class="hl-tag">${tagName}</span>` +
    colorAttrs(rest) +
    (closingBracket ? `<span class="hl-bracket">${closingBracket}</span>` : "")
  );
}

/**
 * Walk the escaped line character-by-character, pull out tokens, colour each.
 * Quoted strings inside attribute values are consumed as one atomic token so
 * they are NEVER seen by any other pattern — no double-processing possible.
 */
function highlightLine(escaped: string): string {
  let out = "";
  let i = 0;
  const len = escaped.length;

  while (i < len) {
    // Comment
    if (escaped.startsWith("&lt;!--", i)) {
      const end = escaped.indexOf("--&gt;", i);
      if (end !== -1) {
        out += `<span class="hl-comment">${escaped.slice(i, end + 6)}</span>`;
        i = end + 6;
      } else {
        out += `<span class="hl-comment">${escaped.slice(i)}</span>`;
        i = len;
      }
      continue;
    }

    // DOCTYPE (any <! that isn't a comment)
    if (escaped.startsWith("&lt;!", i)) {
      const end = escaped.indexOf("&gt;", i);
      const chunk = end !== -1 ? escaped.slice(i, end + 4) : escaped.slice(i);
      out += `<span class="hl-doctype">${chunk}</span>`;
      i = end !== -1 ? end + 4 : len;
      continue;
    }

    // Tag — walk to matching &gt; respecting quoted attribute values
    if (escaped.startsWith("&lt;", i)) {
      let j = i + 4;
      while (j < len) {
        if (escaped.startsWith("&gt;", j)) { j += 4; break; }
        // Skip over quoted value so inner > doesn't close the tag prematurely
        if (escaped[j] === '"' || escaped[j] === "'") {
          const q = escaped[j++];
          while (j < len && escaped[j] !== q) j++;
          if (j < len) j++; // consume closing quote
        } else {
          j++;
        }
      }
      out += colorTag(escaped.slice(i, j));
      i = j;
      continue;
    }

    // Plain text
    out += escaped[i++];
  }

  return out;
}

function toHighlightedLines(raw: string): string[] {
  return escapeHtml(raw).split("\n").map(highlightLine);
}

// ─── Editor pane ─────────────────────────────────────────────────────────────
// GUTTER_W is the single source of truth for the line-number column width.
// Both the display layer and the textarea use it directly so they are always
// pixel-perfect — no Tailwind class approximation that can drift.
const GUTTER_W = 56; // px  (≈ 3.5rem at 16px base, enough for 4-digit line nums)
const EDITOR_PADDING_TOP = 16;  // px  (py-4 = 1rem = 16px)
const EDITOR_PADDING_RIGHT = 16; // px

function EditorPane({
  html, lines, onKeyDown, onChange, textareaRef, height, theme,
}: {
  html: string;
  lines: string[];
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onChange: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  height: number;
  theme: ThemeKey;
}) {
  const t = THEMES[theme];
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  const monoStyle: React.CSSProperties = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "13px",
    lineHeight: "1.6",
  };

  return (
    <div className="flex flex-col" style={{ background: t.bg }}>
      <div className="relative overflow-hidden" style={{ height }}>

        {/* ── Gutter (line numbers) — sits on the left, never scrolls horizontally ── */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 bottom-0 overflow-hidden select-none"
          style={{ width: GUTTER_W, background: t.bg, zIndex: 1 }}
        >
          <div
            style={{
              ...monoStyle,
              paddingTop: EDITOR_PADDING_TOP,
              paddingRight: 10,
              textAlign: "right",
              color: t.lineNums,
              transform: `translateY(-${scrollTop}px)`,
              willChange: "transform",
            }}
          >
            {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
          </div>
        </div>

        {/* ── Highlighted code display — starts exactly at GUTTER_W ── */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 bottom-0 overflow-hidden"
          style={{ left: GUTTER_W, right: 0 }}
        >
          <pre
            style={{
              ...monoStyle,
              margin: 0,
              padding: `${EDITOR_PADDING_TOP}px ${EDITOR_PADDING_RIGHT}px 0 0`,
              whiteSpace: "pre",
              color: t.code,
              transform: `translate(-${scrollLeft}px, -${scrollTop}px)`,
              willChange: "transform",
            }}
            dangerouslySetInnerHTML={{ __html: lines.join("\n") }}
          />
        </div>

        {/* ── Textarea — positioned so its text origin matches the display pre exactly ── */}
        <textarea
          ref={textareaRef}
          value={html}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onScroll={handleScroll}
          wrap="off"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          style={{
            ...monoStyle,
            position: "absolute",
            top: 0,
            left: GUTTER_W,   // ← same constant, guaranteed alignment
            right: 0,
            bottom: 0,
            padding: `${EDITOR_PADDING_TOP}px ${EDITOR_PADDING_RIGHT}px 0 0`,
            resize: "none",
            background: "transparent",
            color: "transparent",
            caretColor: t.caret,
            whiteSpace: "pre",
            overflowX: "auto",
            overflowY: "auto",
            outline: "none",
            border: "none",
          }}
        />
      </div>

      {/* Footer */}
      <div
        className="flex items-center border-t px-4 py-1.5 font-mono text-[11px]"
        style={{ borderColor: t.footerBorder, color: t.footerText, background: t.bg }}
      >
        <span>HTML</span><span className="mx-2 opacity-30">·</span>
        <span>UTF-8</span><span className="mx-2 opacity-30">·</span>
        <span>{lines.length} lines</span>
      </div>

      <style>{`
        .hl-tag     { color: ${t.tag}; }
        .hl-bracket { color: ${t.bracket}; }
        .hl-attr    { color: ${t.attr}; }
        .hl-eq      { color: ${t.eq}; }
        .hl-string  { color: ${t.string}; }
        .hl-comment { color: ${t.comment}; font-style: italic; }
        .hl-doctype { color: ${t.doctype}; }
      `}</style>
    </div>
  );
}

// ─── Preview pane ─────────────────────────────────────────────────────────────
function PreviewPane({ html, height }: { html: string; height: number }) {
  return (
    <iframe srcDoc={html} title="HTML Preview" sandbox="allow-scripts"
      className="w-full border-0 bg-white" style={{ height }} />
  );
}

// ─── Autocomplete helpers ─────────────────────────────────────────────────────

/** Pairs where typing the opener auto-inserts the closer. */
const PAIRS: Record<string, string> = {
  "(": ")",
  "[": "]",
  "{": "}",
  '"': '"',
  "'": "'",
  "`": "`",
};

/**
 * When the user types `>` after a tag name (e.g. `<div>`), auto-insert `</div>`.
 * Returns the closing tag string or null if not applicable.
 */
function getAutoCloseTag(textBefore: string): string | null {
  // Match the most recent opening tag that isn't self-closing and isn't a closing tag
  const match = textBefore.match(/<([\w-]+)(?:\s[^>]*)?>$/);
  if (!match) return null;
  const tag = match[1].toLowerCase();
  // Void elements — never auto-close
  const voids = new Set([
    "area","base","br","col","embed","hr","img","input",
    "link","meta","param","source","track","wbr",
  ]);
  if (voids.has(tag)) return null;
  return `</${tag}>`;
}

// ─── Main component ───────────────────────────────────────────────────────────
// Supports two modes:
//   Uncontrolled (standalone): <HtmlEditorPreview />
//   Controlled (inside a form): <HtmlEditorPreview value={v} onChange={fn} />

interface HtmlEditorPreviewProps {
  value?: string;
  onChange?: (html: string) => void;
}

export function HtmlEditorPreview({ value, onChange }: HtmlEditorPreviewProps) {
  // Internal state used only in uncontrolled mode
  const [internalHtml, setInternalHtml] = useState(BOILERPLATE);
  const [splitView, setSplitView] = useState(false);
  const [editorTheme, setEditorTheme] = useState<ThemeKey>("dark");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // If value prop is provided use it (controlled), otherwise use internal state
  const html = value !== undefined ? value : internalHtml;

  const setHtml = useCallback((next: string) => {
    if (onChange) {
      onChange(next);        // controlled: bubble up to parent
    } else {
      setInternalHtml(next); // uncontrolled: manage locally
    }
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const ta = e.currentTarget;
      const { selectionStart: ss, selectionEnd: se } = ta;
      const before = html.substring(0, ss);
      const after = html.substring(se);

      // ── Tab → 2 spaces ───────────────────────────────────────────────────
      if (e.key === "Tab") {
        e.preventDefault();
        const next = before + "  " + after;
        setHtml(next);
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = ss + 2; });
        return;
      }

      // ── Closing bracket/quote: skip over if it's already there ───────────
      const closers = new Set([")", "]", "}", '"', "'", "`"]);
      if (closers.has(e.key) && after[0] === e.key && ss === se) {
        e.preventDefault();
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = ss + 1; });
        return;
      }

      // ── Backspace: remove auto-inserted pair together ─────────────────────
      if (e.key === "Backspace" && ss === se && ss > 0) {
        const opener = before[before.length - 1];
        const expectedCloser = PAIRS[opener];
        if (expectedCloser && after[0] === expectedCloser) {
          e.preventDefault();
          const next = before.slice(0, -1) + after.slice(1);
          setHtml(next);
          requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = ss - 1; });
          return;
        }
      }

      // ── `>` → auto-close HTML tag ─────────────────────────────────────────
      if (e.key === ">") {
        const closing = getAutoCloseTag(before + ">");
        if (closing) {
          e.preventDefault();
          const next = before + ">" + closing + after;
          setHtml(next);
          requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = ss + 1; });
          return;
        }
      }

      // ── Opening bracket/quote → insert pair, place cursor inside ─────────
      if (e.key in PAIRS && ss === se) {
        e.preventDefault();
        const closer = PAIRS[e.key];
        const next = before + e.key + closer + after;
        setHtml(next);
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = ss + 1; });
        return;
      }

      // ── Wrap selection in pair ────────────────────────────────────────────
      if (e.key in PAIRS && ss !== se) {
        e.preventDefault();
        const selected = html.substring(ss, se);
        const closer = PAIRS[e.key];
        const next = before + e.key + selected + closer + after;
        setHtml(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ss + 1;
          ta.selectionEnd = se + 1;
        });
        return;
      }
    },
    [html, setHtml]
  );

  const lines = toHighlightedLines(html);
  const isDark = editorTheme === "dark";

  const toolbar = (
    <div className="flex items-center border-b border-border bg-muted/40 px-3 py-2 gap-3">
      {!splitView && (
        <Tabs defaultValue="editor" className="contents">
          <TabsList className="h-8 gap-1 bg-transparent p-0">
            {(["editor", "preview"] as const).map((v) => (
              <TabsTrigger key={v} value={v} className={cn(
                "flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 pb-1.5 pt-1 text-sm font-medium text-muted-foreground transition-colors",
                "data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              )}>
                {v === "editor" ? <Code2 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      {splitView && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium"><Code2 className="h-3.5 w-3.5" /> Editor</span>
          <span className="opacity-30">/</span>
          <span className="flex items-center gap-1.5 font-medium"><Eye className="h-3.5 w-3.5" /> Preview</span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Sun className={cn("h-3.5 w-3.5 transition-colors", isDark ? "text-muted-foreground/40" : "text-amber-500")} />
          <Switch id="theme-toggle" checked={isDark} onCheckedChange={(v) => setEditorTheme(v ? "dark" : "light")} className="scale-90" />
          <Moon className={cn("h-3.5 w-3.5 transition-colors", isDark ? "text-sky-400" : "text-muted-foreground/40")} />
        </div>
        <span className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <Columns2 className="h-3.5 w-3.5 text-muted-foreground" />
          <Switch id="split-toggle" checked={splitView} onCheckedChange={setSplitView} className="scale-90" />
          <Label htmlFor="split-toggle" className="text-xs text-muted-foreground cursor-pointer select-none">Split</Label>
        </div>
      </div>
    </div>
  );

  const editorPane = (height: number) => (
    <EditorPane html={html} lines={lines} onKeyDown={handleKeyDown}
      onChange={setHtml} textareaRef={textareaRef} height={height} theme={editorTheme} />
  );

  if (splitView) {
    return (
      <div className="w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        {toolbar}
        <div className="flex divide-x divide-border">
          <div className="flex-1 min-w-0">{editorPane(420)}</div>
          <div className="flex-1 min-w-0"><PreviewPane html={html} height={452} /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <Tabs defaultValue="editor" className="w-full">
        {toolbar}
        <TabsContent value="editor" className="m-0">{editorPane(420)}</TabsContent>
        <TabsContent value="preview" className="m-0"><PreviewPane html={html} height={452} /></TabsContent>
      </Tabs>
    </div>
  );
}