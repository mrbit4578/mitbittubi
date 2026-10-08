import { describe, expect, it } from "vitest";
import { blankRow, createSandbox, mutateSandbox, periodContains, presentSandboxRow, TABLE_API, type Actor, type SandboxWorkspace, type TableName } from "../src/models";

const editor: Actor = { id: "preparer-A", role: "editor" };
const reviewer: Actor = { id: "reviewer-B", role: "reviewer" };
const owner: Actor = { id: "owner-C", role: "owner" };
function add(ws: SandboxWorkspace, kind: TableName, data: Record<string, unknown>, actor = editor) {
  return mutateSandbox(ws, TABLE_API[kind][1], { data: { ...blankRow(kind), ...data } }, actor);
}
function fixture() {
  let ws = createSandbox().workspaces[0];
  ws = add(ws, "kpis", { code: "E01", name: "Điện", unit: "kWh", aggregation: "sum" }).workspace;
  ws = add(ws, "evidence", { code: "EV01", title: "Ảnh đồng hồ", sourceUrl: "https://example.com/evidence" }).workspace;
  const data = { ...blankRow("dataRecords"), period: "2026-10", date: "2026-10-01", facility: "CS01", kpiCode: "E01", source: "meter-1", unit: "kWh", value: 100, status: "measured", evidenceCode: "EV01" };
  return { ws, data };
}
function approvedFixture() {
  const { ws: base, data } = fixture();
  const added = add(base, "dataRecords", data);
  const reviewed = mutateSandbox(added.workspace, "reviewDataRecord", { id: added.result, expectedVersion: 1, decision: "approved", reason: "Đối chiếu ảnh đồng hồ" }, reviewer);
  return { ws: reviewed.workspace, id: added.result, data };
}

describe("transactional sandbox mirrors backend invariants", () => {
  it("keeps batch atomic when a later row is invalid", () => {
    const { ws, data } = fixture();
    expect(() => mutateSandbox(ws, "importDataRecords", { rows: [{ data }, { data: { ...data, source: "meter-2", value: -1 } }] }, editor)).toThrow(/không âm/);
    expect(ws.tables.dataRecords).toHaveLength(0);
    expect(ws.audit).toHaveLength(2);
  });
  it("rejects duplicates and never overwrites an existing natural key", () => {
    const { ws, data } = fixture();
    const added = add(ws, "dataRecords", data);
    expect(() => add(added.workspace, "dataRecords", { ...data, value: 200 })).toThrow(/Trùng/);
    expect(added.workspace.tables.dataRecords[0].value).toBe(100);
    expect(() => mutateSandbox(ws, "importDataRecords", { rows: [data, data] }, editor)).toThrow(/Trùng/);
    expect(ws.tables.dataRecords).toHaveLength(0);
  });
  it("rejects lost updates and missing optimistic versions", () => {
    const { ws, data } = fixture();
    const added = add(ws, "dataRecords", data);
    const updated = mutateSandbox(added.workspace, "upsertDataRecord", { id: added.result, expectedVersion: 1, data: { ...data, value: 101 } }, editor);
    expect(() => mutateSandbox(updated.workspace, "upsertDataRecord", { id: added.result, expectedVersion: 1, data }, editor)).toThrow(/phiên bản/);
    expect(() => mutateSandbox(updated.workspace, "removeDataRecord", { id: added.result }, editor)).toThrow(/phiên bản/);
  });
  it("isolates workspace IDs and enforces viewer/reviewer write restrictions", () => {
    const { ws, data } = fixture();
    const added = add(ws, "dataRecords", data);
    const other = createSandbox("Khác").workspaces[0];
    expect(() => mutateSandbox(other, "removeDataRecord", { id: added.result, expectedVersion: 1 }, editor)).toThrow(/workspace/);
    expect(() => add(ws, "dataRecords", data, { id: "v", role: "viewer" })).toThrow(/quyền xem/);
    expect(() => add(ws, "dataRecords", data, reviewer)).toThrow(/không có quyền nhập/);
  });
  it("requires a registered evidence and a different reviewer", () => {
    const { ws, data } = fixture();
    const added = add(ws, "dataRecords", { ...data, evidenceCode: "unregistered" });
    expect(() => mutateSandbox(added.workspace, "reviewDataRecord", { id: added.result, expectedVersion: 1, decision: "approved", reason: "test" }, { ...editor, role: "owner" })).toThrow(/tự phê duyệt/);
    expect(() => mutateSandbox(added.workspace, "reviewDataRecord", { id: added.result, expectedVersion: 1, decision: "approved", reason: "test" }, reviewer)).toThrow(/bằng chứng đã đăng ký/);
  });
  it("owns approval metadata and resets review when revised", () => {
    const { ws, data } = fixture();
    const added = add(ws, "dataRecords", { ...data, locked: true, preparedBy: "fake", approvedBy: "fake", reviewState: "approved", reviewedBy: "fake" });
    const row = added.workspace.tables.dataRecords[0];
    expect(row).toMatchObject({ reviewState: "pending", preparedBy: editor.id, approvedBy: "", locked: false });
    const reviewed = mutateSandbox(added.workspace, "reviewDataRecord", { id: added.result, expectedVersion: 1, decision: "approved", reason: "checked" }, reviewer);
    expect(reviewed.workspace.tables.dataRecords[0].approvedBy).toBe(reviewer.id);
    const revised = mutateSandbox(reviewed.workspace, "upsertDataRecord", { id: added.result, expectedVersion: 2, data: { ...data, value: 101 } }, editor);
    expect(revised.workspace.tables.dataRecords[0]).toMatchObject({ reviewState: "pending", reviewedBy: "", approvedBy: "", _version: 3 });
    expect(revised.workspace.audit[0]).toMatchObject({ action: "update", actor: editor.id });
    expect((revised.workspace.audit[0].old as any).value).toBe(100);
  });
  it("locks all writes, imports and deletes for overlapping periods", () => {
    const { ws, id, data } = approvedFixture();
    const locked = mutateSandbox(ws, "lockPeriod", { period: "2026-Q4", locked: true, reason: "Chốt quý" }, reviewer).workspace;
    expect(presentSandboxRow(locked, "dataRecords", locked.tables.dataRecords[0]).locked).toBe(true);
    expect(() => add(locked, "dataRecords", { ...data, source: "meter-2" })).toThrow(/đã khóa/);
    expect(() => mutateSandbox(locked, "upsertDataRecord", { id, expectedVersion: 2, data }, editor)).toThrow(/đã khóa/);
    expect(() => mutateSandbox(locked, "removeDataRecord", { id, expectedVersion: 2 }, editor)).toThrow(/đã khóa/);
    expect(() => mutateSandbox(locked, "importDataRecords", { rows: [{ ...data, period: "2026" }] }, editor)).toThrow(/đã khóa/);
    expect(() => mutateSandbox(locked, "lockPeriod", { period: "2026-Q4", locked: false, reason: "" }, owner)).toThrow(/lý do/);
  });
  it("bulk delete is atomic and rejects duplicated IDs", () => {
    const { ws, data } = fixture();
    const first = add(ws, "dataRecords", data);
    const second = add(first.workspace, "dataRecords", { ...data, source: "meter-2" });
    expect(() => mutateSandbox(second.workspace, "removeManyDataRecords", { ids: [first.result, second.result], versions: { [first.result]: 1, [second.result]: 0 } }, editor)).toThrow(/phiên bản/);
    expect(second.workspace.tables.dataRecords).toHaveLength(2);
    expect(() => mutateSandbox(second.workspace, "removeManyDataRecords", { ids: [first.result, first.result], versions: { [first.result]: 1 } }, editor)).toThrow(/trùng ID/);
  });
  it("protects referenced KPI meaning and evidence sources", () => {
    const { ws } = approvedFixture();
    const kpi = ws.tables.kpis[0], evidence = ws.tables.evidence[0];
    expect(() => mutateSandbox(ws, "upsertKpi", { id: kpi._id, expectedVersion: 1, data: { ...kpi, unit: "MWh" } }, editor)).toThrow(/KPI đã được dùng/);
    expect(() => mutateSandbox(ws, "removeEvidence", { id: evidence._id, expectedVersion: 1 }, editor)).toThrow(/tham chiếu/);
    expect(() => mutateSandbox(ws, "upsertEvidence", { id: evidence._id, expectedVersion: 1, data: { ...evidence, sourceUrl: "https://example.com/replaced" } }, editor)).toThrow(/không thể sửa nguồn/);
  });
  it("requires exact report lock and freezes approved snapshot content", () => {
    const { ws } = approvedFixture();
    const locked = mutateSandbox(ws, "lockPeriod", { period: "2026-10", locked: true, reason: "Chốt tháng" }, owner).workspace;
    const report = { ...blankRow("reports"), code: "R01", title: "Tháng 10", period: "2026-10", status: "approved" };
    expect(() => add(locked, "reports", { ...report, period: "2026", type: "annual" }, owner)).toThrow(/chính kỳ/);
    const approved = add(locked, "reports", report, owner);
    expect((approved.workspace.tables.reports[0].snapshot as any).records[0].value).toBe(100);
    expect(() => mutateSandbox(approved.workspace, "upsertReport", { id: approved.result, expectedVersion: 1, data: { ...report, summary: "changed" } }, owner)).toThrow(/bất biến/);
    const published = mutateSandbox(approved.workspace, "upsertReport", { id: approved.result, expectedVersion: 1, data: { ...report, status: "published" } }, owner);
    expect(published.workspace.tables.reports[0].snapshot).toEqual(approved.workspace.tables.reports[0].snapshot);
    expect(() => mutateSandbox(published.workspace, "removeReport", { id: approved.result, expectedVersion: 2 }, owner)).toThrow(/bất biến/);
  });
  it("rejects incomplete/manual KPI data when finalizing reports", () => {
    const { ws } = approvedFixture();
    const extra = add(ws, "kpis", { code: "E02", name: "Nước", unit: "m3", aggregation: "sum" }).workspace;
    const locked = mutateSandbox(extra, "lockPeriod", { period: "2026-10", locked: true, reason: "chốt" }, owner).workspace;
    expect(() => add(locked, "reports", { code: "R01", title: "Báo cáo", period: "2026-10", status: "published" }, owner)).toThrow(/KPI chưa có dữ liệu/);
  });
  it("retains GHG precision and separates both Scope 2 methods", () => {
    const ws = createSandbox().workspaces[0];
    const data = { ...blankRow("ghgEntries"), period: "2026-10", facility: "CS01", scope: "2", scope2Method: "location", source: "grid", category: "điện", activity: 1.23456789, unit: "kWh", factor: 0.87654321, factorSource: "Nguồn 2026 v1", tco2e: 99 };
    const first = add(ws, "ghgEntries", data);
    expect(first.workspace.tables.ghgEntries[0].tco2e).toBe(1.23456789 * 0.87654321 / 1000);
    const second = add(first.workspace, "ghgEntries", { ...data, scope2Method: "market" });
    expect(second.workspace.tables.ghgEntries).toHaveLength(2);
    expect(() => add(ws, "ghgEntries", { ...data, scope: "1" })).toThrow(/Scope 2/);
    expect(() => add(ws, "ghgEntries", { ...data, activity: Infinity })).toThrow(/hữu hạn/);
  });
  it("validates data units, missing semantics and dates", () => {
    const { ws, data } = fixture();
    expect(() => add(ws, "dataRecords", { ...data, unit: "MWh" })).toThrow(/Đơn vị/);
    expect(() => add(ws, "dataRecords", { ...data, status: "missing", value: 0 })).toThrow(/giá trị trống/);
    expect(() => add(ws, "dataRecords", { ...data, date: "2026-11-01" })).toThrow(/nằm trong kỳ/);
    expect(() => add(ws, "dataRecords", { ...data, period: "2026-13" })).toThrow(/Kỳ/);
    expect(periodContains("2026-Q4", "2026-10")).toBe(true);
    expect(periodContains("2026-Q4", "2026-09")).toBe(false);
  });
});
