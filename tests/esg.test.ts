import { describe, expect, it } from "vitest";
import {
  aggregateRecords, calculateGhg, isAdditiveUnit, periodBounds, periodContains,
  reportReadiness, validateDataRecord, validateGhgEntry, type EsgRecord, type KpiDefinition,
} from "../src/esg";
import { DEFAULT_KPIS } from "../src/defaults";

const electricity: KpiDefinition = { code: "E01", name: "Điện", unit: "kWh", aggregation: "sum" };
function record(patch: Partial<EsgRecord> = {}): EsgRecord {
  return {
    _id: "record-1", period: "2026-01", date: "2026-01-31", facility: "CS01",
    kpiCode: "E01", source: "METER01", value: 10, unit: "kWh", status: "measured",
    evidenceCode: "EV-001", preparedBy: "actor-1", checkedBy: "actor-2", approvedBy: "actor-2",
    reviewState: "approved", reviewedBy: "actor-2", reviewedAt: 1, locked: true, ...patch,
  };
}

describe("calendar periods", () => {
  it("uses actual year, quarter and leap-month boundaries", () => {
    expect(periodBounds("2024-02")).toEqual({ start: "2024-02-01", end: "2024-02-29" });
    expect(periodBounds("2026-Q2")).toEqual({ start: "2026-04-01", end: "2026-06-30" });
    expect(periodBounds("2026")).toEqual({ start: "2026-01-01", end: "2026-12-31" });
    expect(periodContains("2026", "2026-Q2")).toBe(true);
    expect(periodContains("2026-Q2", "2026-06")).toBe(true);
    expect(periodContains("2026-Q2", "2026-07")).toBe(false);
  });
  it.each(["2026-00", "2026-13", "2026-Q0", "2026-Q5", "2026-1", "2026abc", " 2026", "20"]) ("rejects malformed period %s", (period) => {
    expect(periodBounds(period)).toBeNull();
  });
  it("rejects nonexistent or out-of-period dates", () => {
    expect(validateDataRecord(record({ date: "2026-02-30" }), [electricity]).join(" ")).toMatch(/Ngày/);
    expect(validateDataRecord(record({ date: "2026-02-01" }), [electricity]).join(" ")).toMatch(/nằm trong kỳ/);
  });
});

describe("measurement quality and aggregation", () => {
  it("preserves a proven zero while missing stays null", () => {
    expect(validateDataRecord(record({ value: 0 }), [electricity])).toEqual([]);
    expect(aggregateRecords([record({ value: 0 })], [electricity])[0].value).toBe(0);
    const missing = record({ value: null, status: "missing" });
    expect(validateDataRecord(missing, [electricity])).toEqual([]);
    expect(aggregateRecords([missing], [electricity])[0]).toMatchObject({ value: null, missing: 1, status: "incomplete" });
    expect(validateDataRecord(record({ value: 0, status: "missing" }), [electricity]).join(" ")).toMatch(/null/);
    expect(validateDataRecord(record({ value: null }), [electricity]).join(" ")).toMatch(/hữu hạn/);
  });
  it("requires finite numeric values and substantiated estimates", () => {
    for (const value of [NaN, Infinity, -Infinity, -1]) expect(validateDataRecord(record({ value }), [electricity])).not.toEqual([]);
    expect(validateDataRecord(record({ status: "estimated", note: "" }), [electricity]).join(" ")).toMatch(/phương pháp/);
    expect(validateDataRecord(record({ evidenceCode: "" }), [electricity]).join(" ")).toMatch(/bằng chứng/);
  });
  it("calculates weighted intensity from totals, never from the sum or average of ratios", () => {
    const kpi = { ...electricity, code: "E02", unit: "kWh/đôi đạt", aggregation: "ratio" };
    const a = record({ kpiCode: "E02", unit: kpi.unit, value: 1, numerator: 100, denominator: 100 });
    const b = record({ _id: "record-2", period: "2026-02", date: "2026-02-28", kpiCode: "E02", unit: kpi.unit, value: 3, numerator: 900, denominator: 300 });
    expect(aggregateRecords([a, b], [kpi], { period: "2026" })[0].value).toBe(2.5);
  });
  it("scales weighted percentages by 100 and rejects zero denominators", () => {
    const kpi = { ...electricity, unit: "%", aggregation: "ratio" };
    const a = record({ unit: "%", value: 50, numerator: 5, denominator: 10 });
    const b = record({ _id: "record-2", source: "B", unit: "%", value: 90, numerator: 90, denominator: 100 });
    expect(aggregateRecords([a, b], [kpi])[0].value).toBeCloseTo(95 / 110 * 100);
    expect(aggregateRecords([record({ ...a, denominator: 0 })], [kpi])[0].value).toBeNull();
  });
  it("requires an explicit method and blocks summing percentages or composite units", () => {
    expect(aggregateRecords([record()], [{ ...electricity, aggregation: undefined }])[0].status).toBe("blocked");
    expect(aggregateRecords([record({ unit: "%" })], [{ ...electricity, unit: "%", aggregation: "sum" }])[0].value).toBeNull();
    expect(isAdditiveUnit("vụ và việc")).toBe(false);
    expect(isAdditiveUnit("kg/kg đầu vào")).toBe(false);
  });
  it("blocks mixed units, unknown KPIs and mismatched defined units", () => {
    const mismatch = record({ _id: "record-2", unit: "MWh" });
    const result = reportReadiness([record(), mismatch], [electricity], "2026-01");
    expect(result.ready).toBe(false);
    expect(result.rows[0].value).toBeNull();
    expect(result.issues.join(" ")).toMatch(/đơn vị/);
    expect(reportReadiness([record({ kpiCode: "UNKNOWN" })], [electricity], "2026-01").ready).toBe(false);
  });
  it("excludes unlocked and unapproved data from official totals but shows preview and pending count", () => {
    const pending = record({ _id: "record-2", value: 90, reviewState: "pending", locked: false });
    const unlocked = record({ _id: "record-3", value: 50, locked: false });
    const rows = [record(), pending, unlocked];
    expect(aggregateRecords(rows, [electricity])[0]).toMatchObject({ value: 10, eligibleCount: 1, pending: 2, status: "incomplete" });
    expect(aggregateRecords(rows, [electricity], { official: false })[0].value).toBe(150);
    expect(reportReadiness(rows, [electricity], "2026-01").ready).toBe(false);
  });
  it("retains separate estimated and not-applicable counts", () => {
    const estimated = record({ status: "estimated", note: "Ước tính từ giờ máy × định mức đã duyệt" });
    expect(aggregateRecords([estimated], [electricity])[0]).toMatchObject({ value: 10, estimated: 1, measured: 0 });
    const na = record({ status: "na", value: null, note: "Cơ sở không vận hành nguồn này" });
    expect(aggregateRecords([na], [electricity])[0]).toMatchObject({ value: null, notApplicable: 1, status: "not_applicable" });
    expect(reportReadiness([na], [electricity], "2026-01").ready).toBe(true);
  });
  it("filters quarters correctly and prevents annual-month double counting", () => {
    const outside = record({ period: "2026-04", date: "2026-04-30", value: 50 });
    expect(aggregateRecords([record(), outside], [electricity], { period: "2026-Q1" })[0].value).toBe(10);
    const annual = record({ period: "2026", date: "2026-12-31", value: 100 });
    expect(aggregateRecords([record(), annual], [electricity], { period: "2026" })[0].issues.join(" ")).toMatch(/chồng lấn/);
  });
  it("uses the last snapshot for outstanding balances instead of accumulating them", () => {
    const kpi = { ...electricity, unit: "việc", aggregation: "last" };
    const jan = record({ unit: "việc", value: 12 });
    const feb = record({ unit: "việc", value: 3, period: "2026-02", date: "2026-02-28" });
    expect(aggregateRecords([jan, feb], [kpi], { period: "2026" })[0].value).toBe(3);
  });
  it("marks absent required KPIs as incomplete rather than implicitly zero", () => {
    const result = reportReadiness([record()], [electricity, { ...electricity, code: "E08", unit: "m3" }], "2026-01");
    expect(result.ready).toBe(false);
    expect(result.missingKpis).toEqual(["E08"]);
  });
  it("does not label an annual report complete when monthly obligations cover January only", () => {
    const monthly = { ...electricity, frequency: "Hằng tháng" };
    expect(reportReadiness([record()], [monthly], "2026").issues.join(" ")).toMatch(/chưa bao phủ/);
    const annual = record({ period: "2026", date: "2026-12-31" });
    expect(reportReadiness([annual], [monthly], "2026").ready).toBe(true);
    const fullYear = Array.from({ length: 12 }, (_, i) => record({
      period: `2026-${String(i + 1).padStart(2, "0")}`, date: `2026-${String(i + 1).padStart(2, "0")}-01`,
    }));
    expect(reportReadiness(fullYear, [monthly], "2026").ready).toBe(true);
  });
  it("does not silently take one facility's latest snapshot as the group total", () => {
    const kpi = { ...electricity, unit: "việc", aggregation: "last" };
    const a = record({ unit: "việc", facility: "A" });
    const b = record({ unit: "việc", facility: "B", date: "2026-01-30" });
    expect(aggregateRecords([a, b], [kpi])[0].value).toBeNull();
    expect(aggregateRecords([a, b], [kpi])[0].issues.join(" ")).toMatch(/nhiều cơ sở/);
  });
  it("ships only defined aggregation methods for all 24 seed KPIs", () => {
    expect(DEFAULT_KPIS).toHaveLength(24);
    for (const kpi of DEFAULT_KPIS) {
      expect(["sum", "last", "ratio", "manual"]).toContain(kpi.aggregation);
      if (kpi.aggregation === "sum") expect(isAdditiveUnit(kpi.unit)).toBe(true);
    }
  });
});

describe("greenhouse gas calculations", () => {
  it("retains tiny emissions before aggregation", () => {
    const tiny = calculateGhg(1, 0.4);
    expect(tiny).toBe(0.0004);
    expect(Array.from({ length: 2000 }, () => tiny).reduce((a, b) => a + b, 0)).toBeCloseTo(0.8);
  });
  it("requires units, factor provenance and finite nonnegative inputs", () => {
    const ghg = { period: "2026-Q1", scope: "1", activity: 1, factor: 0.4, unit: "L", factorSource: "Nguồn công khai / 2026 / v1", status: "measured" };
    expect(validateGhgEntry(ghg)).toEqual([]);
    expect(validateGhgEntry({ ...ghg, factorSource: "" }).join(" ")).toMatch(/nguồn/);
    expect(validateGhgEntry({ ...ghg, unit: "" }).join(" ")).toMatch(/đơn vị/);
    for (const activity of [-1, Infinity, NaN]) expect(validateGhgEntry({ ...ghg, activity })).not.toEqual([]);
    expect(() => calculateGhg(-1, 0.4)).toThrow();
    expect(() => calculateGhg(Number.MAX_VALUE, Number.MAX_VALUE)).toThrow();
  });
});
