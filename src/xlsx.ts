// XLSX exports use inline strings so user-entered text is never executable formula markup.
// ZIP imports validate bounds, sizes and CRC before parsing bounded XML content.
import { inflateSync } from "fflate";

export type Cell = string | number | boolean | null | undefined;
export type Sheet = { name: string; rows: Cell[][] };

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(b: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const esc = (s: string) => {
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/.test(s)) throw new Error("Dữ liệu chứa ký tự không thể biểu diễn trong Excel. Hãy sửa ký tự điều khiển trước khi xuất.");
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = s.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new Error("Dữ liệu chứa ký tự Unicode không hợp lệ.");
    } else if (code >= 0xdc00 && code <= 0xdfff) throw new Error("Dữ liệu chứa ký tự Unicode không hợp lệ.");
  }
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

export function colName(i: number): string {
  let s = "";
  let n = i + 1;
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
function colIndex(ref: string): number {
  let n = 0;
  for (const ch of ref) { if (ch >= "A" && ch <= "Z") n = n * 26 + (ch.charCodeAt(0) - 64); else break; }
  return n - 1;
}

function sheetXml(rows: Cell[][]): string {
  const widths: number[] = [];
  const out: string[] = [];
  rows.forEach((row, r) => {
    const cells: string[] = [];
    row.forEach((val, c) => {
      const len = String(val ?? "").length;
      widths[c] = Math.max(widths[c] ?? 0, Math.min(len, 60));
      if (val === null || val === undefined || val === "") return;
      const ref = `${colName(c)}${r + 1}`;
      const st = r === 0 ? ' s="1"' : "";
      if (typeof val === "number" && Number.isFinite(val)) cells.push(`<c r="${ref}"${st}><v>${val}</v></c>`);
      else if (typeof val === "boolean") cells.push(`<c r="${ref}" t="b"${st}><v>${val ? 1 : 0}</v></c>`);
      else cells.push(`<c r="${ref}" t="inlineStr"${st}><is><t xml:space="preserve">${esc(String(val))}</t></is></c>`);
    });
    out.push(`<row r="${r + 1}">${cells.join("")}</row>`);
  });
  const cols = widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.max(10, w + 2)}" customWidth="1"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>${cols ? `<cols>${cols}</cols>` : ""}<sheetData>${out.join("")}</sheetData></worksheet>`;
}

function zipStored(files: Array<{ name: string; data: Uint8Array }>): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const time = (12 << 11) | (0 << 5) | 0; // 12:00
  const date = ((2026 - 1980) << 9) | (1 << 5) | 1;
  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, crc, true);
    lh.setUint32(18, f.data.length, true); lh.setUint32(22, f.data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, f.data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, crc, true);
    ch.setUint32(20, f.data.length, true); ch.setUint32(24, f.data.length, true); ch.setUint16(28, name.length, true);
    ch.setUint16(30, 0, true); ch.setUint16(32, 0, true); ch.setUint16(34, 0, true); ch.setUint16(36, 0, true); ch.setUint32(38, 0, true); ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + f.data.length;
  }
  const cdSize = central.reduce((a, b) => a + b.length, 0);
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true); eocd.setUint16(4, 0, true); eocd.setUint16(6, 0, true);
  eocd.setUint16(8, files.length, true); eocd.setUint16(10, files.length, true); eocd.setUint32(12, cdSize, true); eocd.setUint32(16, offset, true); eocd.setUint16(20, 0, true);
  const all = [...parts, ...central, new Uint8Array(eocd.buffer)];
  const total = all.reduce((a, b) => a + b.length, 0);
  const result = new Uint8Array(total);
  let p = 0;
  for (const a of all) { result.set(a, p); p += a.length; }
  return result;
}

const safeSheetName = (n: string, i: number) => (n.replace(/[\[\]:*?\/\\]/g, " ").trim().slice(0, 31) || `Sheet${i + 1}`);

export function buildXlsx(sheets: Sheet[]): Uint8Array {
  const enc = new TextEncoder();
  const files: Array<{ name: string; data: Uint8Array }> = [];
  const names = sheets.map((s, i) => safeSheetName(s.name, i));
  files.push({ name: "[Content_Types].xml", data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`) });
  files.push({ name: "_rels/.rels", data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`) });
  files.push({ name: "xl/workbook.xml", data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`) });
  files.push({ name: "xl/_rels/workbook.xml.rels", data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`) });
  files.push({ name: "xl/styles.xml", data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`) });
  sheets.forEach((s, i) => files.push({ name: `xl/worksheets/sheet${i + 1}.xml`, data: enc.encode(sheetXml(s.rows)) }));
  return zipStored(files);
}

export function downloadXlsx(filename: string, sheets: Sheet[]) {
  const bytes = buildXlsx(sheets);
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- Đọc ----------

export const XLSX_LIMITS = {
  fileBytes: 10 * 1024 * 1024,
  expandedBytes: 32 * 1024 * 1024,
  entryBytes: 8 * 1024 * 1024,
  entries: 256,
  sheets: 32,
  rows: 10000,
  columns: 128,
  cellCharacters: 32767,
} as const;

export function unzipXlsx(buf: ArrayBuffer): Map<string, Uint8Array> {
  if (buf.byteLength > XLSX_LIMITS.fileBytes) throw new Error("Tệp Excel vượt giới hạn 10 MB.");
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);
  const bounds = (offset: number, size: number) => {
    if (!Number.isSafeInteger(offset) || offset < 0 || size < 0 || offset + size > u8.length) throw new Error("Cấu trúc ZIP bị hỏng hoặc bị cắt.");
  };
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50 && i + 22 + dv.getUint16(i + 20, true) === u8.length) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Tệp không phải .xlsx hợp lệ.");
  const count = dv.getUint16(eocd + 10, true);
  const directorySize = dv.getUint32(eocd + 12, true);
  const directoryOffset = dv.getUint32(eocd + 16, true);
  if (dv.getUint16(eocd + 4, true) !== 0 || dv.getUint16(eocd + 6, true) !== 0 || dv.getUint16(eocd + 8, true) !== count || count === 65535 || directoryOffset === 0xffffffff) throw new Error("ZIP nhiều đĩa hoặc ZIP64 không được hỗ trợ.");
  if (count === 0 || count > XLSX_LIMITS.entries) throw new Error("Tệp Excel có quá nhiều thành phần ZIP (tối đa 256).");
  bounds(directoryOffset, directorySize);
  if (directoryOffset + directorySize !== eocd) throw new Error("Danh mục ZIP không hợp lệ.");
  let p = directoryOffset;
  let expanded = 0;
  const out = new Map<string, Uint8Array>();
  const dec = new TextDecoder("utf-8", { fatal: true });
  for (let i = 0; i < count; i++) {
    bounds(p, 46);
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error("Danh mục ZIP bị hỏng.");
    const flags = dv.getUint16(p + 8, true);
    const method = dv.getUint16(p + 10, true);
    const checksum = dv.getUint32(p + 16, true);
    const compSize = dv.getUint32(p + 20, true);
    const size = dv.getUint32(p + 24, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const localOff = dv.getUint32(p + 42, true);
    bounds(p, 46 + nameLen + extraLen + commentLen);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nameLen));
    if (!name || name.startsWith("/") || name.includes("\\") || name.split("/").includes("..") || name.includes("\0") || out.has(name)) throw new Error("Tên thành phần ZIP không hợp lệ hoặc trùng lặp.");
    if ((flags & 0x41) !== 0) throw new Error("Không nhập được tệp Excel có mật khẩu.");
    if (size === 0xffffffff || compSize === 0xffffffff || size > XLSX_LIMITS.entryBytes || expanded + size > XLSX_LIMITS.expandedBytes || (size > 1024 * 1024 && size > Math.max(compSize, 1) * 250)) throw new Error("Tệp Excel vượt giới hạn giải nén an toàn.");
    bounds(localOff, 30);
    if (dv.getUint32(localOff, true) !== 0x04034b50 || dv.getUint16(localOff + 8, true) !== method || dv.getUint16(localOff + 6, true) !== flags) throw new Error("Tiêu đề ZIP không khớp danh mục.");
    const lNameLen = dv.getUint16(localOff + 26, true);
    const lExtraLen = dv.getUint16(localOff + 28, true);
    bounds(localOff, 30 + lNameLen + lExtraLen);
    if (dec.decode(u8.subarray(localOff + 30, localOff + 30 + lNameLen)) !== name) throw new Error("Tên ZIP không khớp danh mục.");
    const start = localOff + 30 + lNameLen + lExtraLen;
    bounds(start, compSize);
    if (start + compSize > directoryOffset) throw new Error("Dữ liệu ZIP chồng lên danh mục.");
    const comp = u8.subarray(start, start + compSize);
    let data: Uint8Array;
    if (method === 0) {
      if (compSize !== size) throw new Error("Kích thước ZIP không khớp.");
      data = comp.slice();
    } else if (method === 8) {
      try { data = inflateSync(comp, { out: new Uint8Array(size) }); }
      catch { throw new Error("Không giải nén được thành phần Excel."); }
    } else throw new Error("Phương thức nén trong tệp không được hỗ trợ.");
    if (data.length !== size || crc32(data) !== checksum) throw new Error("Kiểm tra toàn vẹn ZIP thất bại (CRC/kích thước).");
    expanded += size;
    out.set(name, data);
    p += 46 + nameLen + extraLen + commentLen;
  }
  if (p !== directoryOffset + directorySize) throw new Error("Kích thước danh mục ZIP không khớp.");
  return out;
}

const parseXml = (bytes: Uint8Array): Document => {
  const xml = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("XML có khai báo thực thể không được phép.");
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("XML trong tệp Excel không hợp lệ.");
  return doc;
};
const textOf = (el: Element | undefined | null) => {
  if (!el) return "";
  const ts = el.getElementsByTagNameNS("*", "t");
  let s = "";
  for (let i = 0; i < ts.length; i++) s += ts[i].textContent ?? "";
  return s;
};

function workbookTarget(target: string): string {
  const parts = (target.startsWith("/") ? target.slice(1) : `xl/${target}`).split("/");
  const resolved: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") { if (!resolved.length) throw new Error("Đường dẫn sheet không hợp lệ."); resolved.pop(); }
    else resolved.push(part);
  }
  const name = resolved.join("/");
  if (!name.startsWith("xl/")) throw new Error("Sheet nằm ngoài workbook.");
  return name;
}

export async function readXlsx(file: File): Promise<Array<{ name: string; rows: string[][] }>> {
  if (file.size > XLSX_LIMITS.fileBytes) throw new Error("Tệp Excel vượt giới hạn 10 MB.");
  const files = unzipXlsx(await file.arrayBuffer());
  const wbBytes = files.get("xl/workbook.xml");
  if (!wbBytes) throw new Error("Không tìm thấy workbook trong tệp.");
  const wb = parseXml(wbBytes);
  if (["1", "true"].includes(wb.getElementsByTagNameNS("*", "workbookPr")[0]?.getAttribute("date1904") ?? "")) throw new Error("Workbook dùng hệ ngày 1904; hãy chuyển sang hệ ngày 1900 trước khi nhập.");
  const relsBytes = files.get("xl/_rels/workbook.xml.rels");
  const rels = new Map<string, string>();
  if (relsBytes) {
    const rd = parseXml(relsBytes).getElementsByTagNameNS("*", "Relationship");
    for (let i = 0; i < rd.length; i++) {
      const id = rd[i].getAttribute("Id") ?? "";
      if (!id || rels.has(id)) throw new Error("Workbook có quan hệ trùng hoặc thiếu mã.");
      if (rd[i].getAttribute("TargetMode") === "External") continue;
      rels.set(id, rd[i].getAttribute("Target") ?? "");
    }
  }
  const shared: string[] = [];
  const ssBytes = files.get("xl/sharedStrings.xml");
  if (ssBytes) {
    const si = parseXml(ssBytes).getElementsByTagNameNS("*", "si");
    for (let i = 0; i < si.length; i++) shared.push(textOf(si[i]));
  }
  const sheetEls = wb.getElementsByTagNameNS("*", "sheet");
  if (sheetEls.length === 0 || sheetEls.length > XLSX_LIMITS.sheets) throw new Error("Workbook phải có từ 1 đến 32 sheet.");
  const result: Array<{ name: string; rows: string[][] }> = [];
  for (let s = 0; s < sheetEls.length; s++) {
    const el = sheetEls[s];
    const rid = el.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") ?? el.getAttribute("r:id") ?? "";
    const target = rels.get(rid);
    if (!target) throw new Error(`Không tìm thấy liên kết sheet ${s + 1}.`);
    const bytes = files.get(workbookTarget(target));
    if (!bytes) throw new Error(`Không tìm thấy dữ liệu sheet ${s + 1}.`);
    const doc = parseXml(bytes);
    const rowEls = doc.getElementsByTagNameNS("*", "row");
    const rows: string[][] = [];
    for (let r = 0; r < rowEls.length; r++) {
      const rowEl = rowEls[r];
      const rawRn = rowEl.getAttribute("r");
      const rn = rawRn ? Number(rawRn) : rows.length + 1;
      if (!Number.isInteger(rn) || rn <= rows.length || rn > XLSX_LIMITS.rows) throw new Error("Chỉ số dòng Excel không hợp lệ hoặc vượt 10.000 dòng.");
      while (rows.length < rn - 1) rows.push([]);
      const arr: string[] = [];
      const cells = rowEl.getElementsByTagNameNS("*", "c");
      const seen = new Set<number>();
      for (let c = 0; c < cells.length; c++) {
        const cell = cells[c];
        const ref = cell.getAttribute("r") ?? "";
        if (ref && (!/^[A-Z]+[1-9]\d*$/.test(ref) || Number(ref.match(/\d+$/)?.[0]) !== rn)) throw new Error(`Địa chỉ ô không hợp lệ tại dòng ${rn}.`);
        const ci = ref ? colIndex(ref) : arr.length;
        if (ci < 0 || ci >= XLSX_LIMITS.columns || seen.has(ci)) throw new Error(`Dòng ${rn} có cột trùng hoặc vượt 128 cột.`);
        seen.add(ci);
        if (cell.getElementsByTagNameNS("*", "f").length) throw new Error(`Dòng ${rn}, cột ${colName(ci)} có công thức. Hãy dán giá trị trước khi nhập.`);
        const t = cell.getAttribute("t");
        const vEl = cell.getElementsByTagNameNS("*", "v")[0];
        let val = "";
        if (t === "s") {
          const index = Number(vEl?.textContent);
          if (!Number.isInteger(index) || index < 0 || index >= shared.length) throw new Error(`Chuỗi dùng chung không hợp lệ tại dòng ${rn}.`);
          val = shared[index];
        } else if (t === "inlineStr") val = textOf(cell.getElementsByTagNameNS("*", "is")[0]);
        else if (t === "b") {
          if (vEl?.textContent !== "1" && vEl?.textContent !== "0") throw new Error(`Giá trị boolean không hợp lệ tại dòng ${rn}.`);
          val = vEl.textContent === "1" ? "TRUE" : "FALSE";
        } else if (t === "e") throw new Error(`Ô lỗi Excel tại dòng ${rn}, cột ${colName(ci)}.`);
        else val = vEl?.textContent ?? "";
        if (val.length > XLSX_LIMITS.cellCharacters) throw new Error(`Ô tại dòng ${rn} vượt 32.767 ký tự.`);
        while (arr.length < ci) arr.push("");
        arr[ci] = val;
      }
      rows.push(arr);
    }
    result.push({ name: el.getAttribute("name") ?? `Sheet${s + 1}`, rows });
  }
  return result;
}

/** Excel 1900 date system. The fictitious 1900-02-29 is rejected. */
export function excelSerialToISO(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n === 60 || n > 2958465) throw new Error("Ngày serial Excel không hợp lệ.");
  const d = new Date(Date.UTC(1899, 11, 31) + (n > 60 ? n - 1 : n) * 86400000);
  return d.toISOString().slice(0, 10);
}

export const normalizeHeader = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "");

export type MappedRow = { rowNumber: number; data: Record<string, string> };
export function mapSheetRows(rows: string[][], columns: Array<{ key: string; label: string }>): { rows: MappedRow[]; blankRows: number } {
  if (rows.length === 0) throw new Error("Sheet không có dòng tiêu đề.");
  const header = rows[0].map(normalizeHeader);
  const occupied = new Set<string>();
  const matched = new Set<string>();
  const map: Array<{ idx: number; key: string }> = [];
  for (let idx = 0; idx < header.length; idx++) {
    const h = header[idx];
    if (!h) throw new Error(`Tiêu đề cột ${colName(idx)} bị trống.`);
    if (occupied.has(h)) throw new Error(`Tiêu đề cột bị trùng: ${rows[0][idx]}.`);
    occupied.add(h);
    const col = columns.find((c) => h === normalizeHeader(c.label) || h === normalizeHeader(c.key));
    if (!col) throw new Error(`Cột không được nhận diện: ${rows[0][idx]}. Hãy dùng mẫu đúng màn hình.`);
    if (matched.has(col.key)) throw new Error(`Hai cột cùng ánh xạ tới ${col.label}.`);
    matched.add(col.key);
    map.push({ idx, key: col.key });
  }
  const missing = columns.filter((c) => !matched.has(c.key));
  if (missing.length) throw new Error(`Thiếu cột: ${missing.map((c) => c.label).join(", ")}. Hãy tải mẫu và giữ nguyên tiêu đề.`);
  const out: MappedRow[] = [];
  let blankRows = 0;
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    if (row.every((c) => !String(c ?? "").trim())) { blankRows++; continue; }
    if (row.slice(header.length).some((c) => String(c ?? "").trim())) throw new Error(`Dòng ${r + 1} có dữ liệu ngoài cột tiêu đề.`);
    const data: Record<string, string> = {};
    for (const m of map) data[m.key] = row[m.idx] ?? "";
    out.push({ rowNumber: r + 1, data });
  }
  return { rows: out, blankRows };
}

/** Strict template mapping. Blank lines are counted by mapSheetRows. */
export function rowsToObjects(rows: string[][], columns: Array<{ key: string; label: string }>): Array<Record<string, string>> {
  return mapSheetRows(rows, columns).rows.map((row) => row.data);
}
