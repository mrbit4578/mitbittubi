import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "./data";
import { downloadXlsx, readXlsx, mapSheetRows, excelSerialToISO, type Cell, type Sheet } from "./xlsx";

export type Option = { value: string; label: string };
export type Col = {
  key: string; label: string;
  type?: "text" | "number" | "nullable-number" | "select" | "textarea" | "date" | "boolean";
  options?: Option[]; required?: boolean; table?: boolean; filter?: boolean; help?: string; width?: number;
  readonly?: boolean; min?: number; max?: number;
};
export type AnyRow = Record<string, unknown> & { _id: string; _version?: number };
export type CrudFns = { list: string; upsert: string; remove: string; removeMany: string; bulk: string };
export const IMPORT_ROW_LIMIT = 200;
export const optionLabel = (col: Col, v: unknown) => col.options?.find((o) => o.value === v)?.label ?? String(v ?? "");

/** Reject invalid data rather than substituting zeros, enum defaults or false. */
export function coerce(col: Col, raw: unknown): unknown {
  const text = raw === null || raw === undefined ? "" : String(raw);
  const s = text.trim();
  if (col.required && !s) throw new Error(`${col.label}: trường bắt buộc bị trống.`);
  switch (col.type) {
    case "number":
    case "nullable-number": {
      if (!s && col.type === "nullable-number" && !col.required) return null;
      if (!s || !/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?$/i.test(s)) throw new Error(`${col.label}: phải là số hợp lệ; không dùng dấu phân cách hàng nghìn.`);
      const n = Number(s.replace(",", "."));
      if (!Number.isFinite(n)) throw new Error(`${col.label}: phải là số hữu hạn.`);
      const min = col.min ?? 0;
      if (n < min || (col.max !== undefined && n > col.max)) throw new Error(`${col.label}: giá trị phải từ ${min}${col.max === undefined ? " trở lên" : ` đến ${col.max}`}.`);
      return n;
    }
    case "boolean": {
      if (typeof raw === "boolean") return raw;
      const normalized = s.toLowerCase();
      if (["true", "1", "x", "có", "co", "yes"].includes(normalized)) return true;
      if (["false", "0", "không", "khong", "no"].includes(normalized)) return false;
      throw new Error(`${col.label}: dùng TRUE/FALSE, 1/0 hoặc Có/Không.`);
    }
    case "select": {
      const hit = col.options?.find((o) => o.value === s) ?? col.options?.find((o) => o.label.toLowerCase() === s.toLowerCase());
      if (!hit) throw new Error(`${col.label}: giá trị không hợp lệ (${s || "trống"}).`);
      return hit.value;
    }
    case "date": {
      if (!s) return "";
      if (/^\d+(?:\.\d+)?$/.test(s)) return excelSerialToISO(Number(s));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error(`${col.label}: dùng ngày YYYY-MM-DD.`);
      const d = new Date(`${s}T00:00:00Z`);
      if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== s) throw new Error(`${col.label}: ngày không tồn tại.`);
      return s;
    }
    default: return text;
  }
}

/** Deliberate creation defaults only. Imported blanks never use these values. */
export function emptyRow(cols: Col[], defaults: Record<string, unknown> = {}): Record<string, unknown> {
  const r: Record<string, unknown> = { ...defaults };
  for (const c of cols) {
    if (Object.prototype.hasOwnProperty.call(defaults, c.key)) continue;
    r[c.key] = c.type === "select" ? c.options?.[0]?.value ?? "" : c.type === "boolean" ? false : c.type === "number" ? c.min ?? 0 : c.type === "nullable-number" ? null : "";
  }
  return r;
}

export function stripRow(cols: Col[], row: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const c of cols) if (!c.readonly) out[c.key] = coerce(c, row[c.key]);
  return out;
}

export function rowData(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).filter(([key]) => !key.startsWith("_")));
}

export function toSheetRows(cols: Col[], rows: Record<string, unknown>[]): Cell[][] {
  return [cols.map((c) => c.label), ...rows.map((r) => cols.map((c) => {
    const v = r[c.key];
    if (c.type === "select") return optionLabel(c, v);
    if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
    return (v as Cell) ?? "";
  }))];
}

export function importKey(cols: Col[], row: Record<string, unknown>): string | null {
  const available = new Set(cols.map((c) => c.key));
  const keys = ["period", "date", "facility", "kpiCode", "source"].every((k) => available.has(k)) ? ["period", "date", "facility", "kpiCode", "source"]
    : ["period", "scope", "category", "source"].every((k) => available.has(k)) ? ["period", "scope", "category", "source"]
    : available.has("code") ? ["code"] : null;
  return keys ? JSON.stringify(keys.map((k) => String(row[k] ?? "").trim())) : null;
}

export type ImportIssue = { rowNumber: number; message: string };
export type ImportPreview = { rows: Record<string, unknown>[]; sourceRows: Record<string, string>[]; rowNumbers: number[]; issues: ImportIssue[]; sheetName: string; otherSheets: string[]; blankRows: number };
export function validateImportRows(rows: string[][], cols: Col[]): Omit<ImportPreview, "sheetName" | "otherSheets"> {
  const mapped = mapSheetRows(rows, cols);
  const issues: ImportIssue[] = [];
  const parsed: Record<string, unknown>[] = [];
  const keys = new Map<string, number>();
  for (const entry of mapped.rows) {
    const row: Record<string, unknown> = {};
    for (const col of cols) {
      // Readonly columns are shown in the preview, while the backend owns their stored values.
      if (col.readonly) continue;
      try { row[col.key] = coerce(col, entry.data[col.key]); }
      catch (error) { issues.push({ rowNumber: entry.rowNumber, message: error instanceof Error ? error.message : String(error) }); }
    }
    const key = importKey(cols, row);
    if (key !== null) {
      const previous = keys.get(key);
      if (previous !== undefined) issues.push({ rowNumber: entry.rowNumber, message: `Khóa bản ghi trùng với dòng ${previous}. Hãy giữ một bản ghi cho mỗi nguồn/kỳ.` });
      else keys.set(key, entry.rowNumber);
    }
    parsed.push(row);
  }
  if (mapped.rows.length > IMPORT_ROW_LIMIT) issues.push({ rowNumber: 0, message: `Tệp có ${mapped.rows.length} dòng. Mỗi lần nhập tối đa ${IMPORT_ROW_LIMIT} dòng để lưu toàn bộ trong một giao dịch; hãy chia tệp trước khi nhập.` });
  if (mapped.rows.length === 0) issues.push({ rowNumber: 0, message: "Không có dòng dữ liệu nào trong tệp." });
  return { rows: parsed, sourceRows: mapped.rows.map((r) => r.data), rowNumbers: mapped.rows.map((r) => r.rowNumber), issues, blankRows: mapped.blankRows };
}

export async function previewImportFile(file: File, cols: Col[]): Promise<ImportPreview> {
  if (!file.name.toLowerCase().endsWith(".xlsx")) throw new Error("Chỉ chấp nhận tệp .xlsx.");
  const sheets = await readXlsx(file);
  if (sheets.length === 0) throw new Error("Tệp không có sheet nào.");
  return { ...validateImportRows(sheets[0].rows, cols), sheetName: sheets[0].name, otherSheets: sheets.slice(1).map((s) => s.name) };
}

/** Parsing only; callers must obtain explicit confirmation before any mutation. */
export async function importFile(file: File, cols: Col[]): Promise<Record<string, unknown>[]> {
  const preview = await previewImportFile(file, cols);
  if (preview.issues.length) throw new Error(preview.issues.map((i) => `${i.rowNumber ? `Dòng ${i.rowNumber}: ` : ""}${i.message}`).join("\n"));
  return preview.rows;
}

export function Field({ col, value, onChange, disabled }: { col: Col; value: unknown; onChange: (v: unknown) => void; disabled?: boolean }) {
  const common = { className: "input", disabled: disabled || col.readonly, id: `f-${col.key}`, required: col.required, "aria-label": col.label };
  const v = value === null || value === undefined ? "" : String(value);
  if (col.type === "select") return (
    <select {...common} value={v} onChange={(e) => onChange(e.target.value)}>
      <option value="">Chọn {col.label.toLowerCase()}</option>
      {(col.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
  if (col.type === "textarea") return <textarea {...common} rows={3} value={v} onChange={(e) => onChange(e.target.value)} />;
  if (col.type === "boolean") return <input id={common.id} aria-label={col.label} type="checkbox" disabled={common.disabled} checked={value === true} onChange={(e) => onChange(e.target.checked)} />;
  if (col.type === "number" || col.type === "nullable-number") return <input {...common} type="number" step="any" min={col.min ?? 0} max={col.max} value={v} onChange={(e) => onChange(e.target.value)} />;
  if (col.type === "date") return <input {...common} type="date" value={v} onChange={(e) => onChange(e.target.value)} />;
  return <input {...common} type="text" value={v} onChange={(e) => onChange(e.target.value)} />;
}

export function RecordForm({ cols, initial, onSave, onCancel, title, disabled = false }: {
  cols: Col[]; initial: Record<string, unknown>; onSave: (row: Record<string, unknown>) => Promise<void>; onCancel: () => void; title: string; disabled?: boolean;
}) {
  const [row, setRow] = useState<Record<string, unknown>>(initial);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled || !e.currentTarget.reportValidity()) return;
    setBusy(true); setErr(null);
    try { await onSave({ ...initial, ...stripRow(cols, row) }); }
    catch (ex) { setErr(ex instanceof Error ? ex.message : "Không lưu được."); }
    finally { setBusy(false); }
  };
  return (
    <form className="card form-card" onSubmit={submit}>
      <div className="row between"><h3>{title}</h3><button type="button" className="button" disabled={busy} onClick={onCancel}>Đóng</button></div>
      <div className="form-grid">
        {cols.map((c) => (
          <label key={c.key} className={`field ${c.type === "textarea" ? "span2" : ""}`}>
            <span className="text-label">{c.label}{c.required ? " *" : ""}{c.readonly ? " (tự tính / chỉ đọc)" : ""}</span>
            <Field col={c} value={row[c.key]} disabled={busy || disabled} onChange={(v) => setRow((r) => ({ ...r, [c.key]: v }))} />
            {c.help && <span className="text-small text-muted">{c.help}</span>}
          </label>
        ))}
      </div>
      {err && <p className="error-text" role="alert">{err}</p>}
      {disabled && <p role="status">Bản ghi đã được khóa; không thể lưu thay đổi.</p>}
      <div className="row end"><button type="submit" className="button button-primary" disabled={busy || disabled}>{busy ? "Đang lưu…" : "Lưu"}</button></div>
    </form>
  );
}

export function ImportExportBar({ cols, rows, fileName, bulk, canWrite, sample, existingRows }: {
  cols: Col[]; rows: Record<string, unknown>[]; existingRows?: Record<string, unknown>[]; fileName: string; bulk?: (rows: Record<string, unknown>[]) => Promise<{ inserted: number; updated: number }>; canWrite: boolean; sample?: Record<string, unknown>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const exportWorkbook = (name: string, sheets: Sheet[]) => {
    try { downloadXlsx(name, sheets); }
    catch (error) { setMsg(`Lỗi xuất: ${error instanceof Error ? error.message : String(error)}`); }
  };
  const onFile = async (f: File | undefined) => {
    if (!f || !bulk) return;
    setBusy(true); setMsg(null); setPreview(null);
    try {
      const next = await previewImportFile(f, cols);
      const existingKeys = new Set((existingRows ?? rows.filter((row) => row._id)).map((row) => importKey(cols, row)).filter((key): key is string => key !== null));
      for (let i = 0; i < next.rows.length; i++) {
        const key = importKey(cols, next.rows[i]);
        if (key !== null && existingKeys.has(key)) next.issues.push({ rowNumber: next.rowNumbers[i], message: "Khóa bản ghi đã tồn tại. Hãy sửa bản ghi trong ứng dụng để giữ lịch sử và phiên bản." });
      }
      setPreview(next);
    }
    catch (ex) { setMsg(`Lỗi đọc tệp: ${ex instanceof Error ? ex.message : String(ex)}`); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };
  const commit = async () => {
    if (!bulk || !preview || preview.issues.length || busy) return;
    setBusy(true); setMsg(null);
    try {
      const result = await bulk(preview.rows);
      setMsg(`Đã nhập ${preview.rows.length} dòng (thêm ${result.inserted}, cập nhật ${result.updated}).`);
      setPreview(null);
    } catch (ex) { setMsg(`Lỗi nhập; chưa hoàn tất giao dịch: ${ex instanceof Error ? ex.message : String(ex)}`); }
    finally { setBusy(false); }
  };
  return (
    <div className="import-export">
      <div className="row wrap gap">
        <button className="button" onClick={() => exportWorkbook(fileName, [{ name: "Du_lieu", rows: toSheetRows(cols, rows) }])} disabled={rows.length === 0}>Xuất Excel ({rows.length})</button>
        <button className="button" onClick={() => exportWorkbook(`${fileName}_mau`, [{ name: "Mau", rows: toSheetRows(cols, [sample ?? emptyRow(cols)]) }, { name: "Huong_dan", rows: [["Cột", "Kiểu", "Giá trị hợp lệ"], ...cols.map((c) => [c.label, c.type ?? "text", c.options ? c.options.map((o) => o.label).join(" | ") : c.help ?? ""])] }])}>Tải mẫu nhập</button>
        {bulk && canWrite && (
          <>
            <input ref={fileRef} type="file" accept=".xlsx" hidden aria-label="Chọn tệp Excel để xem trước" onChange={(e) => void onFile(e.target.files?.[0])} />
            <button className="button" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? "Đang xử lý…" : "Nhập từ Excel"}</button>
          </>
        )}
        {msg && <span role={msg.startsWith("Lỗi") ? "alert" : "status"} className={`text-small ${msg.startsWith("Lỗi") ? "error-text" : "text-secondary"}`}>{msg}</span>}
      </div>
      {preview && <div className="card import-preview" aria-label="Xem trước dữ liệu nhập">
        <h3>Xem trước {preview.rows.length} dòng · sheet {preview.sheetName}</h3>
        <p className="text-small text-secondary">Chưa ghi dữ liệu. Tối đa 200 dòng/lần; toàn bộ lần nhập được lưu cùng nhau. Mã đã tồn tại sẽ bị từ chối; hãy sửa bản ghi trong ứng dụng.</p>
        {cols.some((c) => c.readonly) && <p className="text-small">Các cột chỉ đọc được hiển thị để đối chiếu; giá trị lưu do hệ thống tính hoặc quản lý.</p>}
        {preview.blankRows > 0 && <p className="text-small">Đã nhận diện {preview.blankRows} dòng hoàn toàn trống.</p>}
        {preview.otherSheets.length > 0 && <p className="text-small">Chỉ nhập sheet đầu tiên. Các sheet còn lại: {preview.otherSheets.join(", ")}.</p>}
        {preview.issues.length > 0 && <div role="alert" className="error-text"><strong>Cần sửa {preview.issues.length} lỗi trước khi nhập:</strong><ul>{preview.issues.map((issue, i) => <li key={i}>{issue.rowNumber ? `Dòng ${issue.rowNumber}: ` : ""}{issue.message}</li>)}</ul></div>}
        <div className="table-wrap"><table className="tbl"><thead><tr><th>Dòng Excel</th>{cols.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead><tbody>{preview.sourceRows.map((row, i) => <tr key={preview.rowNumbers[i]}><td>{preview.rowNumbers[i]}</td>{cols.map((c) => <td key={c.key}>{row[c.key]}</td>)}</tr>)}</tbody></table></div>
        <div className="row end gap"><button className="button" disabled={busy} onClick={() => setPreview(null)}>Hủy nhập</button><button className="button button-primary" disabled={busy || preview.issues.length > 0 || !canWrite} onClick={() => void commit()}>{busy ? "Đang lưu…" : `Xác nhận nhập ${preview.rows.length} dòng`}</button></div>
      </div>}
    </div>
  );
}

export const isLockedRow = (row: AnyRow) => row._locked === true || row.locked === true || row.status === "approved" || row.status === "published";

export function CrudScreen({ title, intro, cols, fns, fileName, canWrite, defaults, summary, actions, rowClass, transform }: {
  title: string; intro?: string; cols: Col[]; fns: CrudFns; fileName: string; canWrite: boolean;
  defaults?: Record<string, unknown>; summary?: (rows: AnyRow[]) => ReactNode; actions?: ReactNode; rowClass?: (row: AnyRow) => string; transform?: (row: Record<string, unknown>) => Record<string, unknown>;
}) {
  const tf = transform ?? ((r: Record<string, unknown>) => r);
  const rows = useQuery(fns.list) as AnyRow[] | undefined;
  const upsert = useMutation(fns.upsert);
  const remove = useMutation(fns.remove);
  const removeMany = useMutation(fns.removeMany);
  const bulk = useMutation(fns.bulk);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSession, setFormSession] = useState(0);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const tableCols = cols.filter((c) => c.table !== false);
  useEffect(() => {
    if (rows) setSelected((current) => new Set([...current].filter((id) => rows.some((r) => r._id === id && !isLockedRow(r)))));
  }, [rows]);
  const visible = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      for (const [k, val] of Object.entries(filters)) if (val && String(r[k]) !== val) return false;
      return !needle || cols.some((c) => String(c.type === "select" ? optionLabel(c, r[c.key]) : r[c.key] ?? "").toLowerCase().includes(needle));
    });
  }, [rows, q, filters, cols]);
  const selectable = visible.filter((r) => !isLockedRow(r));
  const allVisibleSelected = selectable.length > 0 && selectable.every((r) => selected.has(r._id));
  const toggleAll = () => setSelected((current) => {
    const next = new Set(current);
    for (const r of selectable) if (allVisibleSelected) next.delete(r._id); else next.add(r._id);
    return next;
  });
  const deleteSelected = async () => {
    setActionError("");
    if (selected.size > IMPORT_ROW_LIMIT) { setActionError(`Mỗi lần xóa tối đa ${IMPORT_ROW_LIMIT} bản ghi. Bạn đang chọn ${selected.size}; hãy giảm số bản ghi được chọn.`); return; }
    const chosen = (rows ?? []).filter((r) => selected.has(r._id));
    if (!confirm(`Xóa ${chosen.length} bản ghi đã chọn?`)) return;
    setDeleting(true);
    try { await removeMany({ ids: chosen.map((r) => r._id), versions: Object.fromEntries(chosen.map((r) => [r._id, r._version])) }); setSelected(new Set()); }
    catch (ex) { setActionError(ex instanceof Error ? ex.message : "Không xóa được dữ liệu."); }
    finally { setDeleting(false); }
  };
  const deleteOne = async (row: AnyRow) => {
    if (!confirm("Xóa bản ghi này?")) return;
    setActionError(""); setDeleting(true);
    try { await remove({ id: row._id, expectedVersion: row._version }); }
    catch (ex) { setActionError(ex instanceof Error ? ex.message : "Không xóa được bản ghi."); }
    finally { setDeleting(false); }
  };
  return (
    <section className="screen">
      <header className="screen-head">
        <div><h2>{title}</h2>{intro && <p className="text-secondary">{intro}</p>}</div>
        {canWrite && <button className="button button-primary" onClick={() => { setEditing(emptyRow(cols, defaults)); setEditingId(null); setFormSession((s) => s + 1); }}>+ Thêm mới</button>}
      </header>
      {summary && rows && <div className="summary-row">{summary(rows)}</div>}
      <div className="card toolbar">
        <input className="input grow" aria-label={`Tìm kiếm ${title}`} placeholder="Tìm kiếm…" value={q} onChange={(e) => setQ(e.target.value)} />
        {cols.filter((c) => c.filter && c.options).map((c) => (
          <select key={c.key} className="input" aria-label={`Lọc ${c.label}`} value={filters[c.key] ?? ""} onChange={(e) => setFilters((f) => ({ ...f, [c.key]: e.target.value }))}>
            <option value="">{c.label}: tất cả</option>
            {c.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        <ImportExportBar cols={cols} rows={visible} existingRows={rows ?? []} fileName={fileName} canWrite={canWrite} sample={defaults ? emptyRow(cols, defaults) : undefined}
          bulk={async (rs) => (await bulk({ rows: rs.map(tf) })) as { inserted: number; updated: number }} />
        {actions}
        {canWrite && selected.size > 0 && <button className="button danger" disabled={deleting} onClick={() => void deleteSelected()}>Xóa đã chọn ({selected.size})</button>}
      </div>
      {actionError && <p role="alert" className="error-text">{actionError}</p>}
      {editing && <RecordForm key={`${fns.list}:${editingId ?? "new"}:${formSession}`} cols={cols} initial={editing} disabled={!canWrite || Boolean(editingId && rows?.some((r) => r._id === editingId && isLockedRow(r)))} title={editingId ? "Cập nhật bản ghi" : "Thêm bản ghi"} onCancel={() => setEditing(null)}
        onSave={async (row) => { await upsert(editingId ? { id: editingId, data: tf(rowData(row)), expectedVersion: editing._version } : { data: tf(rowData(row)) }); setEditing(null); }} />}
      {rows === undefined ? <div className="card empty">Đang tải dữ liệu…</div>
        : visible.length === 0 ? <div className="card empty">{rows.length === 0 ? "Chưa có dữ liệu. Thêm mới hoặc nhập từ Excel." : "Không có kết quả phù hợp."}</div>
        : <div className="card table-wrap"><table className="tbl">
          <thead><tr>{canWrite && <th><input type="checkbox" aria-label="Chọn tất cả bản ghi có thể sửa đang hiển thị" disabled={!selectable.length || deleting} checked={allVisibleSelected} onChange={toggleAll} /></th>}{tableCols.map((c) => <th key={c.key}>{c.label}</th>)}{canWrite && <th>Thao tác</th>}</tr></thead>
          <tbody>{visible.map((r) => {
            const locked = isLockedRow(r);
            const name = String(r.code ?? r.name ?? r.title ?? r._id);
            return <tr key={r._id} className={rowClass?.(r)}>
              {canWrite && <td><input type="checkbox" aria-label={`Chọn bản ghi ${name}`} disabled={locked || deleting} checked={selected.has(r._id)} onChange={() => setSelected((s) => { const n = new Set(s); n.has(r._id) ? n.delete(r._id) : n.add(r._id); return n; })} /></td>}
              {tableCols.map((c) => {
                const v = r[c.key];
                const text: ReactNode = c.type === "select" ? <span className={`pill pill-${String(v)}`}>{optionLabel(c, v)}</span> : typeof v === "boolean" ? (v ? "✓" : "") : v === null ? <span className="text-muted">—</span> : String(v ?? "");
                return <td key={c.key} className={c.type === "textarea" ? "cell-long" : ""}>{text}</td>;
              })}
              {canWrite && <td className="cell-actions">
                <button className="button small" disabled={locked || deleting} aria-label={`Sửa bản ghi ${name}`} onClick={() => { setEditing({ ...r }); setEditingId(r._id); setFormSession((s) => s + 1); }}>Sửa</button>
                <button className="button small danger" disabled={locked || deleting} aria-label={`Xóa bản ghi ${name}`} onClick={() => void deleteOne(r)}>Xóa</button>
                {locked && <span className="text-small text-muted">Đã khóa</span>}
              </td>}
            </tr>;
          })}</tbody>
        </table></div>}
    </section>
  );
}
