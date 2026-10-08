import { useRef, useState, type FormEvent } from "react";
import { api, useAppSession, useMutation, useQuery, type Doc } from "./data";

export default function EvidenceScreen({ canWrite }: { canWrite: boolean }) {
  const session = useAppSession();
  const records = useQuery(api.app.listEvidence) as Doc<"evidence">[] | undefined;
  const upsert = useMutation(api.app.upsertEvidence);
  const remove = useMutation(api.app.removeEvidence);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(""); setError("");
    if (!code.trim() || !title.trim()) { setError("Nhập mã và tên bằng chứng."); return; }
    setBusy(true);
    try {
      const chosen = file.current?.files?.[0];
      if (chosen) await session.uploadEvidence(chosen, code.trim(), title.trim());
      else {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:") throw new Error("Đường dẫn nguồn phải dùng HTTPS.");
        await upsert({ data: { code: code.trim(), title: title.trim(), sourceUrl: parsed.href, description, sha256: "", filePath: "", fileName: "", size: 0, mimeType: "" } });
      }
      setMessage("Đã đăng ký bằng chứng. Dùng mã này khi nhập và duyệt dữ liệu.");
      setCode(""); setTitle(""); setUrl(""); setDescription("");
      if (file.current) file.current.value = "";
    } catch (ex) { setError(ex instanceof Error ? ex.message : "Không lưu được bằng chứng."); }
    finally { setBusy(false); }
  };
  return <section className="screen">
    <header className="screen-head"><div><h2>Sổ bằng chứng</h2><p className="text-secondary">Đăng ký hóa đơn, biên bản, kết quả đo và nguồn tham chiếu; liên kết với bản ghi bằng mã bằng chứng.</p></div></header>
    <div className="card callout"><div><strong>Truy xuất tài liệu nguồn</strong><p>Tệp tải lên có checksum SHA-256. Trong chế độ trực tuyến, tệp nằm trong kho riêng của doanh nghiệp và được mở bằng liên kết có thời hạn. Với đường dẫn bên ngoài, doanh nghiệp chịu trách nhiệm kiểm soát quyền truy cập và lưu phiên bản nguồn.</p>{session.mode === "sandbox" && <p>Tệp thử nghiệm chỉ mở được trong phiên hiện tại; sau tải lại trang cần tải tệp lại. Dùng liên kết HTTPS để thử lưu metadata lâu dài. Dữ liệu thật cần kết nối Supabase.</p>}</div></div>
    {canWrite && <form className="card form-card" onSubmit={submit}>
      <h3>Thêm bằng chứng</h3>
      <div className="form-grid">
        <label className="field"><span>Mã bằng chứng *</span><input className="input" value={code} onChange={e => setCode(e.target.value)} required maxLength={120} placeholder="2026-10_CS01_E01_v01" /></label>
        <label className="field"><span>Tên tài liệu *</span><input className="input" value={title} onChange={e => setTitle(e.target.value)} required maxLength={240} /></label>
        <label className="field"><span>Tệp nguồn (tối đa 10 MiB)</span><input className="input" ref={file} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.xlsx" /></label>
        <label className="field"><span>Hoặc đường dẫn HTTPS</span><input className="input" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" /></label>
        <label className="field span2"><span>Mô tả nguồn, kỳ và phạm vi</span><textarea className="input" value={description} onChange={e => setDescription(e.target.value)} maxLength={4000} rows={3} /></label>
      </div>
      <button className="button button-primary" disabled={busy}>{busy ? "Đang lưu…" : "Đăng ký bằng chứng"}</button>
    </form>}
    {error && <p className="error-text" role="alert">{error}</p>}
    {message && <p className="text-secondary" role="status">{message}</p>}
    {records === undefined ? <div className="card empty">Đang tải bằng chứng…</div> : records.length === 0 ? <div className="card empty">Chưa có bằng chứng. Đăng ký tài liệu trước khi duyệt số liệu.</div> : <div className="card table-wrap"><table className="tbl"><thead><tr><th>Mã</th><th>Tên / nguồn</th><th>Checksum SHA-256</th><th>Thao tác</th></tr></thead><tbody>{records.map(row => <tr key={row._id}><td>{row.code}</td><td><strong>{row.title}</strong><p className="text-small text-muted">{row.fileName || row.sourceUrl}</p>{row.description && <p className="text-small">{row.description}</p>}</td><td className="cell-long"><code>{row.sha256 || "Nguồn ngoài; chưa có checksum"}</code></td><td className="cell-actions"><button className="button small" onClick={async () => { try { setError(""); await session.openEvidence(row); } catch (ex) { setError(ex instanceof Error ? ex.message : "Không mở được tệp."); } }}>Mở nguồn</button>{canWrite && <button className="button small danger" onClick={async () => { if (!confirm(`Xóa bằng chứng ${row.code}? Bằng chứng đã liên kết với số liệu sẽ được giữ.`)) return; try { setError(""); await remove({ id: row._id, expectedVersion: row._version }); } catch (ex) { setError(ex instanceof Error ? ex.message : "Không xóa được."); } }}>Xóa</button>}</td></tr>)}</tbody></table></div>}
  </section>;
}
