import { useMemo, type ReactNode } from "react";
import { documentChapters, documentHtml, downloadText, inlinePattern, parseDocument, safeLink, type Block } from "./resourceDocument";
function Inline({ text }: { text: string }) {
  return <>{text.split(inlinePattern).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) { const url = safeLink(link[2]); return url ? <a key={index} href={url} target={url.startsWith("https:") ? "_blank" : undefined} rel={url.startsWith("https:") ? "noreferrer" : undefined}>{link[1]}</a> : link[1]; }
    return part;
  })}</>;
}
function DocumentBlock({ block }: { block: Block }) {
  if (block.kind === "heading") return block.level <= 2 ? <h3><Inline text={block.text} /></h3> : <h4><Inline text={block.text} /></h4>;
  if (block.kind === "paragraph") return <p><Inline text={block.text} /></p>;
  if (block.kind === "list") { const items = block.items.map((text, i) => <li key={i}><Inline text={text} /></li>); return block.ordered ? <ol>{items}</ol> : <ul>{items}</ul>; }
  return <div className="table-wrap"><table className="tbl"><thead><tr>{block.headers.map((text, i) => <th key={i} scope="col"><Inline text={text} /></th>)}</tr></thead><tbody>{block.rows.map((row, i) => <tr key={i}>{row.map((text, j) => <td key={j}><Inline text={text} /></td>)}</tr>)}</tbody></table></div>;
}
export default function ResourceScreen({ title, intro, markdown, filename, notice, actions }: { title: string; intro: string; markdown: string; filename: string; notice: string; actions?: ReactNode }) {
  const chapters = useMemo(() => documentChapters(parseDocument(markdown)), [markdown]);
  return <section className="screen report-resource">
    <header className="screen-head"><div><h2>{title}</h2><p className="text-secondary">{intro}</p></div></header>
    <div className="resource-notice"><strong>{notice}</strong></div>
    <div className="resource-actions row wrap gap">
      <button className="button" onClick={() => downloadText(`${filename}.md`, markdown, "text/markdown;charset=utf-8")}>Tải nội dung (.md)</button>
      <button className="button" onClick={() => downloadText(`${filename}.html`, documentHtml(markdown, title), "text/html;charset=utf-8")}>Tải bản đọc / in (.html)</button>
      <button className="button" onClick={() => window.print()}>In / lưu PDF</button>{actions}
    </div>
    <div className="resource-layout">
      <nav className="card resource-toc" aria-label={`Mục lục ${title}`}><h3>Mục lục</h3><p className="text-small text-secondary">Chọn mục để đến nội dung.</p>{chapters.map((chapter, i) => <button key={i} className="text-link" onClick={() => document.getElementById(`resource-chapter-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}>{chapter.title}</button>)}</nav>
      <article className="resource-body">{chapters.map((chapter, i) => <section className="card resource-chapter" id={`resource-chapter-${i}`} key={i} aria-label={chapter.title}>{i > 0 && <h3>{chapter.title}</h3>}{chapter.blocks.map((block, j) => <DocumentBlock block={block} key={j} />)}</section>)}</article>
    </div>
  </section>;
}
