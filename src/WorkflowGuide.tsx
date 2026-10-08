import { useRef, useState } from "react";
import { downloadText } from "./resourceDocument";
import { roleGuides, workflowBranches, workflowMarkdown, workflowSteps } from "./workflow";
export default function WorkflowGuide({ go }: { go: (route: string) => void }) {
  const [selected, setSelected] = useState(0), [step, setStep] = useState(0);
  const [role, setRole] = useState<keyof typeof roleGuides>("editor");
  const svg = useRef<SVGSVGElement>(null);
  const branch = workflowBranches[selected], current = workflowSteps[step], guide = roleGuides[role];
  const exportSvg = () => {
    if (!svg.current) return;
    const clone = svg.current.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = ".mindmap-node rect{fill:#f5f2ff;stroke:#7460ac;stroke-width:2}.mindmap-node text{fill:#252033;font:16px system-ui,sans-serif}.mindmap-node .map-title{font-weight:700}.map-line{fill:none;stroke:#aaa0bc;stroke-width:2}.map-center rect{fill:#5f4890}.map-center text{fill:white;font:20px system-ui,sans-serif}";
    clone.prepend(style);
    downloadText("ESG_Hub_so_do_tu_duy.svg", new XMLSerializer().serializeToString(clone), "image/svg+xml;charset=utf-8");
  };
  return <section className="screen workflow-guide">
    <header className="screen-head"><div><h2>Hướng dẫn & sơ đồ thao tác</h2><p className="text-secondary">Bắt đầu từ vai trò của bạn. Chọn nhánh sơ đồ hoặc bước lưu trình để xem thao tác, đầu vào, đầu ra và điểm kiểm.</p></div></header>
    <div className="row wrap gap"><button className="button" onClick={() => downloadText("ESG_Hub_huong_dan.md", workflowMarkdown(), "text/markdown;charset=utf-8")}>Tải hướng dẫn (.md)</button><button className="button" onClick={exportSvg}>Tải mindmap (.svg)</button><button className="button" onClick={() => window.print()}>In hướng dẫn</button></div>
    <section className="card"><h3>Sơ đồ tư duy ESG Hub</h3><p className="text-secondary">Sáu nhóm công việc. Chọn một nhánh để xem và mở màn hình tương ứng.</p>
      <svg ref={svg} className="esg-mindmap" viewBox="0 0 1000 500" aria-label="Sơ đồ tư duy ESG Hub với sáu nhóm công việc">
        <title>Sơ đồ tư duy ESG Hub</title><desc>Hiểu ESG, xây hệ thống, ghi nhận, soát xét và khóa, báo cáo, Kaizen. Dùng Tab và Enter để chọn nhánh.</desc>
        {workflowBranches.map((item, index) => { const left = index < 3, x = left ? 25 : 705, y = 35 + (index % 3) * 160; return <g key={item.id}>
          <path className="map-line" d={`M ${left ? 405 : 595} 245 C ${left ? 350 : 650} 245 ${left ? 350 : 650} ${y + 45} ${left ? 295 : 705} ${y + 45}`} />
          <g className={`mindmap-node ${selected === index ? "selected" : ""}`} role="button" tabIndex={0} aria-label={`Nhánh ${item.title}`} aria-pressed={selected === index} onClick={() => setSelected(index)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(index); } }}>
            <rect x={x} y={y} width="270" height="90" rx="16"/><text className="map-title" x={x + 20} y={y + 35}>{item.title}</text><text x={x + 20} y={y + 63}>{item.subtitle}</text>
          </g></g>; })}
        <g className="map-center"><rect x="405" y="205" width="190" height="80" rx="18"/><text x="500" y="240" textAnchor="middle">ESG Hub</text><text x="500" y="265" textAnchor="middle">Cùng làm · truy xuất</text></g>
      </svg>
      <div className="mindmap-mobile">{workflowBranches.map((item, index) => <button key={item.id} className={`button ${selected === index ? "button-primary" : ""}`} aria-pressed={selected === index} onClick={() => setSelected(index)}>{item.title}</button>)}</div>
      <div className="map-detail" aria-live="polite"><h4>{branch.title}</h4><p>{branch.detail}</p><p className="text-secondary">{branch.steps.join(" → ")}</p><button className="button" onClick={() => go(branch.route)}>Mở {branch.steps[0]}</button></div>
    </section>
    <section className="card"><h3>Lưu trình từ nguồn đến báo cáo</h3><p className="text-secondary">Chọn bước để xem hướng dẫn chi tiết bên dưới. Đầu ra của bước trước là đầu vào của bước sau.</p>
      <div className="process-flow" role="group" aria-label="Tám bước thao tác">{workflowSteps.map((item, index) => <button key={item.title} className={`flow-step ${index === step ? "selected" : ""}`} aria-pressed={index === step} onClick={() => setStep(index)}><span className="flow-number">{index + 1}</span><span>{item.title}</span></button>)}</div>
      <div className="review-loop"><strong>Quyết định ở bước 5:</strong> Đúng nguồn và đủ điều kiện → bước 6. Cần sửa → <button className="text-link" onClick={() => setStep(3)}>↺ trở lại bước 4, sửa rồi duyệt lại</button>.</div>
      <p className="text-secondary">Sửa sau khóa/phát hành: bước 8 → mở kỳ có lý do → bước 4 → 5 → 6 → báo cáo phiên bản mới ở bước 7. Giữ bản đã phát hành.</p>
    </section>
    <section className="card"><label className="field role-guide"><span className="text-label">Tôi đang làm vai trò</span><select className="input" aria-label="Tôi đang làm vai trò" value={role} onChange={event => setRole(event.target.value as keyof typeof roleGuides)}>{Object.entries(roleGuides).map(([key, item]) => <option value={key} key={key}>{item.label}</option>)}</select></label><p>{guide.description}</p><p className="text-small text-muted">Lựa chọn này chỉ đổi hướng dẫn, không thay đổi quyền của tài khoản.</p><div className="row wrap gap">{guide.steps.map(index => <button className="button" key={index} onClick={() => setStep(index)}>Bước {index + 1}</button>)}</div></section>
    <section className="card step-detail" aria-live="polite"><span className="pill">Bước {step + 1} / 8</span><h3>{current.title}</h3><p className="text-secondary">Màn hình: {current.screen}</p><dl><dt>Thao tác</dt><dd>{current.action}</dd><dt>Chuẩn bị đầu vào</dt><dd>{current.inputs}</dd><dt>Kết quả cần có</dt><dd>{current.output}</dd><dt>Điểm kiểm trước khi chuyển bước</dt><dd>{current.check}</dd></dl><div className="row wrap gap"><button className="button button-primary" onClick={() => go(current.route)}>Đến màn hình thực hiện</button><button className="button" disabled={step === 0} onClick={() => setStep(step - 1)}>Bước trước</button><button className="button" disabled={step === 7} onClick={() => setStep(step + 1)}>Bước tiếp</button></div></section>
    <section className="card guide-print-only"><h3>Hướng dẫn đủ tám bước</h3>{workflowSteps.map((item, index) => <section key={item.title}><h4>{index + 1}. {item.title}</h4><p>{item.action}</p><p><strong>Đầu vào:</strong> {item.inputs}</p><p><strong>Đầu ra:</strong> {item.output}</p><p><strong>Điểm kiểm:</strong> {item.check}</p></section>)}</section>
    <section className="card"><h3>Quy tắc ghi nhận nhanh</h3><ul className="guide-rules"><li>Một kỳ + cơ sở + KPI + nguồn = một bản ghi; sửa có phiên bản, không nhập trùng.</li><li>Số 0 phải có nguồn; dữ liệu thiếu để trống và ghi lý do; ước tính ghi phương pháp.</li><li>Tỷ lệ dùng tổng tử/mẫu; số cuối kỳ không cộng các tháng.</li><li>KNK dùng hệ số đúng đơn vị/năm/địa lý; không cộng hai phương pháp Scope 2.</li><li>Người soát xét đối chiếu nguồn, người lập không tự duyệt trong cloud.</li><li>Nội dung, chỉ mục và phê duyệt báo cáo cần kiểm thêm bên cạnh bảng số liệu.</li></ul><div className="row wrap gap"><button className="button" onClick={() => go("report-kit")}>Khung báo cáo ESG</button><button className="button" onClick={() => go("report-example")}>Báo cáo tham chiếu</button><button className="button" onClick={() => go("project-audit")}>Audit & Kaizen</button></div></section>
  </section>;
}
