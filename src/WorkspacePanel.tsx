import { useId, useState, type FormEvent } from "react";
import { useAppSession } from "./data";

type InviteRole = "editor" | "reviewer" | "viewer";

const ROLE_NAMES: Record<string, string> = {
  owner: "Chủ không gian",
  editor: "Biên tập viên",
  reviewer: "Người soát xét",
  viewer: "Người xem",
};

export function WorkspacePanel() {
  const session = useAppSession();
  const id = useId();
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteRole>("viewer");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const disabled = session.loading || pending !== null;

  const run = async (action: string, operation: () => Promise<void>, success = "") => {
    if (disabled) return false;
    setPending(action);
    setError(null);
    setMessage("");
    session.clearError();
    try {
      await operation();
      setMessage(success);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thực hiện được. Vui lòng thử lại.");
      return false;
    } finally {
      setPending(null);
    }
  };

  const authenticate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await run("auth", () => signup
      ? session.signup(email.trim(), password)
      : session.login(email.trim(), password), signup
      ? "Đã gửi yêu cầu đăng ký. Nếu cần xác nhận email, hãy mở hộp thư rồi đăng nhập."
      : "Đã đăng nhập.");
    if (success) setPassword("");
  };

  const createWorkspace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspaceName.trim()) return;
    if (await run("create", () => session.createWorkspace(workspaceName.trim()), "Đã tạo không gian làm việc.")) {
      setWorkspaceName("");
    }
  };

  const invite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await run("invite", () => session.invite(inviteEmail.trim(), inviteRole), "Đã tạo lời mời. Thành viên đăng nhập bằng email này để nhận lời mời.")) {
      setInviteEmail("");
    }
  };

  if (session.mode === "sandbox") {
    return (
      <section className="card form-card" aria-labelledby={`${id}-title`} aria-busy={disabled} style={{ borderLeft: "4px solid var(--warning-text)", background: "var(--warning-bg)" }}>
        <h2 id={`${id}-title`} style={{ color: "var(--warning-text)" }}>Chế độ dùng thử — dữ liệu cục bộ</h2>
        <p>Dữ liệu chỉ lưu trong trình duyệt này, không đồng bộ và không chia sẻ giữa các tài khoản.</p>
        <p><strong>Chỉ nhập dữ liệu mẫu. Không nhập dữ liệu thật của nhà máy, tài liệu mật hoặc thông tin cá nhân.</strong></p>
        <p className="text-small">Các không gian bên dưới đều là bản dùng thử cục bộ. Đăng nhập và lời mời thành viên chỉ khả dụng trong chế độ đám mây.</p>
        {(error || session.error) && <p className="error-text" role="alert">{error || session.error}</p>}
        {message && <p role="status">{message}</p>}
        {session.workspaces.length > 0 && <label className="field" htmlFor={`${id}-sandbox-workspace`}>
          <span className="text-label">Không gian dùng thử hiện tại</span>
          <select id={`${id}-sandbox-workspace`} className="input" value={session.workspace?.id ?? ""} disabled={disabled} onChange={(event) => { const workspaceId = event.target.value; if (workspaceId) void run("switch", () => session.switchWorkspace(workspaceId)); }}>
            {!session.workspace && <option value="" disabled>Chọn không gian dùng thử</option>}
            {session.workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
          </select>
        </label>}
        <details>
          <summary className="text-label">Tạo thêm không gian dùng thử</summary>
          <form className="row wrap gap" onSubmit={createWorkspace} style={{ marginTop: 8 }}>
            <label className="field grow" htmlFor={`${id}-sandbox-name`}>
              <span className="text-label">Tên không gian dùng thử</span>
              <input id={`${id}-sandbox-name`} className="input" maxLength={120} required value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} disabled={disabled} placeholder="Ví dụ: Nhà máy mẫu A" />
            </label>
            <button type="submit" className="button button-primary" disabled={disabled || !workspaceName.trim()}>{pending === "create" ? "Đang tạo…" : "Tạo bản dùng thử"}</button>
          </form>
        </details>
      </section>
    );
  }

  return (
    <section className="card form-card" aria-labelledby={`${id}-title`} aria-busy={disabled}>
      <div className="row wrap between">
        <h2 id={`${id}-title`}>Tài khoản & không gian làm việc</h2>
        <span className="badge badge-info">Đám mây</span>
      </div>

      {session.loading && <p className="text-secondary" role="status">Đang tải tài khoản và quyền truy cập…</p>}
      {(error || session.error) && <p className="error-text" role="alert">{error || session.error}</p>}
      {message && <p className="text-secondary" role="status">{message}</p>}

      {!session.loading && !session.user && (
        <>
          <p className="text-secondary">Đăng nhập và chọn không gian làm việc để truy cập dữ liệu. Khi chưa đăng nhập, các thao tác nhập, sửa và xóa dữ liệu đang khóa.</p>
          <form className="form-card" onSubmit={authenticate}>
            <div className="form-grid">
              <label className="field" htmlFor={`${id}-email`}>
                <span className="text-label">Email</span>
                <input id={`${id}-email`} className="input" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={disabled} />
              </label>
              <label className="field" htmlFor={`${id}-password`}>
                <span className="text-label">Mật khẩu{signup ? " (ít nhất 6 ký tự)" : ""}</span>
                <input id={`${id}-password`} className="input" type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 6 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} disabled={disabled} />
              </label>
            </div>
            <div className="row wrap gap end">
              <button type="button" className="button" disabled={disabled} onClick={() => { setSignup(!signup); setError(null); setMessage(""); session.clearError(); }}>
                {signup ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}
              </button>
              <button type="submit" className="button button-primary" disabled={disabled}>
                {pending === "auth" ? "Đang xử lý…" : signup ? "Đăng ký" : "Đăng nhập"}
              </button>
            </div>
          </form>
        </>
      )}

      {session.user && (
        <>
          <div className="row wrap between">
            <p className="text-secondary">{session.user.email}</p>
            <button type="button" className="button" disabled={disabled} onClick={() => { void run("logout", () => session.logout(), "Đã đăng xuất."); }}>
              {pending === "logout" ? "Đang đăng xuất…" : "Đăng xuất"}
            </button>
          </div>

          {session.workspaces.length > 0 ? (
            <div className="form-grid">
              <label className="field" htmlFor={`${id}-workspace`}>
                <span className="text-label">Không gian làm việc hiện tại</span>
                <select id={`${id}-workspace`} className="input" value={session.workspace?.id ?? ""} disabled={disabled} onChange={(event) => { const workspaceId = event.target.value; if (workspaceId) void run("switch", () => session.switchWorkspace(workspaceId)); }}>
                  {!session.workspace && <option value="" disabled>Chọn không gian làm việc</option>}
                  {session.workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name} · {ROLE_NAMES[workspace.role] ?? workspace.role}</option>)}
                </select>
              </label>
              {session.workspace && <div className="field"><span className="text-label">Quyền của bạn</span><p>{ROLE_NAMES[session.workspace.role] ?? session.workspace.role}</p><p className="text-small text-secondary">{session.capabilities.write ? "Có thể nhập và chỉnh sửa dữ liệu." : "Không thể nhập, sửa hoặc xóa dữ liệu."}{session.capabilities.review ? " Có thể soát xét và khóa kỳ dữ liệu." : ""}</p></div>}
            </div>
          ) : <p className="text-secondary">Bạn chưa tham gia không gian làm việc nào. Tạo không gian mới hoặc nhận lời mời bên dưới để mở dữ liệu.</p>}

          <details>
            <summary className="text-label">Tạo không gian làm việc</summary>
            <form className="row wrap gap" onSubmit={createWorkspace} style={{ marginTop: 8 }}>
              <label className="field grow" htmlFor={`${id}-workspace-name`}>
                <span className="text-label">Tên không gian làm việc</span>
                <input id={`${id}-workspace-name`} className="input" maxLength={120} required value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} disabled={disabled} placeholder="Ví dụ: Nhà máy A" />
              </label>
              <button type="submit" className="button button-primary" disabled={disabled || !workspaceName.trim()}>{pending === "create" ? "Đang tạo…" : "Tạo không gian"}</button>
            </form>
          </details>

          {session.invitations.length > 0 && <div className="form-card">
            <h3>Lời mời dành cho bạn</h3>
            {session.invitations.map((invitation) => <div className="row wrap between" key={invitation.id}>
              <p>{invitation.workspace_name} <span className="text-secondary">· {ROLE_NAMES[invitation.role] ?? invitation.role}</span></p>
              <button type="button" className="button button-primary" disabled={disabled} onClick={() => { void run(`accept-${invitation.id}`, () => session.acceptInvitation(invitation.id), "Đã tham gia không gian làm việc."); }}>{pending === `accept-${invitation.id}` ? "Đang nhận…" : "Nhận lời mời"}</button>
            </div>)}
          </div>}

          {session.workspace?.role === "owner" && <details>
            <summary className="text-label">Mời thành viên vào {session.workspace.name}</summary>
            <form className="form-card" onSubmit={invite} style={{ marginTop: 8 }}>
              <div className="form-grid">
                <label className="field" htmlFor={`${id}-invite-email`}>
                  <span className="text-label">Email thành viên</span>
                  <input id={`${id}-invite-email`} className="input" type="email" autoComplete="off" required value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} disabled={disabled} />
                </label>
                <label className="field" htmlFor={`${id}-invite-role`}>
                  <span className="text-label">Vai trò</span>
                  <select id={`${id}-invite-role`} className="input" value={inviteRole} onChange={(event) => setInviteRole(event.target.value as InviteRole)} disabled={disabled}>
                    <option value="viewer">Người xem — chỉ đọc</option>
                    <option value="editor">Biên tập viên — nhập và sửa dữ liệu</option>
                    <option value="reviewer">Người soát xét — kiểm tra và khóa kỳ</option>
                  </select>
                </label>
              </div>
              <p className="text-small text-secondary">Thành viên đăng nhập bằng đúng email được mời để nhận lời mời trong ứng dụng.</p>
              <div className="row end"><button type="submit" className="button button-primary" disabled={disabled}>{pending === "invite" ? "Đang tạo lời mời…" : "Mời thành viên"}</button></div>
            </form>
          </details>}
        </>
      )}
    </section>
  );
}

export default WorkspacePanel;
