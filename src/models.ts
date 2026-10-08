import { reportReadiness, validateDataRecord, validateGhgEntry, validateKpi } from "./esg";

export type Role = "owner" | "editor" | "reviewer" | "viewer";
export type TableName = "knowledge" | "questions" | "kpis" | "dataRecords" | "reports" | "tasks" | "roadmap" | "topics" | "capa" | "requirements" | "assessmentAnswers" | "ghgEntries" | "evidence";
export type Metadata = { _id: string; _creationTime: number; _version: number; _createdBy: string; _locked?: boolean };
export type Workspace = { id: string; name: string; role: Role };
export type ReviewState = "pending" | "approved" | "rejected";
type Rows = {
  knowledge: { title: string; category: string; summary: string; content: string; tags: string; source: string };
  questions: { question: string; answer: string; category: string; askedBy: string; status: "open" | "answered"; aiGenerated: boolean; createdAt: number };
  kpis: { code: string; name: string; pillar: "E" | "S" | "G"; unit: string; rule: string; owner: string; frequency: string; target: string; note: string; aggregation: "sum" | "last" | "ratio" | "manual" };
  dataRecords: { period: string; date: string; facility: string; department: string; kpiCode: string; source: string; value: number | null; unit: string; scope: string; status: "measured" | "estimated" | "missing" | "na"; evidenceCode: string; preparedBy: string; checkedBy: string; approvedBy: string; note: string; locked: boolean; numerator?: number | null; denominator?: number | null; reviewState: ReviewState; reviewedBy: string; reviewedAt: number; reviewReason: string };
  reports: { code: string; title: string; type: "monthly" | "quarterly" | "annual" | "other"; period: string; status: "draft" | "review" | "approved" | "published"; summary: string; kpiSummary: string; comparison: string; risks: string; missingData: string; projects: string; decisions: string; preparedBy: string; approvedBy: string; publishedAt: string; snapshot?: ReportSnapshot };
  tasks: { code: string; department: string; title: string; frequency: string; evidence: string; owner: string; backup: string; status: "todo" | "doing" | "done" | "blocked"; due: string; note: string };
  roadmap: { code: string; quarter: string; title: string; description: string; leads: string; acceptance: string; status: "planned" | "doing" | "done" | "late"; note: string };
  topics: { code: string; name: string; description: string; owner: string; severity: number; scopeAffected: number; remediability: number; likelihood: number; stakeholders: string; evidence: string; status: "candidate" | "material" | "not_material"; note: string };
  capa: { code: string; title: string; source: string; severity: "low" | "medium" | "high" | "critical"; owner: string; due: string; status: "open" | "in_progress" | "verified" | "closed"; rootCause: string; action: string; evidence: string; note: string };
  requirements: { code: string; layer: "law" | "brand" | "framework"; name: string; clause: string; deadline: string; owner: string; evidence: string; status: "to_check" | "applicable" | "compliant" | "gap" | "not_applicable"; note: string };
  assessmentAnswers: { code: string; answer: "yes" | "partial" | "no" | "unknown"; note: string };
  ghgEntries: { period: string; facility: string; scope: "1" | "2" | "3"; scope2Method: "location" | "market" | "not_applicable"; category: string; source: string; activity: number; unit: string; factor: number; factorSource: string; tco2e: number; status: "measured" | "estimated"; note: string };
  evidence: { code: string; title: string; sourceUrl: string; description: string; sha256: string; filePath: string; fileName: string; size: number; mimeType: string };
};
export type Doc<T extends TableName> = Rows[T] & Metadata;
export type AnyDoc = Metadata & Record<string, unknown>;
export type ReportSnapshot = { version: 1; period: string; generatedAt: number; records: AnyDoc[]; kpis: AnyDoc[]; ghg: AnyDoc[] };
export type AuditEvent = { _id: string; action: string; table: string; recordId: string; actor: string; timestamp: number; reason: string; old: unknown; new: unknown };
export const TABLE_NAMES: TableName[] = ["knowledge", "questions", "kpis", "dataRecords", "reports", "tasks", "roadmap", "topics", "capa", "requirements", "assessmentAnswers", "ghgEntries", "evidence"];
export const TABLE_API: Record<TableName, string[]> = {
  knowledge: ["listKnowledge", "upsertKnowledge", "removeKnowledge", "removeManyKnowledge", "importKnowledge"],
  questions: ["listQuestions", "upsertQuestion", "removeQuestion", "removeManyQuestions", "importQuestions"],
  kpis: ["listKpis", "upsertKpi", "removeKpi", "removeManyKpis", "importKpis"],
  dataRecords: ["listDataRecords", "upsertDataRecord", "removeDataRecord", "removeManyDataRecords", "importDataRecords"],
  reports: ["listReports", "upsertReport", "removeReport", "removeManyReports", "importReports"],
  tasks: ["listTasks", "upsertTask", "removeTask", "removeManyTasks", "importTasks"],
  roadmap: ["listRoadmap", "upsertRoadmap", "removeRoadmap", "removeManyRoadmap", "importRoadmap"],
  topics: ["listTopics", "upsertTopic", "removeTopic", "removeManyTopics", "importTopics"],
  capa: ["listCapa", "upsertCapa", "removeCapa", "removeManyCapa", "importCapa"],
  requirements: ["listRequirements", "upsertRequirement", "removeRequirement", "removeManyRequirements", "importRequirements"],
  assessmentAnswers: ["listAssessment", "upsertAssessment", "removeAssessment", "removeManyAssessment", "importAssessment"],
  ghgEntries: ["listGhg", "upsertGhg", "removeGhg", "removeManyGhg", "importGhg"],
  evidence: ["listEvidence", "upsertEvidence", "removeEvidence", "removeManyEvidence", "importEvidence"],
};
export const api = { app: Object.fromEntries([...Object.values(TABLE_API).flat(), "dataRecordsByPeriod", "lockPeriod", "reviewDataRecord", "seedDefaults", "listAudit", "exportWorkspace"].map((name) => [name, name])) as Record<string, string> };
type FieldType = "string" | "number" | "nullable" | "boolean" | readonly string[];
const strings = (names: string): Record<string, FieldType> => Object.fromEntries(names.split(" ").map((name) => [name, "string"]));
const SCHEMAS: Record<TableName, Record<string, FieldType>> = {
  knowledge: strings("title category summary content tags source"),
  questions: { ...strings("question answer category askedBy"), status: ["open", "answered"], aiGenerated: "boolean", createdAt: "number" },
  kpis: { ...strings("code name unit rule owner frequency target note"), pillar: ["E", "S", "G"], aggregation: ["manual", "sum", "last", "ratio"] },
  dataRecords: { ...strings("period date facility department kpiCode source unit scope evidenceCode preparedBy checkedBy approvedBy note"), value: "nullable", status: ["measured", "estimated", "missing", "na"], locked: "boolean", numerator: "nullable", denominator: "nullable" },
  reports: { ...strings("code title period summary kpiSummary comparison risks missingData projects decisions preparedBy approvedBy publishedAt"), type: ["monthly", "quarterly", "annual", "other"], status: ["draft", "review", "approved", "published"] },
  tasks: { ...strings("code department title frequency evidence owner backup due note"), status: ["todo", "doing", "done", "blocked"] },
  roadmap: { ...strings("code quarter title description leads acceptance note"), status: ["planned", "doing", "done", "late"] },
  topics: { ...strings("code name description owner stakeholders evidence note"), severity: "number", scopeAffected: "number", remediability: "number", likelihood: "number", status: ["candidate", "material", "not_material"] },
  capa: { ...strings("code title source owner due rootCause action evidence note"), severity: ["low", "medium", "high", "critical"], status: ["open", "in_progress", "verified", "closed"] },
  requirements: { ...strings("code name clause deadline owner evidence note"), layer: ["law", "brand", "framework"], status: ["to_check", "applicable", "compliant", "gap", "not_applicable"] },
  assessmentAnswers: { ...strings("code note"), answer: ["yes", "partial", "no", "unknown"] },
  ghgEntries: { ...strings("period facility category source unit factorSource note"), scope: ["1", "2", "3"], scope2Method: ["not_applicable", "location", "market"], activity: "number", factor: "number", tco2e: "number", status: ["measured", "estimated"] },
  evidence: { ...strings("code title sourceUrl description sha256 filePath fileName mimeType"), size: "number" },
};
export function blankRow(kind: TableName): Record<string, unknown> {
  return Object.fromEntries(Object.entries(SCHEMAS[kind]).map(([key, type]) => [key, Array.isArray(type) ? type[0] : type === "number" ? 0 : type === "nullable" ? null : type === "boolean" ? false : ""]));
}
export type SandboxWorkspace = { workspace: Workspace; tables: Record<TableName, AnyDoc[]>; locks: Record<string, boolean>; audit: AuditEvent[] };
export type SandboxStore = { formatVersion: 1; activeId: string; workspaces: SandboxWorkspace[] };
export type Actor = { id: string; role: Role };
function fail(message: string): never { throw new Error(message); }
const clone = <T,>(value: T): T => structuredClone(value);
export function createSandbox(name = "Không gian thử nghiệm"): SandboxStore {
  const id = crypto.randomUUID();
  return { formatVersion: 1, activeId: id, workspaces: [{ workspace: { id, name, role: "owner" }, tables: Object.fromEntries(TABLE_NAMES.map((kind) => [kind, []])) as unknown as Record<TableName, AnyDoc[]>, locks: {}, audit: [] }] };
}
export function periodRange(period: string): [number, number] | null {
  const m = /^(\d{4})(?:-(0[1-9]|1[0-2])|-Q([1-4]))?$/.exec(period);
  if (!m || Number(m[1]) < 1900 || Number(m[1]) > 9999) return null;
  const y = Number(m[1]), month = m[2] ? Number(m[2]) - 1 : m[3] ? (Number(m[3]) - 1) * 3 : 0;
  return [Date.UTC(y, month, 1), Date.UTC(y, month + (m[2] ? 1 : m[3] ? 3 : 12), 1)];
}
export function periodContains(parent: string, child: string): boolean {
  const p = periodRange(parent), c = periodRange(child);
  return !!p && !!c && p[0] <= c[0] && p[1] >= c[1];
}
export function isPeriodLocked(ws: SandboxWorkspace, period: string): boolean {
  const range = periodRange(period);
  return !!range && Object.entries(ws.locks).some(([p, locked]) => {
    const other = periodRange(p);
    return locked && !!other && other[0] < range[1] && other[1] > range[0];
  });
}
export function presentSandboxRow(ws: SandboxWorkspace, kind: TableName, row: AnyDoc): AnyDoc {
  const locked = (kind === "dataRecords" || kind === "ghgEntries") && isPeriodLocked(ws, String(row.period));
  return { ...clone(row), ...(kind === "dataRecords" ? { locked } : {}), ...(kind === "dataRecords" || kind === "ghgEntries" ? { _locked: locked } : {}) };
}
function checkVersion(row: AnyDoc, expected: unknown) {
  if (!Number.isInteger(expected) || expected !== row._version) fail("Bản ghi đã thay đổi hoặc thiếu phiên bản. Tải lại trước khi lưu.");
}
function naturalKey(kind: TableName, row: Record<string, unknown>): string | null {
  if ("code" in SCHEMAS[kind]) return JSON.stringify([row.code]);
  if (kind === "dataRecords") return JSON.stringify([row.period, row.date, row.facility, row.kpiCode, row.source]);
  if (kind === "ghgEntries") return JSON.stringify([row.period, row.facility, row.scope, row.scope2Method, row.category, row.source]);
  return null;
}
function checkWritable(ws: SandboxWorkspace, kind: TableName, row: AnyDoc) {
  if ((kind === "dataRecords" || kind === "ghgEntries") && isPeriodLocked(ws, String(row.period))) fail("Kỳ dữ liệu đã khóa. Người soát xét phải mở lại kỳ và ghi lý do.");
  if (kind === "reports" && ["approved", "published"].includes(String(row.status))) fail("Báo cáo đã duyệt/phát hành là bất biến. Tạo phiên bản báo cáo mới.");
}
function validateRow(ws: SandboxWorkspace, kind: TableName, input: Record<string, unknown>, actor: Actor): Record<string, unknown> {
  const data = blankRow(kind);
  for (const [key, type] of Object.entries(SCHEMAS[kind])) {
    if (input[key] !== undefined) data[key] = input[key];
    const value = data[key];
    if (Array.isArray(type)) { if (!type.includes(String(value))) fail(`Giá trị không hợp lệ: ${key}`); }
    else if (type === "nullable" && value === null) continue;
    else if (type === "number" || type === "nullable") { if (typeof value !== "number" || !Number.isFinite(value) || value < 0) fail(`Số phải hữu hạn và không âm: ${key}`); }
    else if (typeof value !== type) fail(`Sai kiểu dữ liệu: ${key}`);
  }
  for (const key of ["code", "kpiCode", "period", "unit", "date", "facility", "source", "category"]) if (typeof data[key] === "string") data[key] = String(data[key]).trim();
  if ("code" in data && !data.code) fail("Mã bản ghi không được để trống.");
  if (["dataRecords", "ghgEntries", "reports"].includes(kind) && !periodRange(String(data.period))) fail("Kỳ phải có dạng YYYY, YYYY-MM hoặc YYYY-Q1..Q4.");
  if (kind === "dataRecords" || kind === "ghgEntries") if (isPeriodLocked(ws, String(data.period))) fail("Không thể thêm hoặc sửa dữ liệu trong kỳ đã khóa.");
  if (kind === "kpis") { const errors = validateKpi(data); if (errors.length) fail(errors.join(" ")); }
  if (kind === "dataRecords") {
    const kpi = ws.tables.kpis.find((row) => row.code === data.kpiCode);
    if (!kpi) fail("Mã KPI chưa có trong từ điển.");
    if (data.unit !== kpi.unit) fail("Đơn vị phải trùng đơn vị trong từ điển KPI.");
    if (["measured", "estimated"].includes(String(data.status)) && data.value === null) fail("Số đo/ước tính phải có giá trị; dữ liệu thiếu phải được đánh dấu thiếu.");
    if (["missing", "na"].includes(String(data.status)) && data.value !== null) fail("Dữ liệu thiếu/không áp dụng phải để giá trị trống.");
    if (kpi.aggregation === "ratio" && ["measured", "estimated"].includes(String(data.status)) && (data.numerator === null || data.denominator === null || Number(data.denominator) <= 0)) fail("KPI tỷ lệ cần tử số và mẫu số lớn hơn 0.");
    const errors = validateDataRecord(data as any, ws.tables.kpis as any);
    if (errors.length) fail(errors.join(" "));
    Object.assign(data, { preparedBy: actor.id, checkedBy: "", approvedBy: "", locked: false, reviewState: "pending", reviewedBy: "", reviewedAt: 0, reviewReason: "" });
  }
  if (kind === "questions") Object.assign(data, { askedBy: actor.id, createdAt: Date.now() });
  if (kind === "ghgEntries") {
    const errors = validateGhgEntry(data); if (errors.length) fail(errors.join(" "));
    if (!String(data.facility).trim() || !String(data.source).trim()) fail("Kiểm kê cần mã cơ sở và nguồn hoạt động.");
    if (data.scope === "2" ? !["location", "market"].includes(String(data.scope2Method)) : data.scope2Method !== "not_applicable") fail("Scope 2 cần phương pháp theo địa điểm/thị trường; Scope 1/3 phải chọn không áp dụng.");
    if (!String(data.factorSource).trim()) fail("Phải ghi nguồn/phiên bản hệ số phát thải.");
    data.tco2e = Number(data.activity) * Number(data.factor) / 1000;
    if (!Number.isFinite(data.tco2e)) fail("Kết quả phát thải vượt giới hạn số hợp lệ.");
  }
  if (kind === "evidence") {
    if (!String(data.title).trim()) fail("Bằng chứng cần có tiêu đề.");
    if (data.sourceUrl && !/^https:\/\//i.test(String(data.sourceUrl))) fail("Nguồn bằng chứng phải là URL HTTPS.");
    if (!data.sourceUrl && !String(data.filePath).startsWith(`sandbox/${ws.workspace.id}/`)) fail("Bằng chứng cần nguồn HTTPS hoặc tệp đã tải lên.");
    if (data.sha256 && !/^[a-f0-9]{64}$/i.test(String(data.sha256))) fail("SHA-256 phải gồm 64 ký tự hex.");
    if (Number(data.size) > 10 * 1024 * 1024) fail("Tệp bằng chứng tối đa 10 MiB.");
  }
  if (kind === "reports") {
    Object.assign(data, { preparedBy: actor.id, approvedBy: "", publishedAt: "" });
    if (["approved", "published"].includes(String(data.status))) {
      if (!["owner", "reviewer"].includes(actor.role)) fail("Chỉ người soát xét/chủ workspace được duyệt báo cáo.");
      const records = ws.tables.dataRecords.filter((row) => periodContains(String(data.period), String(row.period)));
      if (!records.length || records.some((row) => row.reviewState !== "approved" || !isPeriodLocked(ws, String(row.period)))) fail("Báo cáo cần dữ liệu kỳ được phê duyệt và khóa, kể cả dữ liệu thiếu được công bố.");
      if (ws.locks[String(data.period)] !== true) fail("Phải khóa chính kỳ báo cáo trước khi duyệt/phát hành.");
      const readiness = reportReadiness(records.map((row) => presentSandboxRow(ws, "dataRecords", row)) as any, ws.tables.kpis as any, String(data.period));
      if (!readiness.ready) fail(`Báo cáo chưa đủ điều kiện phát hành: ${readiness.issues.join(" ")}`);
      Object.assign(data, { approvedBy: actor.id, publishedAt: data.status === "published" ? new Date().toISOString() : "", snapshot: { version: 1, period: data.period, generatedAt: Date.now(), records: records.map((row) => presentSandboxRow(ws, "dataRecords", row)), kpis: clone(ws.tables.kpis), ghg: ws.tables.ghgEntries.filter((row) => periodContains(String(data.period), String(row.period))).map((row) => presentSandboxRow(ws, "ghgEntries", row)) } });
    }
  }
  return data;
}
function recordAudit(ws: SandboxWorkspace, actor: Actor, action: string, kind: string, id: string, oldValue: unknown, newValue: unknown, reason = "") {
  ws.audit.unshift({ _id: crypto.randomUUID(), action, table: kind, recordId: id, actor: actor.id, timestamp: Date.now(), reason, old: clone(oldValue), new: clone(newValue) });
}
function saveRow(ws: SandboxWorkspace, kind: TableName, payload: Record<string, any>, actor: Actor): string {
  const existing = payload.id ? ws.tables[kind].find((row) => row._id === payload.id) : undefined;
  if (payload.id && !existing) fail("Không tìm thấy bản ghi trong workspace hiện tại.");
  if (existing) {
    checkVersion(existing, payload.expectedVersion);
    if (kind === "kpis" && ws.tables.dataRecords.some((row) => row.kpiCode === existing.code) && ["code", "unit", "aggregation"].some((key) => payload.data?.[key] !== existing[key])) fail("KPI đã được dùng: không thể đổi mã, đơn vị hay phương pháp tổng hợp. Tạo mã KPI mới.");
    if (kind === "evidence" && ws.tables.dataRecords.some((row) => row.evidenceCode === existing.code)) fail("Bằng chứng đã được tham chiếu nên không thể sửa nguồn. Tạo mã bằng chứng mới.");
    if (kind === "reports" && existing.status === "approved" && payload.data?.status === "published") {
      if (!["owner", "reviewer"].includes(actor.role)) fail("Chỉ người soát xét/chủ workspace được phát hành báo cáo.");
      for (const key of Object.keys(SCHEMAS.reports).filter((key) => !["status", "approvedBy", "publishedAt", "preparedBy"].includes(key))) if (payload.data[key] !== existing[key]) fail("Không thể thay đổi nội dung báo cáo đã duyệt.");
      const old = clone(existing);
      existing.status = "published"; existing.publishedAt = new Date().toISOString(); existing._version++;
      recordAudit(ws, actor, "publish", kind, existing._id, old, existing);
      return existing._id;
    }
    checkWritable(ws, kind, existing);
  }
  if (!payload.data || typeof payload.data !== "object" || Array.isArray(payload.data)) fail("Thiếu dữ liệu bản ghi.");
  const data = validateRow(ws, kind, payload.data, actor), key = naturalKey(kind, data);
  if (key && ws.tables[kind].some((row) => row._id !== existing?._id && naturalKey(kind, row) === key)) fail("Trùng mã hoặc khóa dữ liệu tự nhiên. Không ghi đè ngầm; dùng ID và phiên bản khi cập nhật.");
  const row = { ...data, _id: existing?._id ?? crypto.randomUUID(), _creationTime: existing?._creationTime ?? Date.now(), _version: (existing?._version ?? 0) + 1, _createdBy: existing?._createdBy ?? actor.id } as AnyDoc;
  // Preserve the original preparer so the same person cannot approve a revision.
  if (kind === "dataRecords" || kind === "reports") row.preparedBy = row._createdBy;
  if (existing) ws.tables[kind][ws.tables[kind].indexOf(existing)] = row; else ws.tables[kind].push(row);
  recordAudit(ws, actor, existing ? "update" : "insert", kind, row._id, existing ?? null, row);
  return row._id;
}
function removeRow(ws: SandboxWorkspace, kind: TableName, payload: Record<string, any>, actor: Actor): void {
  const row = ws.tables[kind].find((item) => item._id === payload.id);
  if (!row) fail("Không tìm thấy bản ghi trong workspace hiện tại.");
  checkVersion(row, payload.expectedVersion); checkWritable(ws, kind, row);
  if (kind === "evidence" && ws.tables.dataRecords.some((record) => record.evidenceCode === row.code)) fail("Bằng chứng đang được dữ liệu tham chiếu nên không thể xóa.");
  if (kind === "kpis" && ws.tables.dataRecords.some((record) => record.kpiCode === row.code)) fail("KPI đang có dữ liệu nên không thể xóa.");
  ws.tables[kind] = ws.tables[kind].filter((item) => item._id !== row._id);
  recordAudit(ws, actor, "delete", kind, row._id, row, null);
}
export function mutateSandbox(original: SandboxWorkspace, action: string, payload: Record<string, any>, actor: Actor): { workspace: SandboxWorkspace; result: any } {
  const ws = clone(original);
  if (!["owner", "editor", "reviewer"].includes(actor.role)) fail("Vai trò hiện tại chỉ có quyền xem.");
  const entry = Object.entries(TABLE_API).find(([, names]) => names.includes(action));
  if (entry) {
    const [kind, names] = entry as [TableName, string[]];
    if (names.indexOf(action) === 0) fail("Đây là API đọc.");
    if (actor.role === "reviewer") fail("Người soát xét không có quyền nhập/sửa dữ liệu.");
    if (action === names[1]) return { workspace: ws, result: saveRow(ws, kind, payload, actor) };
    if (action === names[2]) { removeRow(ws, kind, payload, actor); return { workspace: ws, result: null }; }
    if (action === names[3]) {
      const rows = payload.rows ?? (payload.ids ?? []).map((id: string) => ({ id, expectedVersion: payload.versions?.[id] }));
      if (!Array.isArray(rows) || !rows.length || rows.length > 200) fail("Mỗi lần xóa từ 1 đến 200 bản ghi.");
      if (new Set(rows.map((row: any) => row.id)).size !== rows.length) fail("Danh sách xóa bị trùng ID.");
      rows.forEach((row: any) => removeRow(ws, kind, row, actor));
      return { workspace: ws, result: rows.length };
    }
    const rows = payload.rows;
    if (!Array.isArray(rows) || !rows.length || rows.length > 200) fail("Mỗi lần nhập từ 1 đến 200 dòng, toàn bộ batch là một giao dịch.");
    let inserted = 0, updated = 0;
    rows.forEach((row: any) => { const wrapped = row && "data" in row ? row : { data: row }; saveRow(ws, kind, wrapped, actor); wrapped.id ? updated++ : inserted++; });
    return { workspace: ws, result: { inserted, updated } };
  }
  if (action === "reviewDataRecord") {
    if (!["owner", "reviewer"].includes(actor.role)) fail("Chỉ người soát xét/chủ workspace được phê duyệt.");
    const row = ws.tables.dataRecords.find((item) => item._id === payload.id);
    if (!row) fail("Không tìm thấy bản ghi.");
    checkVersion(row, payload.expectedVersion); checkWritable(ws, "dataRecords", row);
    if (row._createdBy === actor.id || row.preparedBy === actor.id) fail("Người lập không được tự phê duyệt dữ liệu.");
    if (!["approved", "rejected"].includes(payload.decision) || !String(payload.reason ?? "").trim()) fail("Cần kết luận phê duyệt/từ chối và lý do.");
    if (payload.decision === "approved" && ["measured", "estimated"].includes(String(row.status)) && !ws.tables.evidence.some((evidence) => evidence.code === row.evidenceCode)) fail("Số đo/ước tính cần bằng chứng đã đăng ký.");
    const old = clone(row);
    Object.assign(row, { reviewState: payload.decision, reviewedBy: actor.id, reviewedAt: Date.now(), reviewReason: String(payload.reason).trim(), checkedBy: actor.id, approvedBy: payload.decision === "approved" ? actor.id : "", _version: row._version + 1 });
    recordAudit(ws, actor, "review", "dataRecords", row._id, old, row, String(payload.reason));
    return { workspace: ws, result: row._id };
  }
  if (action === "lockPeriod") {
    if (!["owner", "reviewer"].includes(actor.role)) fail("Chỉ người soát xét/chủ workspace được khóa/mở kỳ.");
    const period = String(payload.period ?? "").trim();
    if (!periodRange(period) || typeof payload.locked !== "boolean") fail("Kỳ hoặc trạng thái khóa không hợp lệ.");
    if (!String(payload.reason ?? "").trim()) fail("Phải ghi lý do khóa hoặc mở kỳ.");
    const rows = ws.tables.dataRecords.filter((row) => periodContains(period, String(row.period)));
    if (payload.locked && (!rows.length || rows.some((row) => row.reviewState !== "approved"))) fail("Chỉ khóa kỳ có dữ liệu đã được phê duyệt đầy đủ.");
    const previous = ws.locks[period] ?? false;
    ws.locks[period] = payload.locked;
    recordAudit(ws, actor, payload.locked ? "lock" : "unlock", "periods", period, previous, payload.locked, String(payload.reason));
    return { workspace: ws, result: rows.length };
  }
  fail(`API chưa hỗ trợ: ${action}`);
}
