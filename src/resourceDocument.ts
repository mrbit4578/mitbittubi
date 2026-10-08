export type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "table"; headers: string[]; rows: string[][] };
export type Chapter = { title: string; blocks: Block[] };
const cells = (line: string) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(cell => cell.trim());
export function parseDocument(markdown: string): Block[] {
  const lines = markdown.replace(/\r/g, "").split("\n"), blocks: Block[] = [];
  let i = 0;
  const special = (line: string) => /^(#{1,4}\s|\||[-*]\s|\d+\.\s)/.test(line);
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) { blocks.push({ kind: "heading", level: heading[1].length, text: heading[2] }); i++; continue; }
    if (line.startsWith("|") && /^\|?\s*:?-{3}/.test(lines[i + 1]?.trim() ?? "")) {
      const headers = cells(line), rows: string[][] = []; i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(cells(lines[i])); i++; }
      blocks.push({ kind: "table", headers, rows }); continue;
    }
    const list = /^(?:[-*]|\d+\.)\s+(.+)$/.exec(line);
    if (list) {
      const ordered = /^\d/.test(line), items: string[] = [];
      while (i < lines.length && (ordered ? /^\d+\.\s+/.test(lines[i].trim()) : /^[-*]\s+/.test(lines[i].trim()))) { items.push(lines[i].trim().replace(/^(?:[-*]|\d+\.)\s+/, "")); i++; }
      blocks.push({ kind: "list", ordered, items }); continue;
    }
    const paragraph = [line]; i++;
    while (i < lines.length && lines[i].trim() && !special(lines[i].trim())) { paragraph.push(lines[i].trim()); i++; }
    blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
  }
  return blocks;
}
export function documentChapters(blocks: Block[]): Chapter[] {
  const chapters: Chapter[] = [{ title: "Thông tin tài liệu", blocks: [] }];
  for (const block of blocks) {
    if (block.kind === "heading" && block.level === 2) chapters.push({ title: block.text, blocks: [] });
    else chapters[chapters.length - 1].blocks.push(block);
  }
  return chapters.filter(chapter => chapter.blocks.length > 0);
}
export function escapeHtml(value: string) { return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!)); }
export function safeLink(url: string) { return /^https:\/\/[^\s]+$/i.test(url) || /^#(?:[a-z][a-z0-9-]*)$/.test(url) ? url : null; }
export const inlinePattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
export function inlineHtml(text: string): string {
  return text.split(inlinePattern).map(part => {
    if (part.startsWith("**") && part.endsWith("**")) return `<strong>${escapeHtml(part.slice(2, -2))}</strong>`;
    if (part.startsWith("`") && part.endsWith("`")) return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) { const url = safeLink(link[2]); return url ? `<a href="${escapeHtml(url.startsWith("#") ? `https://mitbittubi.vercel.app/${url}` : url)}">${escapeHtml(link[1])}</a>` : escapeHtml(link[1]); }
    return escapeHtml(part);
  }).join("");
}
export function documentHtml(markdown: string, title: string): string {
  const body = parseDocument(markdown).map(block => {
    if (block.kind === "heading") return `<h${block.level}>${inlineHtml(block.text)}</h${block.level}>`;
    if (block.kind === "paragraph") return `<p>${inlineHtml(block.text)}</p>`;
    if (block.kind === "list") { const tag = block.ordered ? "ol" : "ul"; return `<${tag}>${block.items.map(text => `<li>${inlineHtml(text)}</li>`).join("")}</${tag}>`; }
    return `<table><thead><tr>${block.headers.map(text => `<th scope="col">${inlineHtml(text)}</th>`).join("")}</tr></thead><tbody>${block.rows.map(row => `<tr>${row.map(text => `<td>${inlineHtml(text)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }).join("\n");
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{max-width:1000px;margin:40px auto;padding:0 20px;color:#17212b;background:white;font:15px/1.65 system-ui,sans-serif}h1{font-size:32px}h2{margin-top:36px;border-bottom:2px solid #ccc;padding-bottom:8px}h3{margin-top:24px}table{border-collapse:collapse;width:100%;font-size:13px;display:block;overflow:auto}th,td{border:1px solid #ccc;padding:8px;text-align:left;vertical-align:top}th{background:#f2f4f5}a{color:#483080}p,li{overflow-wrap:anywhere}code{font-family:monospace}@page{size:A4;margin:18mm}@media print{body{margin:0;padding:0;font-size:10pt}h1,h2,h3{break-after:avoid}table{display:table;overflow:visible;font-size:8pt}tr{break-inside:avoid}thead{display:table-header-group}a{color:inherit}}</style></head><body>${body}</body></html>`;
}
export function downloadText(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
