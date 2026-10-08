/** Shared ESG rules. Publication eligibility is separate from measurement quality. */
export type AggregationMethod = "sum" | "last" | "ratio" | "manual";
export interface KpiDefinition {
  code: string;
  name: string;
  unit: string;
  aggregation?: AggregationMethod | string;
  frequency?: string;
}
export interface EsgRecord {
  _id?: string;
  period: string;
  date?: string;
  facility?: string;
  kpiCode: string;
  source?: string;
  value: number | null;
  unit: string;
  status: string;
  numerator?: number | null;
  denominator?: number | null;
  evidenceCode?: string;
  preparedBy?: string;
  checkedBy?: string;
  approvedBy?: string;
  reviewState?: string;
  reviewedBy?: string;
  reviewedAt?: number;
  note?: string;
  locked?: boolean;
}
export interface GhgEntry {
  period: string;
  scope: string;
  activity: number;
  unit: string;
  factor: number;
  factorSource: string;
  tco2e?: number;
  status?: string;
}
export interface AggregateRow {
  code: string;
  name: string;
  unit: string;
  aggregation: AggregationMethod;
  value: number | null;
  count: number;
  eligibleCount: number;
  measured: number;
  estimated: number;
  missing: number;
  notApplicable: number;
  pending: number;
  issues: string[];
  status: "ready" | "incomplete" | "blocked" | "manual" | "not_applicable";
}

const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const nonempty = (s: unknown) => typeof s === "string" && s.trim().length > 0;
const unique = (items: string[]) => [...new Set(items)];
export const normalizeUnit = (unit: string) => unit.trim().replace(/\s+/g, " ").replace(/³/g, "3").replace(/₂/g, "2");
export const ratioMultiplier = (unit: string) => normalizeUnit(unit).startsWith("%") ? 100 : 1;

/** Inclusive ISO calendar bounds; UTC is used only to compute calendar dates. */
export function periodBounds(period: string): { start: string; end: string } | null {
  const match = /^(\d{4})(?:-(0[1-9]|1[0-2])|-Q([1-4]))?$/.exec(period);
  if (!match || Number(match[1]) < 1900 || Number(match[1]) > 9999) return null;
  const year = Number(match[1]);
  const first = match[2] ? Number(match[2]) : match[3] ? (Number(match[3]) - 1) * 3 + 1 : 1;
  const last = match[2] ? first : match[3] ? first + 2 : 12;
  const lastDay = new Date(Date.UTC(year, last, 0)).getUTCDate();
  return { start: `${year}-${String(first).padStart(2, "0")}-01`, end: `${year}-${String(last).padStart(2, "0")}-${lastDay}` };
}
export function periodContains(parent: string, child: string): boolean {
  const outer = periodBounds(parent), inner = periodBounds(child);
  return Boolean(outer && inner && inner.start >= outer.start && inner.end <= outer.end);
}
export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const time = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date;
}
export function isOfficialRecord(record: EsgRecord): boolean {
  return record.reviewState === "approved" && record.locked === true;
}
export function isAdditiveUnit(unit: string): boolean {
  const value = normalizeUnit(unit);
  // Rates and compound/composite units need a ratio or an explicit manual method.
  return nonempty(value) && !/%|\/|(?:^|\s)(?:per|và|and)(?:\s|$)|·|\.\.\./i.test(value);
}

export function validateKpi(kpi: Partial<KpiDefinition>): string[] {
  const errors: string[] = [];
  if (!nonempty(kpi.code)) errors.push("Thiếu mã KPI.");
  if (!nonempty(kpi.name)) errors.push("Thiếu tên KPI.");
  if (!nonempty(kpi.unit)) errors.push("Thiếu đơn vị KPI.");
  if (!["sum", "last", "ratio", "manual"].includes(kpi.aggregation ?? "")) errors.push("KPI phải có phương pháp tổng hợp sum/last/ratio/manual.");
  if (kpi.aggregation === "sum" && !isAdditiveUnit(kpi.unit ?? "")) errors.push("Không được cộng KPI tỷ lệ, cường độ hoặc nhiều đơn vị.");
  return errors;
}

/** Identity membership and permissions are checked by the server, never by a typed name. */
export function validateDataRecord(record: Partial<EsgRecord>, kpis: readonly KpiDefinition[]): string[] {
  const errors: string[] = [];
  const bounds = periodBounds(record.period ?? "");
  if (!bounds) errors.push("Kỳ phải là YYYY, YYYY-MM hoặc YYYY-Q1…Q4 hợp lệ.");
  if (record.date && (!isValidDate(record.date) || !bounds || record.date < bounds.start || record.date > bounds.end)) errors.push("Ngày phát sinh phải hợp lệ và nằm trong kỳ dữ liệu.");
  if (!nonempty(record.facility)) errors.push("Thiếu mã cơ sở.");
  const kpi = kpis.find((item) => item.code === record.kpiCode);
  if (!kpi) errors.push(`KPI chưa được định nghĩa: ${record.kpiCode ?? ""}.`);
  else {
    errors.push(...validateKpi(kpi));
    if (normalizeUnit(record.unit ?? "") !== normalizeUnit(kpi.unit)) errors.push(`Sai đơn vị KPI ${kpi.code}: cần ${kpi.unit}.`);
  }
  if (!["measured", "estimated", "missing", "na"].includes(record.status ?? "")) errors.push("Trạng thái dữ liệu không hợp lệ.");
  if (record.status === "measured" || record.status === "estimated") {
    if (!finite(record.value)) errors.push("Đo thực/ước tính phải có giá trị số hữu hạn; không tự đổi thiếu dữ liệu thành 0.");
    else if (record.value < 0) errors.push("Giá trị dữ liệu không được âm.");
    if (!nonempty(record.source)) errors.push("Dữ liệu phải có nguồn đo hoặc nguồn ước tính.");
    if (!nonempty(record.evidenceCode)) errors.push("Thiếu mã bằng chứng.");
    if (record.status === "estimated" && !nonempty(record.note)) errors.push("Ước tính cần phương pháp và giả định trong ghi chú.");
    if (kpi?.aggregation === "ratio") {
      if (!finite(record.numerator) || record.numerator < 0) errors.push("KPI tỷ lệ/cường độ cần tử số hữu hạn không âm.");
      if (!finite(record.denominator) || record.denominator <= 0) errors.push("KPI tỷ lệ/cường độ cần mẫu số hữu hạn lớn hơn 0.");
      if (ratioMultiplier(kpi.unit) === 100 && finite(record.numerator) && finite(record.denominator) && record.numerator > record.denominator) errors.push("Tử số của tỷ lệ phần trăm không được vượt mẫu số.");
    }
  }
  if ((record.status === "missing" || record.status === "na") && record.value !== null) errors.push("Thiếu/không áp dụng phải để giá trị null, không nhập số 0.");
  if (record.status === "na" && !nonempty(record.note)) errors.push("Không áp dụng cần lý do trong ghi chú.");
  return unique(errors);
}

export function calculateGhg(activity: number, factor: number): number {
  if (!finite(activity) || activity < 0 || !finite(factor) || factor < 0) throw new Error("Hoạt động và hệ số phải là số hữu hạn không âm.");
  const result = activity * factor / 1000;
  if (!Number.isFinite(result)) throw new Error("Phép tính phát thải vượt giới hạn số.");
  return result;
}
export function validateGhgEntry(entry: Partial<GhgEntry>): string[] {
  const errors: string[] = [];
  if (!periodBounds(entry.period ?? "")) errors.push("Kỳ kiểm kê phải là YYYY, YYYY-MM hoặc YYYY-Q1…Q4 hợp lệ.");
  if (!["1", "2", "3"].includes(entry.scope ?? "")) errors.push("Scope phải là 1, 2 hoặc 3.");
  if (!finite(entry.activity) || entry.activity < 0) errors.push("Lượng hoạt động phải là số hữu hạn không âm.");
  if (!finite(entry.factor) || entry.factor < 0) errors.push("Hệ số phải là số hữu hạn không âm (kgCO2e/đơn vị hoạt động).");
  if (!nonempty(entry.unit)) errors.push("Thiếu đơn vị hoạt động tương ứng với hệ số.");
  if (!nonempty(entry.factorSource)) errors.push("Thiếu nguồn, năm và phiên bản hệ số.");
  if (entry.status && !["measured", "estimated"].includes(entry.status)) errors.push("Trạng thái kiểm kê không hợp lệ.");
  if (finite(entry.activity) && finite(entry.factor) && !Number.isFinite(entry.activity * entry.factor / 1000)) errors.push("Phép tính phát thải vượt giới hạn số.");
  return unique(errors);
}

function overlaps(a: string, b: string): boolean {
  const x = periodBounds(a), y = periodBounds(b);
  return Boolean(x && y && x.start <= y.end && y.start <= x.end);
}
function inPeriod(records: readonly EsgRecord[], period?: string): EsgRecord[] {
  return records.filter((r) => !period || periodContains(period, r.period));
}
function periodOverlapIssues(records: readonly EsgRecord[], code: string): string[] {
  const groups = new Map<string, Set<string>>();
  for (const record of records) {
    const key = `${record.facility ?? ""}\u0000${record.source ?? ""}`;
    const periods = groups.get(key) ?? new Set<string>();
    periods.add(record.period); groups.set(key, periods);
  }
  const errors: string[] = [];
  for (const periods of groups.values()) {
    const sorted = [...periods].sort((a, b) => (periodBounds(a)?.start ?? a).localeCompare(periodBounds(b)?.start ?? b));
    for (let i = 1; i < sorted.length; i++) {
      if (overlaps(sorted[i - 1], sorted[i])) errors.push(`KPI ${code} có kỳ chồng lấn (${sorted[i - 1]}, ${sorted[i]}) tại cùng cơ sở/nguồn.`);
    }
  }
  return errors;
}

/** Preview aggregates remain labelled; invalid or mixed-unit records never produce a total. */
export function aggregateRecords(records: readonly EsgRecord[], kpis: readonly KpiDefinition[], options: { period?: string; official?: boolean } = {}): AggregateRow[] {
  const scoped = inPeriod(records, options.period);
  const codes = [...new Set(scoped.map((r) => r.kpiCode))].sort();
  return codes.map((code) => {
    const group = scoped.filter((r) => r.kpiCode === code);
    const kpi = kpis.find((item) => item.code === code);
    const aggregation = (["sum", "last", "ratio", "manual"].includes(kpi?.aggregation ?? "") ? kpi!.aggregation : "manual") as AggregationMethod;
    const issues = group.flatMap((record) => validateDataRecord(record, kpis));
    if (kpis.filter((item) => item.code === code).length > 1) issues.push(`Mã KPI ${code} có nhiều định nghĩa.`);
    if (new Set(group.map((r) => normalizeUnit(r.unit))).size > 1) issues.push(`KPI ${code} có nhiều đơn vị; không thể tổng hợp.`);
    const candidates = group.filter((r) => options.official === false || isOfficialRecord(r));
    issues.push(...periodOverlapIssues(candidates, code));
    const numeric = candidates.filter((r) => r.status === "measured" || r.status === "estimated");
    let value: number | null = null;
    if (!issues.length && numeric.length && aggregation !== "manual") {
      if (aggregation === "sum") value = numeric.reduce((total, record) => total + record.value!, 0);
      if (aggregation === "ratio") {
        const numerator = numeric.reduce((total, record) => total + record.numerator!, 0);
        const denominator = numeric.reduce((total, record) => total + record.denominator!, 0);
        value = numerator / denominator * ratioMultiplier(kpi!.unit);
      }
      if (aggregation === "last") {
        if (new Set(numeric.map((r) => r.facility)).size > 1) issues.push(`KPI ${code} có nhiều cơ sở; cần snapshot hợp nhất đúng phạm vi hoặc báo cáo từng cơ sở.`);
        const dates = numeric.map((r) => r.date || periodBounds(r.period)?.end || "");
        const latest = [...dates].sort().at(-1)!;
        const last = numeric.filter((_, i) => dates[i] === latest);
        if (last.length !== 1) issues.push(`KPI ${code} có nhiều bản ghi tại thời điểm cuối; cần chốt một snapshot đúng phạm vi.`);
        else value = last[0].value;
      }
      if (value !== null && !Number.isFinite(value)) { issues.push(`Tổng KPI ${code} vượt giới hạn số.`); value = null; }
    }
    const row: AggregateRow = {
      code, name: kpi?.name ?? "KPI chưa định nghĩa", unit: kpi?.unit ?? group[0].unit, aggregation,
      value: issues.length ? null : value, count: group.length, eligibleCount: numeric.length,
      measured: group.filter((r) => r.status === "measured").length,
      estimated: group.filter((r) => r.status === "estimated").length,
      missing: group.filter((r) => r.status === "missing").length,
      notApplicable: group.filter((r) => r.status === "na").length,
      pending: group.filter((r) => !isOfficialRecord(r)).length,
      issues: unique(issues), status: "ready",
    };
    row.status = row.issues.length ? "blocked" : row.missing || row.pending ? "incomplete" : row.notApplicable === row.count ? "not_applicable" : aggregation === "manual" ? "manual" : value === null ? "incomplete" : "ready";
    return row;
  });
}

export function reportReadiness(records: readonly EsgRecord[], kpis: readonly KpiDefinition[], period: string): { ready: boolean; issues: string[]; rows: AggregateRow[]; missingKpis: string[]; pendingCount: number } {
  const scoped = inPeriod(records, period);
  const rows = aggregateRecords(records, kpis, { period });
  const missingKpis = kpis.filter((k) => !scoped.some((r) => r.kpiCode === k.code)).map((k) => k.code);
  const issues = rows.flatMap((r) => r.issues.map((issue) => `${r.code}: ${issue}`));
  if (!periodBounds(period)) issues.push("Kỳ báo cáo không hợp lệ.");
  if (!scoped.length) issues.push("Chưa có dữ liệu trong kỳ báo cáo.");
  if (missingKpis.length) issues.push(`KPI chưa có dữ liệu hoặc quyết định không áp dụng: ${missingKpis.join(", ")}.`);
  const bounds = periodBounds(period);
  if (bounds) for (const kpi of kpis) {
    const frequency = kpi.frequency?.toLowerCase() ?? "";
    const required: string[] = [];
    if (/hằng tháng|hàng tháng|monthly/.test(frequency)) {
      for (let month = Number(bounds.start.slice(5, 7)); month <= Number(bounds.end.slice(5, 7)); month++) required.push(`${bounds.start.slice(0, 4)}-${String(month).padStart(2, "0")}`);
    } else if (/hằng quý|hàng quý|quarterly/.test(frequency) && /^\d{4}$/.test(period)) {
      for (let quarter = 1; quarter <= 4; quarter++) required.push(`${period}-Q${quarter}`);
    }
    const group = scoped.filter((r) => r.kpiCode === kpi.code && isOfficialRecord(r) && r.status !== "missing");
    const absent = required.filter((chunk) => !group.some((r) => periodContains(r.period, chunk)));
    if (absent.length) issues.push(`KPI ${kpi.code} chưa bao phủ các kỳ phải nộp: ${absent.join(", ")}.`);
  }
  const pendingCount = scoped.filter((r) => !isOfficialRecord(r)).length;
  if (pendingCount) issues.push(`${pendingCount} bản ghi chưa được duyệt và khóa.`);
  if (scoped.some((r) => r.status === "missing")) issues.push("Còn dữ liệu thiếu; không thay bằng số 0.");
  if (rows.some((r) => r.status === "manual")) issues.push("Có KPI cần phương pháp tổng hợp thủ công; cần tách chỉ tiêu/đơn vị trước phát hành số liệu.");
  return { ready: issues.length === 0, issues: unique(issues), rows, missingKpis, pendingCount };
}
