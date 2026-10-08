// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { zipSync } from "fflate";
import { coerce, CrudScreen, emptyRow, ImportExportBar, RecordForm, previewImportFile, rowData, validateImportRows, type Col } from "../src/crud";
import { buildXlsx, excelSerialToISO, mapSheetRows, readXlsx, unzipXlsx } from "../src/xlsx";

const adapter = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[], mutations: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("../src/data", () => ({ useMutation: (name: string) => adapter.mutations[name] ?? vi.fn(), useQuery: () => adapter.rows }));
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const columns: Col[] = [
  { key: "code", label: "Mã", required: true },
  { key: "value", label: "Giá trị", type: "number", required: true },
  { key: "status", label: "Trạng thái", type: "select", options: [{ value: "draft", label: "Nháp" }, { value: "submitted", label: "Đã nộp" }] },
];
const headers = columns.map((c) => c.label);
const asFile = (bytes: Uint8Array, name = "input.xlsx") => ({ name, size: bytes.byteLength, arrayBuffer: async () => bytes.slice().buffer }) as File;
const encode = (s: string) => new TextEncoder().encode(s);
const roots: Root[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await act(async () => root.unmount()); document.body.innerHTML = ""; adapter.rows = []; adapter.mutations = {}; vi.restoreAllMocks(); });
async function mount(element: React.ReactElement) {
  const container = document.createElement("div"); document.body.appendChild(container);
  const root = createRoot(container); roots.push(root);
  await act(async () => root.render(element));
  return { root, container };
}

 describe("strict ESG field conversion", () => {
  it("never converts missing or invalid numbers to zero and enforces ranges", () => {
    const c: Col = { key: "value", label: "Số", type: "number" };
    for (const value of ["", "abc", "0x20", "Infinity", "1,000,000", "-1"]) expect(() => coerce(c, value)).toThrow();
    expect(coerce(c, "0")).toBe(0);
    expect(coerce(c, "1,25")).toBe(1.25);
    expect(coerce({ ...c, min: -2, max: 2 }, "-1")).toBe(-1);
    expect(() => coerce({ ...c, max: 2 }, "3")).toThrow();
    expect(coerce({ ...c, type: "nullable-number" }, "")).toBeNull();
    expect(() => coerce({ ...c, type: "nullable-number", required: true }, "")).toThrow();
  });
  it("rejects unknown enums and booleans while creation defaults are explicit", () => {
    const c = columns[2];
    expect(() => coerce(c, "")).toThrow(); expect(() => coerce(c, "typo")).toThrow();
    expect(coerce(c, "Đã nộp")).toBe("submitted");
    expect(emptyRow([c]).status).toBe("draft");
    const boolean: Col = { key: "ready", label: "Sẵn sàng", type: "boolean" };
    expect(coerce(boolean, "FALSE")).toBe(false); expect(coerce(boolean, "Có")).toBe(true);
    expect(() => coerce(boolean, "maybe")).toThrow(); expect(() => coerce(boolean, "")).toThrow();
  });
  it("validates calendar dates and Excel's 1900 leap-year bug", () => {
    const c: Col = { key: "date", label: "Ngày", type: "date" };
    expect(coerce(c, "2024-02-29")).toBe("2024-02-29");
    for (const value of ["2025-02-29", "2026-04-31", "31/01/2026", "60", "45100.5"]) expect(() => coerce(c, value)).toThrow();
    expect(excelSerialToISO(1)).toBe("1900-01-01"); expect(excelSerialToISO(61)).toBe("1900-03-01");
    expect(coerce(c, "45292")).toBe("2024-01-01");
    expect(coerce({ key: "description", label: "Nội dung" }, "  giữ khoảng trắng\n")).toBe("  giữ khoảng trắng\n");
  });
 });

 describe("template mapping and row validation", () => {
  it("rejects missing, duplicate, aliased duplicate and unknown columns", () => {
    expect(() => mapSheetRows([["Mã", "Giá trị"]], columns)).toThrow("Thiếu cột");
    expect(() => mapSheetRows([[...headers, "Mã"]], columns)).toThrow("trùng");
    expect(() => mapSheetRows([[...headers, "code"]], columns)).toThrow("Hai cột");
    expect(() => mapSheetRows([[...headers, "Sai cột"]], columns)).toThrow("không được nhận diện");
    expect(() => mapSheetRows([headers, ["A", "1", "Nháp", "dữ liệu ẩn"]], columns)).toThrow("Dòng 2");
  });
  it("keeps source row numbers, text and reports every invalid cell without writing", () => {
    const result = validateImportRows([headers, [], ["A", "bad", "unknown"], ["B", "0", "Nháp"]], columns);
    expect(result.blankRows).toBe(1);
    expect(result.rowNumbers).toEqual([3, 4]);
    expect(result.issues).toHaveLength(2); expect(result.issues.every((i) => i.rowNumber === 3)).toBe(true);
    expect(result.sourceRows[0].value).toBe("bad"); expect(result.rows[1].value).toBe(0);
  });
  it("detects duplicate business keys before a commit", () => {
    const result = validateImportRows([headers, ["A", "1", "Nháp"], [" A ", "2", "Nháp"]], columns);
    expect(result.issues).toEqual([{ rowNumber: 3, message: "Khóa bản ghi trùng với dòng 2. Hãy giữ một bản ghi cho mỗi nguồn/kỳ." }]);
  });
  it("rejects large import batches before any mutation", () => {
    const result = validateImportRows([headers, ...Array.from({ length: 201 }, (_, i) => [`A${i}`, "1", "Nháp"])], columns);
    expect(result.rows).toHaveLength(201); expect(result.issues[0].message).toContain("tối đa 200");
  });
 });

 describe("XLSX boundaries and integrity", () => {
  it("round-trips compressed Excel data and preserves formula-looking text as inline strings", async () => {
    const bytes = buildXlsx([{ name: "Sheet", rows: [headers, ["=SUM(1,2)", 0, "Nháp"], ["  text  ", 1, "Nháp"]] }]);
    const files = unzipXlsx(bytes.slice().buffer);
    const xml = new TextDecoder().decode(files.get("xl/worksheets/sheet1.xml"));
    expect(xml).toContain('t="inlineStr"'); expect(xml).not.toContain("<f>");
    const compressed = zipSync(Object.fromEntries(files), { level: 6 });
    const sheets = await readXlsx(asFile(compressed));
    expect(sheets[0].rows[1][0]).toBe("=SUM(1,2)"); expect(sheets[0].rows[2][0]).toBe("  text  ");
    expect((await previewImportFile(asFile(compressed), columns)).issues).toEqual([]);
  });
  it("refuses unrepresentable export characters instead of silently removing data", () => {
    expect(() => buildXlsx([{ name: "Sheet", rows: [["bad\u0000text"]] }])).toThrow("ký tự");
    expect(() => buildXlsx([{ name: "Sheet", rows: [["bad\ud800text"]] }])).toThrow("Unicode");
    expect(() => buildXlsx([{ name: "Sheet", rows: [["Dữ liệu ✅"]] }])).not.toThrow();
  });
  it("rejects truncated archives, CRC corruption, path traversal and oversized expansion", () => {
    const bytes = buildXlsx([{ name: "Sheet", rows: [headers] }]);
    expect(() => unzipXlsx(bytes.slice(0, -1).buffer)).toThrow();
    const damaged = bytes.slice(); damaged[100] ^= 1;
    expect(() => unzipXlsx(damaged.buffer)).toThrow();
    expect(() => unzipXlsx(zipSync({ "../outside.xml": encode("bad") }).slice().buffer)).toThrow("Tên");
    const inflated = bytes.slice(); const view = new DataView(inflated.buffer);
    const offset = view.getUint32(inflated.length - 6, true); view.setUint32(offset + 24, 9 * 1024 * 1024, true);
    expect(() => unzipXlsx(inflated.buffer)).toThrow("giải nén");
  });
  it("rejects formula cells, malformed XML and invalid row indices", async () => {
    const base = unzipXlsx(buildXlsx([{ name: "Sheet", rows: [headers] }]).slice().buffer);
    for (const xml of [
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1"><f>1+1</f><v>2</v></c></row></sheetData></worksheet>',
      '<worksheet><sheetData>',
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="99999999"/></sheetData></worksheet>',
    ]) {
      base.set("xl/worksheets/sheet1.xml", encode(xml));
      await expect(readXlsx(asFile(zipSync(Object.fromEntries(base))))).rejects.toThrow();
    }
  });
  it("checks the file size before reading it", async () => {
    const read = vi.fn();
    await expect(readXlsx({ size: 11 * 1024 * 1024, arrayBuffer: read } as unknown as File)).rejects.toThrow("10 MB");
    expect(read).not.toHaveBeenCalled();
  });
 });

 describe("review before data writes", () => {
  it("shows import preview and only commits after explicit confirmation", async () => {
    const bulk = vi.fn(async () => ({ inserted: 1, updated: 0 }));
    const { container } = await mount(React.createElement(ImportExportBar, { cols: columns, rows: [], fileName: "test", canWrite: true, bulk }));
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, "files", { configurable: true, value: [asFile(buildXlsx([{ name: "Data", rows: [headers, ["A", "1", "Nháp"]] }]))] });
    await act(async () => { input.dispatchEvent(new Event("change", { bubbles: true })); await new Promise((resolve) => setTimeout(resolve, 0)); });
    expect(container.textContent).toContain("Xem trước 1 dòng"); expect(bulk).not.toHaveBeenCalled();
    const confirm = [...container.querySelectorAll("button")].find((b) => b.textContent?.startsWith("Xác nhận nhập"))!;
    await act(async () => { confirm.click(); });
    expect(bulk).toHaveBeenCalledExactlyOnceWith([{ code: "A", value: 1, status: "draft" }]);
  });
  it("blocks invalid preview commit and displays source-row errors", async () => {
    const bulk = vi.fn();
    const { container } = await mount(React.createElement(ImportExportBar, { cols: columns, rows: [], fileName: "test", canWrite: true, bulk }));
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, "files", { value: [asFile(buildXlsx([{ name: "Data", rows: [headers, ["A", "wrong", "Nháp"]] }]))] });
    await act(async () => { input.dispatchEvent(new Event("change", { bubbles: true })); await new Promise((resolve) => setTimeout(resolve, 0)); });
    expect(container.textContent).toContain("Dòng 2:");
    const confirm = [...container.querySelectorAll("button")].find((b) => b.textContent?.startsWith("Xác nhận nhập"))!;
    expect(confirm.disabled).toBe(true); confirm.click(); expect(bulk).not.toHaveBeenCalled();
  });
  it("preserves immutable properties and version through form submission", async () => {
    const save = vi.fn(async (_row: Record<string, unknown>) => {});
    const initial = { code: "A", value: 3, status: "draft", createdAt: 123, _id: "one", _version: 4, calculated: 9 };
    const cols: Col[] = [...columns, { key: "calculated", label: "Tự tính", type: "number", readonly: true }];
    const { container } = await mount(React.createElement(RecordForm, { cols, initial, title: "Edit", onSave: save, onCancel: vi.fn() }));
    await act(async () => { container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
    expect(save.mock.calls[0][0]).toEqual(initial);
    expect(rowData(initial)).toEqual({ code: "A", value: 3, status: "draft", createdAt: 123, calculated: 9 });
    expect(container.querySelector<HTMLInputElement>('[aria-label="Tự tính"]')!.disabled).toBe(true);
  });
 });


describe("CRUD concurrency and delete protections", () => {
  const fns = { list: "list", upsert: "upsert", remove: "remove", removeMany: "removeMany", bulk: "bulk" };
  const screen = () => React.createElement(CrudScreen, { title: "Records", cols: columns, fns, fileName: "test", canWrite: true });
  it("resets the form between records and sends the original version on save", async () => {
    adapter.rows = [{ _id: "one", _version: 3, code: "A", value: 1, status: "draft", createdAt: 123 }, { _id: "two", _version: 7, code: "B", value: 2, status: "draft", createdAt: 456 }];
    adapter.mutations.upsert = vi.fn(async () => "two");
    const { container } = await mount(screen());
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Sửa bản ghi A"]')!.click());
    expect(container.querySelector<HTMLInputElement>('[aria-label="Mã"]')!.value).toBe("A");
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Sửa bản ghi B"]')!.click());
    expect(container.querySelector<HTMLInputElement>('[aria-label="Mã"]')!.value).toBe("B");
    await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(adapter.mutations.upsert).toHaveBeenCalledExactlyOnceWith({ id: "two", expectedVersion: 7, data: { code: "B", value: 2, status: "draft", createdAt: 456 } });
  });
  it("disables all edit, delete and selection controls for locked rows", async () => {
    adapter.rows = [{ _id: "one", _version: 3, code: "A", value: 1, status: "draft", locked: true }];
    const { container } = await mount(screen());
    expect(container.querySelector<HTMLButtonElement>('[aria-label="Sửa bản ghi A"]')!.disabled).toBe(true);
    expect(container.querySelector<HTMLButtonElement>('[aria-label="Xóa bản ghi A"]')!.disabled).toBe(true);
    expect(container.querySelector<HTMLInputElement>('[aria-label="Chọn bản ghi A"]')!.disabled).toBe(true);
  });
  it("rejects selection over 200 instead of deleting a truncated subset", async () => {
    adapter.rows = Array.from({ length: 201 }, (_, i) => ({ _id: `row${i}`, _version: 1, code: `A${i}`, value: 1, status: "draft" }));
    adapter.mutations.removeMany = vi.fn();
    const { container } = await mount(screen());
    await act(async () => container.querySelector<HTMLInputElement>('[aria-label="Chọn tất cả bản ghi có thể sửa đang hiển thị"]')!.click());
    const button = [...container.querySelectorAll("button")].find((b) => b.textContent === "Xóa đã chọn (201)")!;
    await act(async () => button.click());
    expect(container.textContent).toContain("Mỗi lần xóa tối đa 200"); expect(adapter.mutations.removeMany).not.toHaveBeenCalled();
  });
  it("shows delete failures and includes the version in the request", async () => {
    adapter.rows = [{ _id: "one", _version: 3, code: "A", value: 1, status: "draft" }];
    adapter.mutations.remove = vi.fn(async () => { throw new Error("Phiên bản đã thay đổi"); });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { container } = await mount(screen());
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Xóa bản ghi A"]')!.click());
    expect(adapter.mutations.remove).toHaveBeenCalledExactlyOnceWith({ id: "one", expectedVersion: 3 });
    expect(container.querySelector('[role="alert"]')!.textContent).toContain("Phiên bản đã thay đổi");
  });
});
