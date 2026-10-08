import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, api, useAppSession, type Doc } from "./data";
import { WorkspacePanel } from "./WorkspacePanel";
import { CrudScreen, ImportExportBar, type Col, type AnyRow, type CrudFns } from "./crud";
import { ARTICLES, CATEGORIES, CHECKLIST, DEPARTMENTS, QUICK_QUESTIONS } from "./content";
import { downloadXlsx } from "./xlsx";
import { aggregateRecords, reportReadiness, periodContains } from "./esg";
import EvidenceScreen from "./EvidenceScreen";
const ReportLibrary = lazy(() => import("./ReportLibrary"));
const WorkflowGuide = lazy(() => import("./WorkflowGuide"));

const DEPT_OPTS = DEPARTMENTS.map((d) => ({ value: d, label: d }));
const STATUS_DATA = [{ value: "measured", label: "Đo/ghi thực" }, { value: "estimated", label: "Ước tính" }, { value: "missing", label: "Thiếu" }, { value: "na", label: "Không áp dụng" }];
const TASK_STATUS = [{ value: "todo", label: "Chưa làm" }, { value: "doing", label: "Đang làm" }, { value: "done", label: "Hoàn thành" }, { value: "blocked", label: "Vướng mắc" }];
const RM_STATUS = [{ value: "planned", label: "Kế hoạch" }, { value: "doing", label: "Đang thực hiện" }, { value: "done", label: "Hoàn thành" }, { value: "late", label: "Trễ" }];
const TOPIC_STATUS = [{ value: "candidate", label: "Đang khảo sát" }, { value: "material", label: "Trọng yếu" }, { value: "not_material", label: "Không trọng yếu" }];
const CAPA_STATUS = [{ value: "open", label: "Mở" }, { value: "in_progress", label: "Đang xử lý" }, { value: "verified", label: "Đã kiểm tra hiệu lực" }, { value: "closed", label: "Đóng" }];
const SEVERITY = [{ value: "low", label: "Thấp" }, { value: "medium", label: "Trung bình" }, { value: "high", label: "Cao" }, { value: "critical", label: "Nghiêm trọng" }];
const REQ_LAYER = [{ value: "law", label: "Pháp luật" }, { value: "brand", label: "Nhãn hàng" }, { value: "framework", label: "Khung/tiêu chuẩn" }];
const REQ_STATUS = [{ value: "to_check", label: "Cần kiểm tra" }, { value: "applicable", label: "Áp dụng" }, { value: "compliant", label: "Đáp ứng" }, { value: "gap", label: "Có khoảng trống" }, { value: "not_applicable", label: "Không áp dụng" }];
const REPORT_TYPE = [{ value: "monthly", label: "Báo cáo tháng" }, { value: "quarterly", label: "Báo cáo quý" }, { value: "annual", label: "Báo cáo năm" }, { value: "other", label: "Khác" }];
const REPORT_STATUS = [{ value: "draft", label: "Dự thảo" }, { value: "review", label: "Đang soát xét" }, { value: "approved", label: "Đã duyệt" }, { value: "published", label: "Đã phát hành" }];
const PILLAR = [{ value: "E", label: "E – Môi trường" }, { value: "S", label: "S – Xã hội" }, { value: "G", label: "G – Quản trị" }];
const SCOPE_OPTS = [{ value: "1", label: "Scope 1" }, { value: "2", label: "Scope 2" }, { value: "3", label: "Scope 3" }];
const SCOPE2_METHODS = [{ value: "location", label: "Scope 2 theo địa điểm" }, { value: "market", label: "Scope 2 theo thị trường" }, { value: "not_applicable", label: "Không áp dụng (Scope 1 / 3)" }];
const ANSWERS = [{ value: "yes", label: "Đã có" }, { value: "partial", label: "Một phần" }, { value: "no", label: "Chưa có" }, { value: "unknown", label: "Chưa rõ" }];
const REVIEW_STATES = [{ value: "pending", label: "Chờ soát xét" }, { value: "approved", label: "Đã duyệt" }, { value: "rejected", label: "Cần sửa" }];
const AGGREGATIONS = [{ value: "sum", label: "Cộng dồn" }, { value: "last", label: "Giá trị cuối kỳ" }, { value: "ratio", label: "Tỷ lệ từ tổng tử / mẫu" }, { value: "manual", label: "Thuyết minh, không cộng" }];
const thisPeriod = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);
const periodMatches = (recordPeriod: string, selected: string) => periodContains(selected, recordPeriod);
const displayError = (ex: unknown) => ex instanceof Error ? ex.message : String(ex);
function downloadJson(name: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${name}.json`; anchor.click();
  URL.revokeObjectURL(url);
}

const fns = (p: string): CrudFns => {
  const a = api.app as unknown as Record<string, CrudFns["list"]>;
  return { list: a[`list${p}`], upsert: a[`upsert${p}`] as unknown as CrudFns["upsert"], remove: a[`remove${p}`] as unknown as CrudFns["remove"], removeMany: a[`removeMany${p}`] as unknown as CrudFns["removeMany"], bulk: a[`import${p}`] as unknown as CrudFns["bulk"] };
};
const F = {
  kpis: { ...fns("Kpis"), upsert: api.app.upsertKpi, remove: api.app.removeKpi } as CrudFns,
  data: { ...fns("DataRecords"), upsert: api.app.upsertDataRecord, remove: api.app.removeDataRecord } as CrudFns,
  reports: { ...fns("Reports"), upsert: api.app.upsertReport, remove: api.app.removeReport } as CrudFns,
  tasks: { ...fns("Tasks"), upsert: api.app.upsertTask, remove: api.app.removeTask } as CrudFns,
  roadmap: fns("Roadmap"),
  topics: { ...fns("Topics"), upsert: api.app.upsertTopic, remove: api.app.removeTopic } as CrudFns,
  capa: fns("Capa"),
  reqs: { ...fns("Requirements"), upsert: api.app.upsertRequirement, remove: api.app.removeRequirement } as CrudFns,
  knowledge: fns("Knowledge"),
  questions: { ...fns("Questions"), upsert: api.app.upsertQuestion, remove: api.app.removeQuestion } as CrudFns,
  ghg: fns("Ghg"),
};

const Stat = ({ label, value, tone }: { label: string; value: string | number; tone?: string }) => (
  <div className={`card stat ${tone ?? ""}`}><span className="text-label">{label}</span><strong>{value}</strong></div>
);
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

function Dashboard({ canWrite, go }: { canWrite: boolean; go: (s: string) => void }) {
  const kpis = (useQuery(api.app.listKpis) as Doc<"kpis">[] | undefined); const tasks = (useQuery(api.app.listTasks) as Doc<"tasks">[] | undefined); const roadmap = (useQuery(api.app.listRoadmap) as Doc<"roadmap">[] | undefined);
  const capa = (useQuery(api.app.listCapa) as Doc<"capa">[] | undefined); const answers = (useQuery(api.app.listAssessment) as Doc<"assessmentAnswers">[] | undefined); const records = (useQuery(api.app.dataRecordsByPeriod, { period: thisPeriod() }) as Doc<"dataRecords">[] | undefined);
  const reports = (useQuery(api.app.listReports) as Doc<"reports">[] | undefined); const ghg = (useQuery(api.app.listGhg) as Doc<"ghgEntries">[] | undefined); const reqs = (useQuery(api.app.listRequirements) as Doc<"requirements">[] | undefined); const topics = (useQuery(api.app.listTopics) as Doc<"topics">[] | undefined);
  const seed = useMutation(api.app.seedDefaults);
  const [seedMsg, setSeedMsg] = useState("");
  const score = useMemo(() => { const byCode = new Map((answers ?? []).map((a) => [a.code, a])); const pts = CHECKLIST.reduce((sum, c) => { const a = byCode.get(c.code); return sum + (a?.answer === "yes" ? 1 : a?.answer === "partial" ? 0.5 : 0); }, 0); return pct(pts, CHECKLIST.length); }, [answers]);
  const done = tasks?.filter((t) => t.status === "done").length ?? 0;
  const openCapa = capa?.filter((c) => c.status === "open" || c.status === "in_progress").length ?? 0;
  const next = roadmap?.filter((r) => r.status !== "done").sort((a, b) => a.quarter.localeCompare(b.quarter))[0];
  const empty = kpis && kpis.length === 0 && tasks && tasks.length === 0;
  const backup = useQuery(api.app.exportWorkspace) as { formatVersion: number; workspace: unknown; exportedAt: string | number; tables: Record<string, Record<string, unknown>[]>; audit: Record<string, unknown>[] } | undefined;
  const [exportErr, setExportErr] = useState("");
  const [seedBusy, setSeedBusy] = useState(false);
  const exportAll = () => {
    try {
      if (!backup) throw new Error("Dữ liệu chưa tải xong; hãy thử lại sau ít giây.");
      const tables = { ...backup.tables, audit: backup.audit };
      downloadXlsx("ESG_Hub_toan_bo", Object.entries(tables).map(([name, rows]) => {
        const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
        return { name: name.slice(0, 31), rows: [keys, ...rows.map((row) => keys.map((key) => {
          const value = row[key];
          return value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : typeof value === "boolean" ? String(value).toUpperCase() : typeof value === "number" ? value : String(value);
        }))] };
      }));
      setExportErr("");
    } catch (ex) { setExportErr(displayError(ex)); }
  };
  const exportJson = () => { if (backup) downloadJson(`ESG_Hub_backup_${thisPeriod()}`, backup); };

  return (
    <section className="screen">
      <header className="screen-head"><div><h2>Tổng quan</h2><p className="text-secondary">Cùng học, xây dựng hệ thống, giao việc, thu nhận bằng chứng và lập báo cáo ESG cho doanh nghiệp giày & rubber boots. Kết quả cần được soát xét theo phạm vi và yêu cầu áp dụng; ứng dụng không cấp chứng nhận.</p></div>
        <div className="row wrap gap"><button className="button" disabled={!backup} onClick={exportAll}>Xuất toàn bộ Excel</button><button className="button" disabled={!backup} onClick={exportJson}>Sao lưu JSON đầy đủ</button></div></header>
      <div className="card resource-launcher"><h3>Tài liệu và hướng dẫn thực hành</h3><p className="text-secondary">Báo cáo audit dự án, khung biên soạn, mẫu tham chiếu và đường đi cho từng vai trò.</p><div className="row wrap gap"><button className="button" onClick={() => go("project-audit")}>Đọc Audit & Kaizen</button><button className="button" onClick={() => go("report-kit")}>Mở khung báo cáo ESG</button><button className="button" onClick={() => go("report-example")}>Đọc báo cáo tham chiếu</button><button className="button button-primary" onClick={() => go("guide")}>Xem sơ đồ thao tác</button></div></div>
      {exportErr && <p className="error-text" role="alert">{exportErr}</p>}
      {empty && canWrite && (
        <div className="card callout"><div><strong>Bắt đầu nhanh.</strong> Nạp bộ mẫu đề xuất từ Kế hoạch ESG 2026–2030: 24 KPI, 65 đầu việc cho 13 bộ phận, 17 quý lộ trình, 10 chủ đề trọng yếu, 21 yêu cầu. Không có số liệu thực tế để tránh lẫn với dữ liệu nhà máy.</div>
          <button className="button button-primary" disabled={seedBusy} onClick={async () => { setSeedBusy(true); try { const r = await seed({}); setSeedMsg(`Đã nạp: ${r.kpis} KPI, ${r.tasks} việc, ${r.roadmap} quý, ${r.topics} chủ đề, ${r.requirements} yêu cầu.`); } catch (ex) { setExportErr(displayError(ex)); } finally { setSeedBusy(false); } }}>{seedBusy ? "Đang nạp…" : "Nạp bộ mẫu"}</button></div>
      )}
      {seedMsg && <p className="text-secondary">{seedMsg}</p>}
      <div className="stats">
        <Stat label="Mức sẵn sàng ESG" value={`${score}%`} tone={score >= 70 ? "good" : score >= 40 ? "warn" : "bad"} />
        <Stat label="Đầu việc hoàn thành" value={`${done}/${tasks?.length ?? 0}`} />
        <Stat label={`Bản ghi kỳ ${thisPeriod()}`} value={records?.length ?? 0} />
        <Stat label="CAPA đang mở" value={openCapa} tone={openCapa ? "warn" : ""} />
        <Stat label="Báo cáo" value={reports?.length ?? 0} />
        <Stat label="Yêu cầu có khoảng trống" value={reqs?.filter((r) => r.status === "gap").length ?? 0} />
      </div>
      <div className="grid2">
        <div className="card"><h3>Mốc lộ trình kế tiếp</h3>{next ? <><p><strong>{next.quarter}</strong> · {next.title}</p><p className="text-secondary">{next.description}</p><p className="text-small text-muted">Chủ trì: {next.leads}</p></> : <p className="text-secondary">Chưa có lộ trình. Nạp bộ mẫu hoặc thêm ở màn Lộ trình.</p>}<button className="button" onClick={() => go("roadmap")}>Xem lộ trình</button></div>
        <div className="card"><h3>Lối đi đề xuất cho doanh nghiệp mới</h3><ol className="steps">
          <li><button className="text-link" onClick={() => go("learn")}>Học khái niệm cốt lõi: E–S–G, Scope 1/2/3, GRI, greenwashing.</button></li>
          <li><button className="text-link" onClick={() => go("assess")}>Tự đánh giá mức sẵn sàng theo 25 tiêu chí.</button></li>
          <li><button className="text-link" onClick={() => go("roadmap")}>Lập ban ESG, giao đầu việc và theo dõi lộ trình.</button></li>
          <li><button className="text-link" onClick={() => go("topics")}>Xác định chủ đề trọng yếu và từ điển KPI.</button></li>
          <li><button className="text-link" onClick={() => go("data")}>Nộp dữ liệu, soát xét độc lập và khóa kỳ.</button></li>
          <li><button className="text-link" onClick={() => go("reports")}>Lập báo cáo từ dữ liệu đã duyệt và khóa; ghi rõ thiếu sót.</button></li>
        </ol></div>
      </div>
    </section>
  );
}

function searchArticles(q: string) {
  const n = q.trim().toLowerCase();
  if (!n) return [];
  const words = n.split(/\s+/).filter((w) => w.length > 1);
  return ARTICLES.map((a) => { const hay = `${a.title} ${a.summary} ${a.tags.join(" ")} ${a.content}`.toLowerCase(); const s = words.reduce((acc, w) => acc + (hay.includes(w) ? 1 : 0) + (a.title.toLowerCase().includes(w) ? 2 : 0), 0); return { a, s }; })
    .filter((x) => x.s > 0).sort((x, y) => y.s - x.s).map((x) => x.a);
}

function QAScreen({ canWrite }: { canWrite: boolean }) {
  const questions = useQuery(api.app.listQuestions) as Doc<"questions">[] | undefined;
  const knowledge = useQuery(api.app.listKnowledge) as Doc<"knowledge">[] | undefined;
  const session = useAppSession();
  const upsert = useMutation(api.app.upsertQuestion);
  const [q, setQ] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({});
  const matches = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter((word) => word.length > 1);
    if (!words.length) return [];
    const all = [...ARTICLES, ...(knowledge ?? []).map((k) => ({ id: k._id, title: k.title, summary: k.summary, content: k.content, category: k.category, source: k.source }))];
    return all.map((a) => ({ a, score: words.filter((word) => `${a.title} ${a.summary} ${a.content}`.toLowerCase().includes(word)).length })).filter((it) => it.score > 0).sort((a, b) => b.score - a.score).slice(0, 4).map((it) => it.a);
  }, [q, knowledge]);
  const ask = async () => {
    if (!q.trim()) return;
    setBusy(true); setErr("");
    try {
      const answer = matches.length ? `Tài liệu gợi ý để chuyên gia soát xét:\n${matches.map((a) => `${a.title}: ${a.summary}\nNguồn: ${a.source}`).join("\n\n")}` : "";
      await upsert({ data: { question: q.trim(), answer, category: matches[0]?.category ?? "", askedBy: session.user?.email ?? "", status: "open", aiGenerated: false, createdAt: Date.now() } });
      setQ("");
    } catch (ex) { setErr(displayError(ex)); } finally { setBusy(false); }
  };
  const cols: Col[] = [{ key: "question", label: "Câu hỏi" }, { key: "answer", label: "Trả lời" }, { key: "category", label: "Chủ đề" }, { key: "askedBy", label: "Người hỏi" }, { key: "status", label: "Trạng thái", type: "select", options: [{ value: "open", label: "Chờ soát xét" }, { value: "answered", label: "Đã trả lời" }] }];
  return <section className="screen">
    <header className="screen-head"><div><h2>Hỏi đáp ESG</h2><p className="text-secondary">Tìm tài liệu nền và tài liệu doanh nghiệp liên quan; câu hỏi được lưu để chuyên gia nội bộ trả lời. Gợi ý tìm kiếm cần được soát xét trước khi áp dụng.</p></div></header>
    <div className="card">
      <label className="field"><span className="text-label">Câu hỏi của bạn</span><textarea className="input" rows={3} placeholder="Nhà máy nên chọn năm cơ sở nào và cần điều kiện gì?" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <div className="row wrap gap chips">{QUICK_QUESTIONS.map((text) => <button key={text} className="chip" onClick={() => setQ(text)}>{text}</button>)}</div>
      {matches.length > 0 && <div className="matches"><span className="text-label">Tài liệu liên quan</span>{matches.map((a) => <details key={a.id}><summary>{a.title}</summary><p className="text-secondary">{a.summary}</p><pre className="article-body">{a.content}</pre><p className="text-small text-muted">Nguồn: {a.source}</p></details>)}</div>}
      {err && <p className="error-text" role="alert">{err}</p>}
      {canWrite && <div className="row gap end"><button className="button button-primary" disabled={busy || !q.trim()} onClick={ask}>{busy ? "Đang gửi…" : "Gửi câu hỏi"}</button></div>}
    </div>
    <div className="row between wrap"><h3>Lịch sử hỏi đáp</h3><ImportExportBar cols={cols} rows={(questions ?? []) as unknown as Record<string, unknown>[]} fileName="Hoi_dap_ESG" canWrite={false} /></div>
    {questions === undefined ? <div className="card empty">Đang tải…</div> : questions.length === 0 ? <div className="card empty">Chưa có câu hỏi nào.</div> : questions.map((it) => <div key={it._id} className="card qa">
      <div className="row between wrap"><strong>{it.question}</strong><span className={`pill pill-${it.status}`}>{it.status === "answered" ? "Đã trả lời" : "Chờ chuyên gia soát xét"}</span></div>
      {it.answer && <pre className="article-body">{it.answer}</pre>}
      {canWrite && it.status !== "answered" && <div className="row gap wrap"><label className="field grow"><span className="text-small">Câu trả lời đã soát xét</span><textarea className="input" value={answerDraft[it._id] ?? ""} onChange={(e) => setAnswerDraft((draft) => ({ ...draft, [it._id]: e.target.value }))} /></label><button className="button" disabled={busy || !(answerDraft[it._id] ?? "").trim()} onClick={async () => {
        setBusy(true); setErr(""); try { const { _id, _creationTime, ...rest } = it; void _creationTime; await upsert({ id: _id, expectedVersion: it._version, data: { ...rest, answer: answerDraft[_id].trim(), status: "answered", aiGenerated: false } }); } catch (ex) { setErr(displayError(ex)); } finally { setBusy(false); }
      }}>Trả lời</button></div>}
      <time className="text-small text-muted" dateTime={new Date(it.createdAt).toISOString()}>{new Date(it.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</time>
    </div>)}
  </section>;
}

function LearnScreen({ canWrite }: { canWrite: boolean }) {
  const [q, setQ] = useState(""); const [cat, setCat] = useState(""); const [open, setOpen] = useState<string | null>(null);
  const custom = (useQuery(api.app.listKnowledge) as Doc<"knowledge">[] | undefined);
  const list = useMemo(() => {
    const all = [...ARTICLES, ...(custom ?? []).map((k) => ({ id: k._id, category: k.category, title: k.title, summary: k.summary, content: k.content, tags: String(k.tags).split(",").map((t: string) => t.trim()).filter(Boolean), source: k.source }))];
    const base = q.trim() ? searchArticles(q).concat(all.filter((a) => !ARTICLES.includes(a as never) && `${a.title} ${a.content}`.toLowerCase().includes(q.trim().toLowerCase()))) : all;
    return base.filter((a) => !cat || a.category === cat);
  }, [q, cat, custom]);
  const cols: Col[] = [{ key: "title", label: "Tiêu đề", required: true }, { key: "category", label: "Chuyên mục", type: "select", options: CATEGORIES.map((c) => ({ value: c.id, label: c.label })), filter: true }, { key: "summary", label: "Tóm tắt", type: "textarea" }, { key: "content", label: "Nội dung", type: "textarea" }, { key: "tags", label: "Thẻ (phân cách bằng dấu phẩy)", table: false }, { key: "source", label: "Nguồn" }];
  const [tab, setTab] = useState<"lib" | "own">("lib");
  return (
    <section className="screen">
      <header className="screen-head"><div><h2>Học hỏi & tìm kiếm thông tin</h2><p className="text-secondary">Thư viện {ARTICLES.length} bài tổng hợp từ bộ tài liệu dự án, cộng thêm tài liệu nội bộ bạn bổ sung.</p></div>
        <div className="tabs" aria-label="Nguồn kiến thức"><button aria-pressed={tab === "lib"} className={tab === "lib" ? "active" : ""} onClick={() => setTab("lib")}>Thư viện</button><button aria-pressed={tab === "own"} className={tab === "own" ? "active" : ""} onClick={() => setTab("own")}>Tài liệu nội bộ</button></div></header>
      {tab === "own" ? <CrudScreen key="knowledge" title="Tài liệu nội bộ" intro="Bổ sung kiến thức, hướng dẫn, SOP của nhà máy. Nhập/xuất Excel." cols={cols} fns={F.knowledge} fileName="Tai_lieu_noi_bo" canWrite={canWrite} defaults={{ category: "tong-quan" }} /> : (
        <>
          <div className="card toolbar"><input className="input grow" aria-label="Tìm trong thư viện ESG" placeholder="Tìm: scope 2, năm cơ sở, GRI 3, MRSL…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="input" aria-label="Chuyên mục thư viện" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">Tất cả chuyên mục</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
            <button className="button" onClick={() => downloadXlsx("Thu_vien_ESG", [{ name: "Thu_vien", rows: [["Chuyên mục", "Tiêu đề", "Tóm tắt", "Nội dung", "Thẻ", "Nguồn"], ...list.map((a) => [CATEGORIES.find((c) => c.id === a.category)?.label ?? a.category, a.title, a.summary, a.content, a.tags.join(", "), a.source])] }])}>Xuất Excel ({list.length})</button></div>
          {list.length === 0 && <div className="card empty">Không tìm thấy bài phù hợp.</div>}
          <div className="articles">{list.map((a) => (
            <article key={a.id} className={`card article ${open === a.id ? "open" : ""}`}>
              <span className="badge badge-info">{CATEGORIES.find((c) => c.id === a.category)?.label ?? a.category}</span>
              <h3><button className="article-toggle" aria-expanded={open === a.id} aria-controls={`article-${a.id}`} onClick={() => setOpen(open === a.id ? null : a.id)}>{a.title}</button></h3><p className="text-secondary">{a.summary}</p>
              {open === a.id && <div id={`article-${a.id}`}><pre className="article-body">{a.content}</pre><p className="text-small text-muted">Nguồn: {a.source} · {a.tags.join(" · ")}</p></div>}
            </article>))}</div>
        </>
      )}
    </section>
  );
}

function AssessScreen({ canWrite }: { canWrite: boolean }) {
  const answers = (useQuery(api.app.listAssessment) as Doc<"assessmentAnswers">[] | undefined);
  const upsert = useMutation(api.app.upsertAssessment);
  const bulk = useMutation(api.app.importAssessment);
  const byCode = useMemo(() => new Map((answers ?? []).map((a) => [a.code, a])), [answers]);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(""); const [saveMessage, setSaveMessage] = useState("");
  const groups = [...new Set(CHECKLIST.map((c) => c.group))];
  const pts = CHECKLIST.reduce((s, c) => { const a = byCode.get(c.code)?.answer; return s + (a === "yes" ? 1 : a === "partial" ? 0.5 : 0); }, 0);
  const score = pct(pts, CHECKLIST.length);
  const cols: Col[] = [{ key: "code", label: "Mã" }, { key: "group", label: "Nhóm" }, { key: "text", label: "Tiêu chí" }, { key: "answer", label: "Trả lời", type: "select", options: ANSWERS }, { key: "note", label: "Ghi chú / bằng chứng" }];
  const rows = CHECKLIST.map((c) => ({ ...c, answer: byCode.get(c.code)?.answer ?? "unknown", note: byCode.get(c.code)?.note ?? "" }));
  const save = async (code: string, patch: Partial<{ answer: string; note: string }>) => {
    const ex = byCode.get(code);
    const data = { code, answer: (patch.answer ?? ex?.answer ?? "unknown") as "yes" | "partial" | "no" | "unknown", note: patch.note ?? ex?.note ?? "" };
    setPendingCode(code); setSaveError(""); setSaveMessage("");
    try {
      await upsert(ex ? { id: ex._id, expectedVersion: ex._version, data } : { data });
      setSaveMessage(`Đã lưu ${code}.`);
      if (patch.note !== undefined) setNoteDraft((previous) => { const next = { ...previous }; delete next[code]; return next; });
    } catch (error) { setSaveError(`Chưa lưu được ${code}: ${displayError(error)}`); } finally { setPendingCode(null); }
  };
  return (
    <section className="screen">
      <header className="screen-head"><div><h2>Đánh giá mức sẵn sàng ESG</h2><p className="text-secondary">25 tiêu chí rút từ kế hoạch khởi động. Đây là tự đánh giá hệ thống quản lý, không phải điểm ESG hay chứng nhận.</p></div>
        <div className={`card stat ${score >= 70 ? "good" : score >= 40 ? "warn" : "bad"}`}><span className="text-label">Điểm sẵn sàng</span><strong>{score}%</strong></div></header>
      <div className="card toolbar"><ImportExportBar cols={cols} rows={rows} fileName="Danh_gia_san_sang_ESG" canWrite={canWrite}
        bulk={async (rs) => { const invalid = rs.find((row) => !CHECKLIST.some((criterion) => criterion.code === row.code)); if (invalid) throw new Error(`Mã tiêu chí không hợp lệ: ${String(invalid.code)}`); const valid = rs.map((row) => ({ code: String(row.code), answer: row.answer as "yes" | "partial" | "no" | "unknown", note: String(row.note ?? "") })); const result = await bulk({ rows: valid }); setNoteDraft({}); return result as { inserted: number; updated: number }; }} /></div>
      {saveError && <p className="error-text" role="alert">{saveError}</p>}{(pendingCode || saveMessage) && <p className="text-small text-secondary" role="status">{pendingCode ? `Đang lưu ${pendingCode}…` : saveMessage}</p>}
      {groups.map((g) => {
        const items = CHECKLIST.filter((c) => c.group === g); const gp = items.reduce((s, c) => { const a = byCode.get(c.code)?.answer; return s + (a === "yes" ? 1 : a === "partial" ? 0.5 : 0); }, 0);
        return (<div key={g} className="card"><div className="row between"><h3>{g}</h3><span className="text-secondary">{pct(gp, items.length)}%</span></div><div className="bar"><div style={{ width: `${pct(gp, items.length)}%` }} /></div>
          {items.map((c) => { const a = byCode.get(c.code); return (
            <div key={c.code} className="check-item"><div><strong>{c.code}</strong> {c.text}<div className="text-small text-muted">{c.help}</div></div>
              <div className="row gap"><select className="input" aria-label={`Trả lời tiêu chí ${c.code}`} disabled={!canWrite || pendingCode === c.code} value={a?.answer ?? "unknown"} onChange={(e) => save(c.code, { answer: e.target.value })}>{ANSWERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                <input className="input" aria-label={`Ghi chú / bằng chứng ${c.code}`} disabled={!canWrite || pendingCode === c.code} placeholder="Ghi chú / mã bằng chứng" value={noteDraft[c.code] ?? a?.note ?? ""} onChange={(e) => setNoteDraft((prev) => ({ ...prev, [c.code]: e.target.value }))} onBlur={(e) => { if (e.target.value !== (a?.note ?? "")) void save(c.code, { note: e.target.value }); }} /></div></div>); })}
        </div>);
      })}
    </section>
  );
}

function DataScreen({ canWrite }: { canWrite: boolean }) {
  const session = useAppSession();
  const canReview = Boolean(session.capabilities.review || session.capabilities.admin);
  const kpis = useQuery(api.app.listKpis) as Doc<"kpis">[] | undefined;
  const records = useQuery(api.app.listDataRecords) as Doc<"dataRecords">[] | undefined;
  const lock = useMutation(api.app.lockPeriod);
  const review = useMutation(api.app.reviewDataRecord);
  const [tab, setTab] = useState<"records" | "kpis">("records");
  const [period, setPeriod] = useState(thisPeriod());
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [reviewReasons, setReviewReasons] = useState<Record<string, string>>({});
  const periodRecords = (records ?? []).filter((row) => periodMatches(row.period, period));
  const kpiOpts = (kpis ?? []).slice().sort((a, b) => a.code.localeCompare(b.code)).map((k) => ({ value: k.code, label: `${k.code} – ${k.name} (${k.unit})` }));
  const recCols: Col[] = [
    { key: "period", label: "Kỳ (YYYY-MM)", required: true, help: "Kỳ tháng, ví dụ 2026-10" }, { key: "date", label: "Ngày phát sinh", type: "date" }, { key: "facility", label: "Mã cơ sở", required: true },
    { key: "department", label: "Phòng ban", type: "select", options: DEPT_OPTS, filter: true }, { key: "kpiCode", label: "Mã KPI", type: kpiOpts.length ? "select" : "text", options: kpiOpts.length ? kpiOpts : undefined, required: true, filter: true },
    { key: "source", label: "Nguồn / đồng hồ / lô", required: true }, { key: "value", label: "Giá trị", type: "nullable-number", help: "Để trống khi thiếu hoặc không áp dụng; tỷ lệ ghi thêm tử số, mẫu số." }, { key: "unit", label: "Đơn vị", required: true }, { key: "scope", label: "Phạm vi", table: false },
    { key: "numerator", label: "Tử số (KPI tỷ lệ)", type: "nullable-number", help: "Số đếm hoặc lượng thực tế cùng cơ sở với mẫu số." }, { key: "denominator", label: "Mẫu số (KPI tỷ lệ)", type: "nullable-number", help: "Lớn hơn 0; hệ thống tính tỷ lệ từ tổng tử và mẫu, không cộng phần trăm." },
    { key: "status", label: "Trạng thái dữ liệu", type: "select", options: STATUS_DATA, filter: true }, { key: "evidenceCode", label: "Mã bằng chứng", help: "VD 2026-10_CS01_E01_DONGHO01_v01. Lưu tài liệu gốc tại kho có kiểm soát quyền." },
    { key: "note", label: "Ghi chú / phương pháp / lý do thiếu", type: "textarea", table: false },
    { key: "reviewState", label: "Soát xét", type: "select", options: REVIEW_STATES, readonly: true, filter: true }, { key: "preparedBy", label: "Người lập (hệ thống)", readonly: true }, { key: "approvedBy", label: "Người duyệt (hệ thống)", readonly: true }, { key: "locked", label: "Đã khóa", type: "boolean", readonly: true },
  ];
  const kpiCols: Col[] = [{ key: "code", label: "Mã", required: true }, { key: "name", label: "Tên KPI", required: true }, { key: "pillar", label: "Trụ cột", type: "select", options: PILLAR, filter: true }, { key: "unit", label: "Đơn vị", required: true }, { key: "aggregation", label: "Cách tổng hợp", type: "select", options: AGGREGATIONS, required: true, filter: true }, { key: "rule", label: "Quy tắc tính", type: "textarea", help: "Cộng dồn, cuối kỳ, tỷ lệ từ tử/mẫu hoặc chỉ thuyết minh. Ghi ranh giới và phương pháp." }, { key: "owner", label: "Chủ dữ liệu" }, { key: "frequency", label: "Nhịp" }, { key: "target", label: "Mục tiêu" }, { key: "note", label: "Ghi chú", type: "textarea", table: false }];
  const changeLock = async (locked: boolean) => {
    setErr(""); setMsg(""); setBusy(true);
    try {
      if (!reason.trim()) throw new Error("Ghi lý do trước khi khóa hoặc mở lại kỳ dữ liệu.");
      const result = await lock({ period, locked, reason: reason.trim() });
      setMsg(`${locked ? "Đã khóa" : "Đã mở lại"} kỳ ${period}${typeof result === "number" ? ` (${result} bản ghi)` : ""}. Hành động được ghi vào nhật ký.`);
      if (!locked) setReason("");
    } catch (ex) { setErr(displayError(ex)); } finally { setBusy(false); }
  };
  const reviewRecord = async (row: Doc<"dataRecords">, decision: "approved" | "rejected") => {
    setBusy(true); setErr(""); setMsg("");
    try {
      const note = (reviewReasons[row._id] ?? "").trim();
      if (!note) throw new Error("Ghi kết quả soát xét / lý do trước khi duyệt hoặc yêu cầu sửa.");
      await review({ id: row._id, expectedVersion: row._version, decision, reason: note });
      setMsg(`${decision === "approved" ? "Đã duyệt" : "Đã trả lại"} bản ghi ${row.kpiCode} / ${row.source}.`);
    } catch (ex) { setErr(displayError(ex)); } finally { setBusy(false); }
  };
  return <section className="screen">
    <div className="tabs" aria-label="Nhóm dữ liệu"><button aria-pressed={tab === "records"} className={tab === "records" ? "active" : ""} onClick={() => setTab("records")}>Nhật ký dữ liệu</button><button aria-pressed={tab === "kpis"} className={tab === "kpis" ? "active" : ""} onClick={() => setTab("kpis")}>Từ điển KPI</button></div>
    {tab === "kpis" ? <CrudScreen key="kpis" title="Từ điển KPI" intro="Định nghĩa, đơn vị chuẩn, quy tắc tổng hợp, chủ dữ liệu và nhịp nộp cho từng chỉ tiêu. Excel nhập bản ghi mới sau khi xem trước; chỉnh chỉ tiêu đã có trong ứng dụng để giữ lịch sử." cols={kpiCols} fns={F.kpis} fileName="Tu_dien_KPI" canWrite={canWrite} defaults={{ pillar: "E", aggregation: "sum" }} /> : <>
      <div className="card period-controls"><label className="field"><span className="text-label">Kỳ soát xét</span><input className="input" aria-label="Kỳ soát xét dữ liệu" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="YYYY-MM / YYYY-Q1 / YYYY" /></label>
        {canReview && <><label className="field grow"><span className="text-label">Lý do khóa / mở lại kỳ</span><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ghi lý do để lưu nhật ký" /></label><div className="row wrap"><button className="button button-primary" disabled={busy || !reason.trim()} onClick={() => changeLock(true)}>Khóa kỳ đã duyệt</button><button className="button" disabled={busy || !reason.trim()} onClick={() => changeLock(false)}>Mở lại kỳ</button></div></>}
      </div>
      {err && <p className="error-text" role="alert">{err}</p>}{msg && <p className="text-secondary" role="status">{msg}</p>}
      <CrudScreen key="dataRecords" title="Thu thập & cập nhật dữ liệu" intro="Mỗi dòng gắn cơ sở, kỳ, nguồn và bằng chứng. Bản ghi mới chờ người soát xét; người nhập không tự duyệt. Sửa bản ghi đã duyệt yêu cầu soát xét lại. Kỳ khóa được bảo vệ tại dịch vụ dữ liệu." cols={recCols} fns={F.data} fileName="Nhat_ky_du_lieu_ESG" canWrite={canWrite} defaults={{ period: thisPeriod(), department: DEPARTMENTS[0], status: "measured", numerator: null, denominator: null }} rowClass={(row) => row.locked ? "row-locked" : ""}
        summary={() => <><Stat label={`Bản ghi kỳ ${period}`} value={periodRecords.length} /><Stat label="Đã duyệt & khóa" value={periodRecords.filter((row) => row.reviewState === "approved" && row.locked).length} tone="good" /><Stat label="Chờ soát xét" value={periodRecords.filter((row) => row.reviewState === "pending").length} tone="warn" /><Stat label="Thiếu / không áp dụng" value={periodRecords.filter((row) => row.status === "missing" || row.status === "na").length} tone="warn" /></>} />
      <div className="card"><h3>Trạng thái soát xét kỳ {period}</h3><p className="text-small text-secondary">Người thực hiện và thời điểm được hệ thống ghi nhận. {session.mode === "sandbox" ? "Chế độ thử nghiệm mô phỏng người soát xét riêng; không phải phê duyệt doanh nghiệp thực." : "Phê duyệt dùng tài khoản người soát xét độc lập."}</p>
        {records === undefined ? <p className="empty">Đang tải…</p> : !periodRecords.length ? <p className="empty">Chưa có bản ghi cho kỳ này.</p> : <div className="table-wrap"><table className="tbl"><caption className="sr-only">Bản ghi và kết quả soát xét</caption><thead><tr><th scope="col">KPI / Nguồn</th><th scope="col">Cơ sở</th><th scope="col">Dữ liệu</th><th scope="col">Soát xét</th><th scope="col">Người lập / duyệt</th><th scope="col">Khóa</th>{canReview && <th scope="col">Hành động</th>}</tr></thead><tbody>{periodRecords.map((row) => <tr key={row._id}>
          <td>{row.kpiCode}<div className="text-small text-muted">{row.source}</div></td><td>{row.facility}</td><td>{row.value === null ? "—" : row.value} {row.unit}<div className="text-small">{STATUS_DATA.find((it) => it.value === row.status)?.label}</div></td><td><span className={`pill pill-${row.reviewState}`}>{REVIEW_STATES.find((it) => it.value === row.reviewState)?.label ?? "Chờ soát xét"}</span>{row.reviewReason && <div className="text-small">{row.reviewReason}</div>}</td><td className="text-small">{row.preparedBy || "—"}<br />{row.reviewedBy || "—"}</td><td>{row.locked ? "Đã khóa" : "Chưa khóa"}</td>
          {canReview && <td>{!row.locked && row.reviewState !== "approved" && <div className="review-actions"><input className="input" aria-label={`Ghi chú soát xét ${row.kpiCode} ${row.source}`} placeholder="Ghi chú / lý do cần sửa" value={reviewReasons[row._id] ?? ""} onChange={(e) => setReviewReasons((prev) => ({ ...prev, [row._id]: e.target.value }))} /><div className="row wrap"><button className="button small" disabled={busy || !(reviewReasons[row._id] ?? "").trim()} onClick={() => reviewRecord(row, "approved")}>Duyệt</button><button className="button small danger" disabled={busy || !(reviewReasons[row._id] ?? "").trim()} onClick={() => reviewRecord(row, "rejected")}>Yêu cầu sửa</button></div></div>}</td>}
        </tr>)}</tbody></table></div>}
      </div>
    </>}
  </section>;
}

function GhgScreen({ canWrite }: { canWrite: boolean }) {
  const [period, setPeriod] = useState(thisPeriod());
  const [method, setMethod] = useState<"location" | "market">("location");
  const allRows = useQuery(api.app.listGhg) as Doc<"ghgEntries">[] | undefined;
  const periodRows = (allRows ?? []).filter((row) => periodMatches(row.period, period));
  const rows = periodRows.filter((row) => row.scope !== "2" || row.scope2Method === method);
  const scope2Sum = (scope2Method: string) => periodRows.filter((row) => row.scope === "2" && row.scope2Method === scope2Method).reduce((total, row) => total + row.activity * row.factor / 1000, 0);
  const cols: Col[] = [{ key: "period", label: "Kỳ (YYYY-MM hoặc YYYY)", required: true }, { key: "facility", label: "Mã cơ sở", required: true }, { key: "scope", label: "Scope", type: "select", options: SCOPE_OPTS, filter: true }, { key: "scope2Method", label: "Phương pháp Scope 2", type: "select", options: SCOPE2_METHODS, required: true, filter: true, help: "Scope 2 chọn địa điểm hoặc thị trường. Scope 1 / 3 tự ghi không áp dụng khi lưu." }, { key: "category", label: "Nhóm nguồn", required: true, help: "VD: Lò hơi, Điện lưới, Vận tải thượng nguồn (Scope 3 nhóm 4)" }, { key: "source", label: "Nguồn / thiết bị", required: true }, { key: "activity", label: "Lượng hoạt động", type: "number", required: true }, { key: "unit", label: "Đơn vị hoạt động", required: true, help: "kWh, L, kg, Nm3, tấn·km" }, { key: "factor", label: "Hệ số (kgCO2e/đơn vị)", type: "number", required: true }, { key: "factorSource", label: "Nguồn hệ số (nguồn, năm, phiên bản)", required: true }, { key: "tco2e", label: "tCO2e", type: "number", readonly: true, help: "Dịch vụ dữ liệu tự tính; không sửa kết quả thủ công." }, { key: "status", label: "Trạng thái", type: "select", options: [{ value: "measured", label: "Đo thực" }, { value: "estimated", label: "Ước tính" }] }, { key: "note", label: "Ghi chú / ranh giới / phương pháp", type: "textarea", table: false }];
  const sum = (scope: string) => rows.filter((row) => row.scope === scope).reduce((total, row) => total + row.activity * row.factor / 1000, 0);
  const fmt = (value: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 6 }).format(value);
  return <section className="screen">
    <div className="card period-controls"><label className="field"><span className="text-label">Kỳ kiểm kê</span><input className="input" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="YYYY / YYYY-MM / YYYY-Q1" /></label><label className="field"><span className="text-label">Scope 2 dùng trong tổng</span><select className="input" value={method} onChange={(event) => setMethod(event.target.value as "location" | "market")}><option value="location">Theo địa điểm (location-based)</option><option value="market">Theo thị trường (market-based)</option></select></label><p className="text-small text-secondary">Tổng dưới đây chỉ dùng kỳ được chọn. Không cộng số liệu của các năm vào cùng tổng. Hai phương pháp Scope 2 trình bày riêng; tổng chỉ dùng phương pháp được chọn để tránh cộng trùng. Kiểm tra trùng nguồn và ranh giới trước khi công bố.</p></div>
    <div className="stats"><Stat label="Scope 1 (tCO2e)" value={fmt(sum("1"))} /><Stat label="Scope 2 địa điểm (tCO2e)" value={fmt(scope2Sum("location"))} /><Stat label="Scope 2 thị trường (tCO2e)" value={fmt(scope2Sum("market"))} /><Stat label="Scope 3 (tCO2e)" value={fmt(sum("3"))} /><Stat label={`Tổng ${period} · Scope 2 ${method === "location" ? "địa điểm" : "thị trường"}`} value={fmt(sum("1") + sum("2") + sum("3"))} /><Stat label="Bản ghi ước tính" value={rows.filter((row) => row.status === "estimated").length} tone="warn" /></div>
    <CrudScreen key="ghg" title="Kiểm kê khí nhà kính (Scope 1, 2, 3)" intro="tCO2e được tính tại dịch vụ dữ liệu từ lượng hoạt động × hệ số / 1.000; không nhập kết quả thủ công. Ghi nguồn, năm, địa lý và phiên bản hệ số; xác lập ranh giới tổ chức và vận hành trước khi dùng kết quả." cols={cols} fns={F.ghg} transform={(row) => ({ ...row, scope2Method: row.scope === "2" ? row.scope2Method : "not_applicable" })} fileName="Kiem_ke_KNK" canWrite={canWrite} defaults={{ period: thisPeriod(), scope: "2", scope2Method: "location", status: "measured" }} />
    {rows.length > 0 && <div className="card"><div className="row between wrap"><h3>Kết quả tính của kỳ {period}</h3><button className="button" onClick={() => downloadXlsx(`KNK_${period}`, [{ name: "KNK_ky", rows: [["Kỳ", "Cơ sở", "Scope", "Phương pháp Scope 2", "Nhóm", "Nguồn", "Lượng hoạt động", "Đơn vị", "Hệ số kgCO2e/đơn vị", "Nguồn hệ số", "tCO2e", "Trạng thái", "Ghi chú"], ...rows.map((row) => [row.period, row.facility, row.scope, row.scope2Method, row.category, row.source, row.activity, row.unit, row.factor, row.factorSource, row.activity * row.factor / 1000, row.status, row.note])] }])}>Xuất kết quả kỳ</button></div><div className="table-wrap"><table className="tbl"><thead><tr><th scope="col">Nguồn / cơ sở</th><th scope="col">Scope / phương pháp</th><th scope="col">tCO2e tự tính</th><th scope="col">Nguồn hệ số</th></tr></thead><tbody>{rows.map((row) => <tr key={row._id}><td>{row.source}<div className="text-small">{row.facility}</div></td><td>{row.scope}<div className="text-small">{SCOPE2_METHODS.find((item) => item.value === row.scope2Method)?.label}</div></td><td>{fmt(row.activity * row.factor / 1000)}</td><td>{row.factorSource}</td></tr>)}</tbody></table></div></div>}
  </section>;
}

function ReportsScreen({ canWrite, go }: { canWrite: boolean; go: (route: string) => void }) {
  const session = useAppSession();
  const canReview = Boolean(session.capabilities.review || session.capabilities.admin);
  const [period, setPeriod] = useState(thisPeriod()); const [selectedReport, setSelectedReport] = useState("");
  const publish = useMutation(api.app.upsertReport);
  const [publishBusy, setPublishBusy] = useState(false); const [publishError, setPublishError] = useState("");
  const records = useQuery(api.app.listDataRecords) as Doc<"dataRecords">[] | undefined;
  const kpis = useQuery(api.app.listKpis) as Doc<"kpis">[] | undefined;
  const reports = useQuery(api.app.listReports) as Doc<"reports">[] | undefined;
  const periodRecords = (records ?? []).filter((row) => periodMatches(row.period, period));
  const cols: Col[] = [{ key: "code", label: "Mã báo cáo", required: true, help: "VD BC-2026-10" }, { key: "title", label: "Tiêu đề", required: true }, { key: "type", label: "Loại", type: "select", options: REPORT_TYPE, filter: true }, { key: "period", label: "Kỳ", required: true, help: "Tháng YYYY-MM; quý YYYY-Q1..Q4; năm YYYY." }, { key: "status", label: "Trạng thái", type: "select", options: REPORT_STATUS.filter((status) => status.value === "draft" || status.value === "review"), filter: true },
    { key: "summary", label: "Tóm tắt điều hành", type: "textarea" }, { key: "kpiSummary", label: "KPI kỳ này và lũy kế", type: "textarea", table: false }, { key: "comparison", label: "So với mục tiêu / năm cơ sở", type: "textarea", table: false }, { key: "risks", label: "Rủi ro và CAPA quá hạn", type: "textarea", table: false }, { key: "missingData", label: "Dữ liệu thiếu / ước tính / loại trừ", type: "textarea", table: false }, { key: "projects", label: "Dự án và chi phí", type: "textarea", table: false }, { key: "decisions", label: "Quyết định cần BGĐ", type: "textarea", table: false }, { key: "preparedBy", label: "Người lập (hệ thống)", readonly: true }, { key: "approvedBy", label: "Người duyệt (hệ thống)", readonly: true }, { key: "publishedAt", label: "Ngày phát hành", type: "date", readonly: true }];
  const candidates = (reports ?? []).filter((report) => report.period === period);
  const report = candidates.find((item) => item._id === selectedReport) ?? candidates[0];
  const viewRecords = (report?.snapshot?.records ?? records ?? []) as unknown as Doc<"dataRecords">[];
  const viewKpis = (report?.snapshot?.kpis ?? kpis ?? []) as unknown as Doc<"kpis">[];
  const byKpi = useMemo(() => aggregateRecords(viewRecords, viewKpis, { period, official: true }), [viewRecords, viewKpis, period]);
  const readiness = useMemo(() => reportReadiness(viewRecords, viewKpis, period), [viewRecords, viewKpis, period]);
  const changeReportStatus = async (status: "approved" | "published") => {
    if (!report) return;
    setPublishBusy(true); setPublishError("");
    try { await publish({ id: report._id, expectedVersion: report._version, data: { ...report, status } }); }
    catch (error) { setPublishError(displayError(error)); } finally { setPublishBusy(false); }
  };
  const exportSnapshot = () => {
    const snapshot = report?.snapshot;
    const sourceRecords = (snapshot?.records ?? periodRecords) as unknown as Doc<"dataRecords">[];
    const sourceKpis = (snapshot?.kpis ?? kpis ?? []) as unknown as Doc<"kpis">[];
    const summary = aggregateRecords(sourceRecords, sourceKpis, { period, official: true });
    downloadXlsx(`Bao_cao_ESG_${report?.code ?? period}`, [
      { name: "Bao_cao", rows: [["Mục", "Nội dung"], ["Nguồn dữ liệu", snapshot ? "Phiên bản dữ liệu đã chốt khi duyệt / phát hành" : "Dự thảo từ dữ liệu hiện tại; chưa chốt phiên bản"], ["Phiên bản", snapshot?.version ?? ""], ["Thời điểm chốt", snapshot?.generatedAt ? new Date(snapshot.generatedAt).toISOString() : ""], ...(report ? cols.map((col) => [col.label, col.type === "select" ? (col.options?.find((option) => option.value === (report as Record<string, unknown>)[col.key])?.label ?? String((report as Record<string, unknown>)[col.key] ?? "")) : String((report as Record<string, unknown>)[col.key] ?? "")]) : [["Kỳ", period], ["Ghi chú", "Chưa có báo cáo cho kỳ này"]])] },
      { name: "KPI_ky", rows: [["Mã KPI", "Tên", "Cách tổng hợp", "Giá trị đủ điều kiện", "Đơn vị", "Bản ghi", "Đã duyệt & khóa", "Đo thực", "Ước tính", "Thiếu", "Không áp dụng", "Cảnh báo"], ...summary.map((row) => [row.code, row.name, row.aggregation, row.value, row.unit, row.count, row.eligibleCount, row.measured, row.estimated, row.missing, row.notApplicable, row.issues.join("; ")])] },
      { name: "Ban_ghi", rows: [["Kỳ", "Ngày", "Cơ sở", "Phòng ban", "Mã KPI", "Nguồn", "Giá trị", "Tử số", "Mẫu số", "Đơn vị", "Trạng thái", "Bằng chứng", "Người lập", "Người kiểm", "Người duyệt", "Soát xét", "Đã khóa"], ...sourceRecords.map((row) => [row.period, row.date, row.facility, row.department, row.kpiCode, row.source, row.value, row.numerator, row.denominator, row.unit, row.status, row.evidenceCode, row.preparedBy, row.checkedBy, row.approvedBy, row.reviewState, row.locked ? "TRUE" : "FALSE"])] },
      { name: "KNK", rows: [["Kỳ", "Cơ sở", "Scope", "Phương pháp Scope 2", "Nhóm", "Nguồn", "Hoạt động", "Đơn vị", "Hệ số", "Nguồn hệ số", "tCO2e", "Trạng thái", "Ghi chú"], ...(snapshot?.ghg ?? []).map((row) => { const item = row as Record<string, string | number | null>; return [item.period, item.facility, item.scope, item.scope2Method, item.category, item.source, item.activity, item.unit, item.factor, item.factorSource, item.tco2e, item.status, item.note]; })] },
    ]);
  };
  return <section className="screen">
    <div className="card resource-launcher"><h2>Tài liệu biên soạn báo cáo</h2><p className="text-secondary">Hoàn thiện nội dung theo khung bên cạnh số liệu được chốt ở màn hình này.</p><div className="row wrap gap"><button className="button" onClick={() => go("report-kit")}>Khung báo cáo ESG</button><button className="button" onClick={() => go("report-example")}>Báo cáo tham chiếu</button><button className="button" onClick={() => go("guide")}>Hướng dẫn & sơ đồ</button></div></div>
    <div className="report-registry"><CrudScreen key="reports" title="Ghi nhận báo cáo" intro="Lập dự thảo, ghi rõ dữ liệu thiếu và phương pháp. Người soát xét duyệt / phát hành sau khi dữ liệu được duyệt và kỳ được khóa. Dịch vụ dữ liệu chốt phiên bản số liệu; bản đã duyệt / phát hành không bị thay đổi theo dữ liệu nhập sau." cols={cols} fns={F.reports} fileName="Bao_cao_ESG" canWrite={canWrite} defaults={{ type: "monthly", period: thisPeriod(), status: "draft" }} /></div>
    {publishError && <p className="error-text" role="alert">{publishError}</p>}
    <div className="card report-document"><div className="row between wrap gap"><h3>{report ? `${report.code} – ${report.title}` : "Số liệu phục vụ báo cáo"}</h3><div className="row wrap gap"><label className="field"><span className="text-small">Kỳ báo cáo</span><input className="input" value={period} onChange={(e) => { setPeriod(e.target.value); setSelectedReport(""); }} placeholder="YYYY-MM / YYYY-Q1 / YYYY" /></label>{candidates.length > 0 && <label className="field"><span className="text-small">Báo cáo để xuất</span><select className="input" value={report?._id ?? ""} onChange={(e) => setSelectedReport(e.target.value)}>{candidates.map((item) => <option key={item._id} value={item._id}>{item.code} – {item.title}</option>)}</select></label>}{canReview && report && (report.status === "draft" || report.status === "review") && <button className="button button-primary" disabled={publishBusy || !readiness.ready} onClick={() => changeReportStatus("approved")}>{publishBusy ? "Đang duyệt…" : "Duyệt & chốt báo cáo"}</button>}{canReview && report?.status === "approved" && <button className="button button-primary" disabled={publishBusy} onClick={() => changeReportStatus("published")}>{publishBusy ? "Đang phát hành…" : "Phát hành bản đã duyệt"}</button>}<button className="button" onClick={() => window.print()}>In / lưu PDF</button><button className="button" disabled={records === undefined || kpis === undefined} onClick={exportSnapshot}>Xuất {report?.snapshot ? "bản đã chốt" : "dự thảo kỳ"} (.xlsx)</button></div></div>
      <p className="report-period">Kỳ {period}{report ? ` · ${REPORT_STATUS.find((item) => item.value === report.status)?.label ?? report.status}` : " · Dự thảo số liệu"}</p>
      {report && <div className="report-narrative">{cols.filter((col) => col.type === "textarea").map((col) => { const text = String((report as Record<string, unknown>)[col.key] ?? ""); return text ? <section key={col.key}><h4>{col.label}</h4><p>{text}</p></section> : null; })}</div>}
      <p className="text-small text-secondary">Số liệu chính thức chỉ gồm bản ghi đã duyệt và khóa. Tỷ lệ dùng tổng tử / mẫu; đơn vị không đồng nhất và KPI chỉ thuyết minh không tạo tổng.</p>
      {!readiness.ready && <div className="quality-notice" role="status"><strong>{report?.snapshot ? "Các giới hạn chất lượng trong phiên bản đã chốt." : "Kỳ này cần xử lý trước khi công bố."}</strong><ul>{readiness.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div>}
      {report?.snapshot && <p className="snapshot-note">Báo cáo {report.code} có phiên bản dữ liệu {report.snapshot.version}, chốt lúc {new Date(report.snapshot.generatedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}. Tệp xuất sử dụng phiên bản này.</p>}
      {records === undefined || kpis === undefined ? <p className="empty">Đang tải…</p> : !byKpi.length ? <p className="empty">Chưa có KPI hoặc dữ liệu cho kỳ {period}.</p> : <div className="table-wrap"><table className="tbl"><caption className="sr-only">Giá trị KPI đủ điều kiện và cảnh báo chất lượng</caption><thead><tr><th scope="col">KPI</th><th scope="col">Cách tổng hợp</th><th scope="col">Giá trị</th><th scope="col">Đơn vị</th><th scope="col">Đủ điều kiện / tổng</th><th scope="col">Chất lượng / cảnh báo</th></tr></thead><tbody>{byKpi.map((row) => <tr key={row.code}><td>{row.code}<div className="text-small text-muted">{row.name}</div></td><td>{AGGREGATIONS.find((item) => item.value === row.aggregation)?.label}</td><td>{row.value === null ? "—" : new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 6 }).format(row.value)}</td><td>{row.unit}</td><td>{row.eligibleCount}/{row.count}</td><td>{row.issues.length ? <ul className="issue-list">{row.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : row.status === "ready" ? "Đủ điều kiện tính" : row.status === "not_applicable" ? "Không áp dụng" : "Chỉ thuyết minh / chưa đủ dữ liệu"}</td></tr>)}</tbody></table></div>}
    </div>
  </section>;
}

function RoadmapScreen({ canWrite }: { canWrite: boolean }) {
  const [tab, setTab] = useState<"roadmap" | "tasks">("roadmap");
  const rmCols: Col[] = [{ key: "code", label: "Mã", required: true }, { key: "quarter", label: "Quý", required: true, help: "VD 2027-Q1" }, { key: "title", label: "Mốc", required: true }, { key: "description", label: "Nội dung", type: "textarea" }, { key: "leads", label: "Chủ trì" }, { key: "acceptance", label: "Tiêu chí nghiệm thu", type: "textarea" }, { key: "status", label: "Trạng thái", type: "select", options: RM_STATUS, filter: true }, { key: "note", label: "Ghi chú", table: false }];
  const tCols: Col[] = [{ key: "code", label: "Mã", required: true }, { key: "department", label: "Phòng ban", type: "select", options: DEPT_OPTS, filter: true }, { key: "title", label: "Đầu việc", required: true, type: "textarea" }, { key: "frequency", label: "Nhịp" }, { key: "evidence", label: "Bằng chứng nghiệm thu", type: "textarea" }, { key: "owner", label: "Người chính" }, { key: "backup", label: "Người thay thế" }, { key: "status", label: "Trạng thái", type: "select", options: TASK_STATUS, filter: true }, { key: "due", label: "Hạn", type: "date" }, { key: "note", label: "Ghi chú", table: false }];
  return (
    <section className="screen">
      <div className="tabs" aria-label="Kế hoạch triển khai"><button aria-pressed={tab === "roadmap"} className={tab === "roadmap" ? "active" : ""} onClick={() => setTab("roadmap")}>Lộ trình 2026–2030</button><button aria-pressed={tab === "tasks"} className={tab === "tasks" ? "active" : ""} onClick={() => setTab("tasks")}>Giao việc phòng ban</button></div>
      {tab === "roadmap" ? <CrudScreen key="roadmap" title="Lộ trình 17 quý (Q4/2026 – Q4/2030)" intro="Mỗi quý có mốc, chủ trì và tiêu chí nghiệm thu. Hạn pháp luật và hạn khách hàng được ưu tiên nếu đến trước." cols={rmCols} fns={F.roadmap} fileName="Lo_trinh_ESG" canWrite={canWrite} defaults={{ status: "planned" }}
        summary={(rows: AnyRow[]) => <><Stat label="Mốc" value={rows.length} /><Stat label="Hoàn thành" value={rows.filter((r) => r.status === "done").length} tone="good" /><Stat label="Trễ" value={rows.filter((r) => r.status === "late").length} tone={rows.some((r) => r.status === "late") ? "bad" : ""} /></>} />
        : <CrudScreen key="tasks" title="Giao việc 13 bộ phận" intro="65 đầu việc đề xuất; nhập họ tên người chính/thay thế, trạng thái, bằng chứng và hạn." cols={tCols} fns={F.tasks} fileName="Giao_viec_ESG" canWrite={canWrite} defaults={{ department: DEPARTMENTS[0], status: "todo" }}
          summary={(rows: AnyRow[]) => <><Stat label="Đầu việc" value={rows.length} /><Stat label="Hoàn thành" value={`${pct(rows.filter((r) => r.status === "done").length, rows.length)}%`} tone="good" /><Stat label="Vướng mắc" value={rows.filter((r) => r.status === "blocked").length} tone="warn" /><Stat label="Chưa có người" value={rows.filter((r) => !String(r.owner).trim()).length} /></>} />}
    </section>
  );
}

function TopicsScreen({ canWrite }: { canWrite: boolean }) {
  const cols: Col[] = [{ key: "code", label: "Mã", required: true }, { key: "name", label: "Chủ đề", required: true }, { key: "description", label: "Nội dung tại nhà máy", type: "textarea" }, { key: "owner", label: "Chủ dữ liệu" }, { key: "severity", label: "Nghiêm trọng (0–5)", type: "number", min: 0, max: 5 }, { key: "scopeAffected", label: "Phạm vi (0–5)", type: "number", min: 0, max: 5 }, { key: "remediability", label: "Khó khắc phục (0–5)", type: "number", min: 0, max: 5 }, { key: "likelihood", label: "Khả năng xảy ra (0–5)", type: "number", min: 0, max: 5 }, { key: "stakeholders", label: "Ý kiến bên liên quan", type: "textarea", table: false }, { key: "evidence", label: "Bằng chứng", table: false }, { key: "status", label: "Kết luận", type: "select", options: TOPIC_STATUS, filter: true }, { key: "note", label: "Người đánh giá / duyệt / ngày rà lại", table: false }];
  return <CrudScreen title="Chủ đề trọng yếu (GRI 3)" intro="Chấm theo mức nghiêm trọng, phạm vi, khả năng khắc phục và khả năng xảy ra. Thang nội bộ phải mô tả rõ từng mức; không loại chủ đề chỉ vì khó thu dữ liệu." cols={cols} fns={F.topics} fileName="Chu_de_trong_yeu" canWrite={canWrite} defaults={{ status: "candidate" }}
    summary={(rows: AnyRow[]) => <><Stat label="Chủ đề" value={rows.length} /><Stat label="Trọng yếu" value={rows.filter((r) => r.status === "material").length} tone="good" /><Stat label="Đang khảo sát" value={rows.filter((r) => r.status === "candidate").length} /></>} />;
}

function CapaScreen({ canWrite }: { canWrite: boolean }) {
  const [tab, setTab] = useState<"capa" | "reqs">("capa");
  const cCols: Col[] = [{ key: "code", label: "Mã CAPA", required: true }, { key: "title", label: "Vấn đề", required: true }, { key: "source", label: "Nguồn phát hiện", help: "Audit, sự cố, khiếu nại, đối chiếu dữ liệu" }, { key: "severity", label: "Mức độ", type: "select", options: SEVERITY, filter: true }, { key: "owner", label: "Người xử lý" }, { key: "due", label: "Hạn", type: "date" }, { key: "status", label: "Trạng thái", type: "select", options: CAPA_STATUS, filter: true }, { key: "rootCause", label: "Nguyên nhân gốc", type: "textarea", table: false }, { key: "action", label: "Hành động", type: "textarea" }, { key: "evidence", label: "Bằng chứng đóng", table: false }, { key: "note", label: "Ghi chú", table: false }];
  const rCols: Col[] = [{ key: "code", label: "Mã", required: true }, { key: "layer", label: "Lớp", type: "select", options: REQ_LAYER, filter: true }, { key: "name", label: "Yêu cầu", required: true }, { key: "clause", label: "Điều khoản / việc cần làm", type: "textarea" }, { key: "deadline", label: "Hạn / kỳ nộp" }, { key: "owner", label: "Phụ trách" }, { key: "evidence", label: "Bằng chứng", table: false }, { key: "status", label: "Trạng thái", type: "select", options: REQ_STATUS, filter: true }, { key: "note", label: "Ghi chú", table: false }];
  return (
    <section className="screen">
      <div className="tabs" aria-label="Hành động và yêu cầu"><button aria-pressed={tab === "capa"} className={tab === "capa" ? "active" : ""} onClick={() => setTab("capa")}>CAPA</button><button aria-pressed={tab === "reqs"} className={tab === "reqs" ? "active" : ""} onClick={() => setTab("reqs")}>Sổ yêu cầu & nghĩa vụ</button></div>
      {tab === "capa" ? <CrudScreen key="capa" title="Hành động khắc phục & phòng ngừa (CAPA)" intro="Theo quy trình ESG 04: nguyên nhân gốc → hành động → kiểm tra hiệu lực → đóng. Người kiểm tra hiệu lực độc lập với người thực hiện." cols={cCols} fns={F.capa} fileName="CAPA_ESG" canWrite={canWrite} defaults={{ severity: "medium", status: "open" }}
        summary={(rows: AnyRow[]) => <><Stat label="Đang mở" value={rows.filter((r) => r.status === "open" || r.status === "in_progress").length} tone="warn" /><Stat label="Nghiêm trọng/Cao" value={rows.filter((r) => r.severity === "critical" || r.severity === "high").length} tone="bad" /><Stat label="Đã đóng" value={rows.filter((r) => r.status === "closed").length} tone="good" /></>} />
        : <CrudScreen key="requirements" title="Sổ yêu cầu: pháp luật – nhãn hàng – khung" intro="Ba lớp quản lý song song. Ghi điều khoản, hạn, nơi nộp và bằng chứng; chỉ tuyên bố tuân thủ khung khi đáp ứng đúng yêu cầu." cols={rCols} fns={F.reqs} fileName="So_yeu_cau_ESG" canWrite={canWrite} defaults={{ layer: "law", status: "to_check" }}
          summary={(rows: AnyRow[]) => <><Stat label="Yêu cầu" value={rows.length} /><Stat label="Cần kiểm tra" value={rows.filter((r) => r.status === "to_check").length} /><Stat label="Khoảng trống" value={rows.filter((r) => r.status === "gap").length} tone="bad" /><Stat label="Đáp ứng" value={rows.filter((r) => r.status === "compliant").length} tone="good" /></>} />}
    </section>
  );
}

function AuditScreen({ go }: { go: (route: string) => void }) {
  const rows = useQuery(api.app.listAudit) as Record<string, unknown>[] | undefined;
  const backup = useQuery(api.app.exportWorkspace);
  const [filter, setFilter] = useState("");
  const visible = (rows ?? []).filter((row) => JSON.stringify(row).toLowerCase().includes(filter.trim().toLowerCase()));
  const value = (row: Record<string, unknown>, fields: string[]) => fields.map((field) => row[field]).find((item) => item !== undefined && item !== null) ?? "";
  return <section className="screen">
    <header className="screen-head"><div><h2>Nhật ký thay đổi</h2><p className="text-secondary">Theo dõi ai nhập, sửa, soát xét, khóa hoặc mở lại kỳ. Nhật ký trong khu vực thử nghiệm lưu cùng dữ liệu của trình duyệt.</p></div><button className="button" disabled={!backup} onClick={() => downloadJson(`ESG_Hub_backup_${thisPeriod()}`, backup)}>Sao lưu JSON toàn bộ</button></header>
    <div className="card callout"><div><strong>Báo cáo audit dự án ở mục Audit & Kaizen.</strong><p>Nhật ký bên dưới ghi thao tác dữ liệu. Xem phát hiện, biện pháp cải tiến và phần còn cần triển khai trong báo cáo audit.</p></div><button className="button button-primary" onClick={() => go("project-audit")}>Xem báo cáo Audit & Kaizen</button></div>
    <label className="field"><span className="text-label">Tìm trong nhật ký</span><input className="input" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Người thực hiện, mã bản ghi hoặc hành động" /></label>
    {rows === undefined ? <div className="card empty">Đang tải nhật ký…</div> : !visible.length ? <div className="card empty">Chưa có thay đổi phù hợp.</div> : <div className="card table-wrap"><table className="tbl"><caption className="sr-only">Nhật ký thay đổi dữ liệu ESG</caption><thead><tr><th scope="col">Thời điểm</th><th scope="col">Người thực hiện</th><th scope="col">Hành động</th><th scope="col">Đối tượng</th><th scope="col">Chi tiết</th></tr></thead><tbody>{visible.map((row, index) => {
      const timestamp = value(row, ["createdAt", "timestamp", "_creationTime", "at"]);
      const date = typeof timestamp === "number" ? new Date(timestamp) : typeof timestamp === "string" ? new Date(timestamp) : null;
      return <tr key={String(row._id ?? row.id ?? index)}><td>{date && !Number.isNaN(date.getTime()) ? date.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : String(timestamp)}</td><td>{String(value(row, ["actor", "actorId", "userId", "createdBy"]))}</td><td>{String(value(row, ["action", "operation"]))}</td><td>{String(value(row, ["table", "entity", "entityType"]))}<div className="text-small text-muted">{String(value(row, ["recordId", "entityId", "targetId"]))}</div></td><td><details><summary>Xem nội dung</summary><pre className="audit-details">{JSON.stringify(row, null, 2)}</pre></details></td></tr>;
    })}</tbody></table></div>}
  </section>;
}

const NAV = [
  ["home", "Tổng quan"], ["guide", "Hướng dẫn & sơ đồ"], ["project-audit", "Audit & Kaizen"], ["qa", "Hỏi đáp"], ["learn", "Học hỏi & tìm kiếm"], ["assess", "Đánh giá sẵn sàng"], ["roadmap", "Lộ trình & giao việc"],
  ["topics", "Chủ đề trọng yếu"], ["evidence", "Sổ bằng chứng"], ["data", "Thu thập dữ liệu"], ["ghg", "Kiểm kê KNK"], ["reports", "Báo cáo"], ["report-kit", "Khung báo cáo ESG"], ["report-example", "Báo cáo tham chiếu"], ["capa", "CAPA & yêu cầu"], ["audit", "Nhật ký thay đổi"],
] as const;

export default function App() {
  const session = useAppSession();
  const canWrite = Boolean(session.capabilities.write);
  const [screen, setScreen] = useState<string>(() => NAV.some(([id]) => id === window.location.hash.slice(1)) ? window.location.hash.slice(1) : "home");
  const go = (id: string) => { setScreen(id); window.history.pushState(null, "", `#${id}`); window.scrollTo(0, 0); };
  useEffect(() => {
    const sync = () => { const id = window.location.hash.slice(1); if (NAV.some(([navId]) => navId === id)) setScreen(id); };
    window.addEventListener("hashchange", sync); window.addEventListener("popstate", sync);
    return () => { window.removeEventListener("hashchange", sync); window.removeEventListener("popstate", sync); };
  }, []);
  return (
    <div className="app-shell esg-shell">
      <a className="skip-link" href="#main-content">Đến nội dung chính</a>
      <aside className="sidebar">
        <div className="brand"><span className="logo">ESG</span><div><strong>ESG Hub</strong><div className="text-small text-muted">Nhà máy giày & rubber boots</div></div></div>
        <nav aria-label="Chức năng ESG">{NAV.map(([id, label]) => <button key={id} aria-current={screen === id ? "page" : undefined} className={screen === id ? "active" : ""} onClick={() => go(id)}>{label}</button>)}</nav>
        {!canWrite && <p className="text-small text-muted readonly">{session.capabilities.review ? "Bạn có quyền soát xét và chốt kỳ; không có quyền nhập liệu." : "Bạn có quyền xem; chưa có quyền nhập, sửa hoặc duyệt dữ liệu."}</p>}
      </aside>
      <main key={session.workspace?.id ?? "no-workspace"} id="main-content" className="content" tabIndex={-1}>
        <details className="card workspace-settings" open={session.mode === "cloud" && !session.user}>
          <summary><span><strong>{session.workspace?.name ?? "Không gian làm việc"}</strong><span className="text-small text-secondary workspace-mode">{session.mode === "sandbox" ? "Dùng thử cục bộ" : session.user ? session.user.email : "Đăng nhập để cộng tác"}</span></span><span className="text-small">Tài khoản & doanh nghiệp</span></summary>
          <WorkspacePanel />
        </details>
        {session.mode === "sandbox" && <div className="card sandbox-banner" role="status"><strong>Khu vực thử nghiệm trên trình duyệt</strong><p>Chỉ dùng dữ liệu mẫu. Dữ liệu lưu trên thiết bị này để bạn thử quy trình. Đây chưa phải kho dữ liệu doanh nghiệp dùng chung. Kết nối dịch vụ dữ liệu và đăng nhập để cộng tác trực tuyến; xuất bản sao JSON trước khi xóa dữ liệu trình duyệt.</p></div>}
        {session.error && <p className="card error-text" role="alert">{session.error}</p>}
        {screen === "home" && <Dashboard canWrite={canWrite} go={go} />}
        {screen === "guide" && <Suspense fallback={<p role="status">Đang tải hướng dẫn…</p>}><WorkflowGuide go={go} /></Suspense>}
        {["project-audit", "report-kit", "report-example"].includes(screen) && <Suspense fallback={<p role="status">Đang tải tài liệu…</p>}><ReportLibrary key={screen} kind={screen} go={go} /></Suspense>}
        {screen === "qa" && <QAScreen canWrite={canWrite} />}
        {screen === "learn" && <LearnScreen canWrite={canWrite} />}
        {screen === "assess" && <AssessScreen canWrite={canWrite} />}
        {screen === "roadmap" && <RoadmapScreen canWrite={canWrite} />}
        {screen === "topics" && <TopicsScreen canWrite={canWrite} />}
        {screen === "evidence" && <EvidenceScreen canWrite={canWrite} />}
        {screen === "data" && <DataScreen canWrite={canWrite} />}
        {screen === "ghg" && <GhgScreen canWrite={canWrite} />}
        {screen === "reports" && <ReportsScreen canWrite={canWrite} go={go} />}
        {screen === "capa" && <CapaScreen canWrite={canWrite} />}
        {screen === "audit" && <AuditScreen go={go} />}
      </main>
    </div>
  );
}
