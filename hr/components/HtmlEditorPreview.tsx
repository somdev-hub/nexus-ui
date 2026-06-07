"use client";

import { useState, useRef, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, Code2, Columns2, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Boilerplate ─────────────────────────────────────────────────────────────
const BOILERPLATE = `<!DOCTYPE html>
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
    bg:           "#0d1117",
    footerBorder: "#21262d",
    footerText:   "#8b949e",
    lineNums:     "#3d4450",
    code:         "#c9d1d9",
    caret:        "#58a6ff",
    tag:          "#7ee787",
    bracket:      "#8b949e",
    attr:         "#79c0ff",
    eq:           "#8b949e",
    string:       "#a5d6ff",
    comment:      "#8b949e",
    doctype:      "#8b949e",
  },
  light: {
    bg:           "#ffffff",
    footerBorder: "#e2e8f0",
    footerText:   "#64748b",
    lineNums:     "#94a3b8",
    code:         "#1e293b",
    caret:        "#2563eb",
    tag:          "#16a34a",
    bracket:      "#64748b",
    attr:         "#7c3aed",
    eq:           "#64748b",
    string:       "#b45309",
    comment:      "#94a3b8",
    doctype:      "#94a3b8",
  },
} as const;

type ThemeKey = keyof typeof THEMES;

// ─── Syntax highlighting ──────────────────────────────────────────────────────
function highlight(code: string): string {
  return code
    .replace(
      /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
      '<span class="hl-string">$1</span>'
    )
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="hl-comment">$1</span>')
    .replace(/(&lt;!DOCTYPE[^&]*&gt;)/gi, '<span class="hl-doctype">$1</span>')
    .replace(
      /(&lt;\/)([\w-]+)(&gt;)/g,
      '<span class="hl-bracket">$1</span><span class="hl-tag">$2</span><span class="hl-bracket">$3</span>'
    )
    .replace(/(&lt;)([\w-]+)((?:\s[^&]*)?)(&gt;)/g, (_, open, tag, attrs, close) => {
      const coloredAttrs = attrs.replace(
        /([\w-]+)(=)/g,
        '<span class="hl-attr">$1</span><span class="hl-eq">$2</span>'
      );
      return `<span class="hl-bracket">${open}</span><span class="hl-tag">${tag}</span>${coloredAttrs}<span class="hl-bracket">${close}</span>`;
    });
}

function toHighlightedLines(raw: string): string[] {
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.split("\n").map(highlight);
}

// ─── Editor pane ─────────────────────────────────────────────────────────────
function EditorPane({
  html,
  lines,
  onKeyDown,
  onChange,
  textareaRef,
  height,
  theme,
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
  return (
    <div className="flex flex-col" style={{ background: t.bg }}>
      <div className="relative overflow-auto" style={{ height }}>
        {/* Highlighted display layer */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex">
          <div
            className="select-none py-4 pr-3 pl-4 text-right font-mono text-[13px] leading-[1.6]"
            style={{ minWidth: "3.5rem", color: t.lineNums }}
          >
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <pre
            className="flex-1 overflow-hidden py-4 pr-4 font-mono text-[13px] leading-[1.6]"
            style={{ whiteSpace: "pre", color: t.code }}
            dangerouslySetInnerHTML={{ __html: lines.join("\n") }}
          />
        </div>
        {/* Editing textarea */}
        <div className="flex h-full">
          <div style={{ minWidth: "3.5rem", flexShrink: 0 }} />
          <textarea
            ref={textareaRef}
            value={html}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            className="h-full flex-1 resize-none bg-transparent py-4 pr-4 font-mono text-[13px] leading-[1.6] text-transparent outline-none"
            style={{ caretColor: t.caret }}
          />
        </div>
      </div>
      {/* Footer */}
      <div
        className="flex items-center border-t px-4 py-1.5 font-mono text-[11px]"
        style={{ borderColor: t.footerBorder, color: t.footerText, background: t.bg }}
      >
        <span>HTML</span>
        <span className="mx-2 opacity-30">·</span>
        <span>UTF-8</span>
        <span className="mx-2 opacity-30">·</span>
        <span>{lines.length} lines</span>
      </div>

      {/* Scoped syntax colours */}
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
    <iframe
      srcDoc={html}
      title="HTML Preview"
      sandbox="allow-scripts"
      className="w-full border-0 bg-white"
      style={{ height }}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function HtmlEditorPreview() {
  const [html, setHtml] = useState(BOILERPLATE);
  const [splitView, setSplitView] = useState(false);
  const [editorTheme, setEditorTheme] = useState<ThemeKey>("dark");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = e.currentTarget;
        const { selectionStart, selectionEnd } = ta;
        const next =
          html.substring(0, selectionStart) +
          "  " +
          html.substring(selectionEnd);
        setHtml(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = selectionStart + 2;
        });
      }
    },
    [html]
  );

  const lines = toHighlightedLines(html);
  const isDark = editorTheme === "dark";

  // ── Toolbar ──
  const toolbar = (
    <div className="flex items-center border-b border-border bg-muted/40 px-3 py-2 gap-3">
      {!splitView && (
        <Tabs defaultValue="editor" className="contents">
          <TabsList className="h-8 gap-1 bg-transparent p-0">
            <TabsTrigger
              value="editor"
              className={cn(
                "flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 pb-1.5 pt-1 text-sm font-medium",
                "text-muted-foreground transition-colors",
                "data-[state=active]:border-foreground data-[state=active]:text-foreground",
                "data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              Editor
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className={cn(
                "flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 pb-1.5 pt-1 text-sm font-medium",
                "text-muted-foreground transition-colors",
                "data-[state=active]:border-foreground data-[state=active]:text-foreground",
                "data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {splitView && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <Code2 className="h-3.5 w-3.5" /> Editor
          </span>
          <span className="opacity-30">/</span>
          <span className="flex items-center gap-1.5 font-medium">
            <Eye className="h-3.5 w-3.5" /> Preview
          </span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-4">
        {/* Light / Dark editor toggle */}
        <div className="flex items-center gap-1.5">
          <Sun className={cn("h-3.5 w-3.5 transition-colors", isDark ? "text-muted-foreground/40" : "text-amber-500")} />
          <Switch
            id="theme-toggle"
            checked={isDark}
            onCheckedChange={(v) => setEditorTheme(v ? "dark" : "light")}
            className="scale-90"
          />
          <Moon className={cn("h-3.5 w-3.5 transition-colors", isDark ? "text-sky-400" : "text-muted-foreground/40")} />
        </div>

        {/* Divider */}
        <span className="h-4 w-px bg-border" />

        {/* Split toggle */}
        <div className="flex items-center gap-1.5">
          <Columns2 className="h-3.5 w-3.5 text-muted-foreground" />
          <Switch
            id="split-toggle"
            checked={splitView}
            onCheckedChange={setSplitView}
            className="scale-90"
          />
          <Label htmlFor="split-toggle" className="text-xs text-muted-foreground cursor-pointer select-none">
            Split
          </Label>
        </div>
      </div>
    </div>
  );

  const editorPane = (height: number) => (
    <EditorPane
      html={html}
      lines={lines}
      onKeyDown={handleKeyDown}
      onChange={setHtml}
      textareaRef={textareaRef}
      height={height}
      theme={editorTheme}
    />
  );

  // ── Split layout ──
  if (splitView) {
    return (
      <div className="w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        {toolbar}
        <div className="flex divide-x divide-border">
          <div className="flex-1 min-w-0">{editorPane(420)}</div>
          <div className="flex-1 min-w-0">
            <PreviewPane html={html} height={452} />
          </div>
        </div>
      </div>
    );
  }

  // ── Tabbed layout ──
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <Tabs defaultValue="editor" className="w-full">
        {toolbar}
        <TabsContent value="editor" className="m-0">
          {editorPane(420)}
        </TabsContent>
        <TabsContent value="preview" className="m-0">
          <PreviewPane html={html} height={452} />
        </TabsContent>
      </Tabs>
    </div>
  );
}