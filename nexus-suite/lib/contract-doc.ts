// ─────────────────────────────────────────────────────────────
// Contract document helpers: default template generation plus small
// HTML <-> Markdown converters (no extra dependencies).
// ─────────────────────────────────────────────────────────────

export interface ContractTemplateValues {
    contractNumber?: string;
    contractName?: string;
    supplierName?: string;
    retailerName?: string;
    contractType?: string;
    effectiveDate?: string;
    expiryDate?: string;
    autoRenewal?: boolean;
    renewalNoticeDays?: number;
    baseCurrency?: string;
    paymentTermsDays?: number;
    contractAmount?: number;
    incoterms?: string;
    description?: string;
}

const esc = (value?: string | number | boolean | null): string => {
    if (value === undefined || value === null || value === '') return '—';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

/** Default contract document (HTML for the rich text editor). */
export function buildContractTemplate(v: ContractTemplateValues): string {
    return `<h2>Supplier Contract — ${esc(v.contractName) || 'Untitled Contract'}</h2>`
        + `<p>This Supplier Contract ("Contract") is entered into between <strong>${esc(v.retailerName) || 'Retailer'}</strong> ("Retailer") and <strong>${esc(v.supplierName) || 'Supplier'}</strong> ("Supplier").</p>`
        + `<h2>1. Contract Details</h2>`
        + `<ul>`
        + `<li><strong>Contract Number:</strong> ${esc(v.contractNumber)}</li>`
        + `<li><strong>Contract Type:</strong> ${esc(v.contractType)}</li>`
        + `<li><strong>Effective Date:</strong> ${esc(v.effectiveDate)}</li>`
        + `<li><strong>Expiry Date:</strong> ${esc(v.expiryDate)}</li>`
        + `<li><strong>Auto Renewal:</strong> ${v.autoRenewal ? `Yes (${esc(v.renewalNoticeDays)} days notice)` : 'No'}</li>`
        + `</ul>`
        + `<h2>2. Commercial Terms</h2>`
        + `<ul>`
        + `<li><strong>Currency:</strong> ${esc(v.baseCurrency)}</li>`
        + (v.contractAmount !== undefined && v.contractAmount !== null
            ? `<li><strong>Contract Amount:</strong> ${esc(v.baseCurrency)} ${esc(v.contractAmount)}</li>`
            : ``)
        + `<li><strong>Payment Terms:</strong> ${esc(v.paymentTermsDays)} days</li>`
        + `<li><strong>Incoterms:</strong> ${esc(v.incoterms)}</li>`
        + `</ul>`
        + (v.description
            ? `<h2>3. Scope</h2><p>${esc(v.description)}</p>`
            : `<h2>3. Scope</h2><p>Scope of supply to be detailed here.</p>`)
        + `<h2>4. General Terms and Conditions</h2>`
        + `<ol>`
        + `<li>Supplier shall deliver goods as per the specifications and timelines agreed under this Contract.</li>`
        + `<li>Retailer shall make payments within the agreed payment terms from the date of invoice acceptance.</li>`
        + `<li>Either party may terminate this Contract with prior written notice as per the renewal notice period.</li>`
        + `<li>Disputes arising under this Contract shall first be resolved through mutual discussion.</li>`
        + `</ol>`;
}

/** Minimal HTML (tiptap output) -> Markdown for .md DMS storage. */
export function htmlToMarkdown(html: string): string {
    let md = html ?? '';
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gis, (_, t) => `\n\n## ${stripTags(t).trim()}\n\n`);
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gis, (_, t) => `\n\n# ${stripTags(t).trim()}\n\n`);
    md = md.replace(/<(ul|ol)[^>]*>(.*?)<\/\1>/gis, (_, __, inner) => {
        const items = [...String(inner).matchAll(/<li[^>]*>(.*?)<\/li>/gis)].map(
            (m) => `- ${stripTags(m[1]).trim()}`
        );
        return `\n\n${items.join('\n')}\n\n`;
    });
    md = md.replace(/<p[^>]*>(.*?)<\/p>/gis, (_, t) => `\n\n${stripTags(t).trim()}\n\n`);
    md = md.replace(/<br\s*\/?>/gi, '\n');
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gis, (_, t) => `**${stripTags(t).trim()}**`);
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gis, (_, t) => `**${stripTags(t).trim()}**`);
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gis, (_, t) => `*${stripTags(t).trim()}*`);
    md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis, (_, href, t) => `[${stripTags(t).trim()}](${href})`);
    md = stripTags(md);
    md = md.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    return md.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

function stripTags(html: string): string {
    return String(html ?? '').replace(/<[^>]*>/g, '');
}

/** Minimal Markdown -> HTML for loading stored .md back into the editor. */
export function markdownToHtml(md: string): string {
    const lines = String(md ?? '').split('\n');
    let html = '';
    let inList = false;
    const inline = (text: string) =>
        stripTags(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.startsWith('## ')) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += `<h2>${inline(line.slice(3))}</h2>`;
        } else if (line.startsWith('# ')) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += `<h2>${inline(line.slice(2))}</h2>`;
        } else if (/^[-*] /.test(line)) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            html += `<li>${inline(line.replace(/^[-*] /, ''))}</li>`;
        } else if (line === '') {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
        } else {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += `<p>${inline(line)}</p>`;
        }
    }
    if (inList) html += '</ul>';
    return html;
}
