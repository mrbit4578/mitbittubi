import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_KPIS, DEFAULT_TASKS, DEFAULT_ROADMAP, DEFAULT_TOPICS, DEFAULT_REQUIREMENTS } from "./defaults";
import { api, blankRow, createSandbox, mutateSandbox, periodContains, presentSandboxRow, TABLE_API, TABLE_NAMES, type AnyDoc, type AuditEvent, type Doc, type Role, type SandboxStore, type SandboxWorkspace, type TableName, type Workspace } from "./models";

export { api };
export type { Doc } from "./models";
export type ApiFunction = string;
type Invitation = { id: string; workspace_name: string; role: Role };
type User = { id: string; email: string };
type Cache = Record<string, any>;
type AppSession = {
  capabilities: { write: boolean; review: boolean; admin: boolean };
  workspace: Workspace | null;
  workspaces: Workspace[];
  mode: "cloud" | "sandbox";
  error: string | null;
  user: User | null;
  loading: boolean;
  invitations: Invitation[];
  login(email: string, password: string): Promise<void>;
  signup(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  createWorkspace(name: string): Promise<void>;
  switchWorkspace(id: string): Promise<void>;
  invite(email: string, role: Role): Promise<void>;
  acceptInvitation(id: string): Promise<void>;
  clearError(): void;
  uploadEvidence(file: File, code: string, title: string): Promise<void>;
  openEvidence(row: Doc<"evidence">): Promise<void>;
};
type DataContextValue = { session: AppSession; cache: Cache; ready: boolean; mutate(action: string, payload: Record<string, any>): Promise<any> };
const DataContext = createContext<DataContextValue | null>(null);
const STORAGE_KEY = "esgHub.sandbox.v1";
const env = import.meta.env;
const configuredUrl = String(env.VITE_SUPABASE_URL ?? "").trim();
const configuredKey = String(env.VITE_SUPABASE_ANON_KEY ?? "").trim();
const cloudMode = Boolean(configuredUrl || configuredKey);
function makeCloudClient(): { client: SupabaseClient | null; error: string | null } {
  if (!cloudMode) return { client: null, error: null };
  if (!configuredUrl || !configuredKey || !/^https:\/\//i.test(configuredUrl)) return { client: null, error: "Cần cấu hình VITE_SUPABASE_URL HTTPS và VITE_SUPABASE_ANON_KEY. Không dùng khóa service_role trong trình duyệt." };
  if (configuredKey.startsWith("sb_secret_")) return { client: null, error: "Chỉ dùng khóa anon/publishable công khai. Khóa bí mật Supabase không được đưa vào trình duyệt." };
  try {
    const token = configuredKey.split(".")[1];
    if (token && JSON.parse(atob(token.replace(/-/g, "+").replace(/_/g, "/"))).role === "service_role") return { client: null, error: "Khóa service_role không được dùng trong trình duyệt. Đổi sang khóa anon/publishable công khai." };
  } catch { /* Non-JWT publishable keys are validated by Supabase itself. */ }
  try { return { client: createClient(configuredUrl, configuredKey), error: null }; }
  catch { return { client: null, error: "Cấu hình Supabase không hợp lệ. Kiểm tra URL và khóa công khai của dự án." }; }
}
function message(cause: unknown): string { return cause instanceof Error ? cause.message : typeof (cause as any)?.message === "string" ? (cause as any).message : "Không thực hiện được thao tác."; }
function readSandbox(): { store: SandboxStore; error: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { store: createSandbox(), error: null };
    const parsed = JSON.parse(raw) as SandboxStore;
    if (parsed.formatVersion !== 1 || !Array.isArray(parsed.workspaces) || !parsed.workspaces.length || !parsed.workspaces.every((ws) => ws.workspace?.id && ws.tables && TABLE_NAMES.every((kind) => Array.isArray(ws.tables[kind])) && ws.locks && Array.isArray(ws.audit))) throw new Error("invalid");
    if (!parsed.workspaces.some((ws) => ws.workspace.id === parsed.activeId)) parsed.activeId = parsed.workspaces[0].workspace.id;
    return { store: parsed, error: null };
  } catch { return { store: createSandbox(), error: "Không đọc được dữ liệu thử nghiệm cũ. Dữ liệu cũ chưa bị ghi đè; hãy xuất/sao lưu trước khi tạo dữ liệu mới." }; }
}
function sandboxCache(ws: SandboxWorkspace): Cache {
  const cache: Cache = {};
  TABLE_NAMES.forEach((kind) => { cache[TABLE_API[kind][0]] = ws.tables[kind].map((row) => presentSandboxRow(ws, kind, row)).sort((a, b) => b._creationTime - a._creationTime); });
  cache.listAudit = structuredClone(ws.audit);
  cache.exportWorkspace = { formatVersion: 1, workspace: ws.workspace, exportedAt: new Date().toISOString(), tables: Object.fromEntries(TABLE_NAMES.map((kind) => [kind, cache[TABLE_API[kind][0]]])), audit: cache.listAudit };
  return cache;
}
function normalizeAudit(row: any): AuditEvent {
  return { _id: String(row._id ?? row.id), action: row.action ?? row.operation, table: row.table ?? row.kind ?? row.new_data?.kind ?? row.old_data?.kind ?? row.entity ?? row.table_name, recordId: row.recordId ?? row.record_id ?? "", actor: row.actor ?? row.actor_id ?? "", timestamp: typeof row.timestamp === "number" ? row.timestamp : Date.parse(row.occurred_at ?? row.created_at ?? row.timestamp), reason: row.reason ?? row.new_data?.reason ?? row.new_data?.data?.reviewReason ?? "", old: row.old ?? row.old_data ?? null, new: row.new ?? row.new_data ?? null };
}
function seedTables(): Record<string, Record<string, unknown>[]> {
  return {
    kpis: DEFAULT_KPIS.map((row) => ({ ...blankRow("kpis"), ...row })),
    tasks: DEFAULT_TASKS.map((row) => ({ ...blankRow("tasks"), ...row })),
    roadmap: DEFAULT_ROADMAP.map((row) => ({ ...blankRow("roadmap"), ...row })),
    topics: DEFAULT_TOPICS.map((row) => ({ ...blankRow("topics"), ...row })),
    requirements: DEFAULT_REQUIREMENTS.map((row) => ({ ...blankRow("requirements"), ...row })),
  };
}
function seedSandbox(original: SandboxWorkspace): { workspace: SandboxWorkspace; result: Record<string, number> } {
  let ws = original;
  const result: Record<string, number> = {};
  for (const [name, rows] of Object.entries(seedTables())) {
    const kind = name as TableName;
    result[name] = 0;
    for (const row of rows) if (!ws.tables[kind].some((existing) => existing.code === row.code)) {
      ws = mutateSandbox(ws, TABLE_API[kind][1], { data: row }, { id: "sandbox-preparer", role: "owner" }).workspace;
      result[name]++;
    }
  }
  return { workspace: ws, result };
}
const FILE_TYPES: Record<string, string> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", csv: "text/csv", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };

export function DataProvider({ children }: { children: ReactNode }) {
  const cloud = useMemo(makeCloudClient, []);
  const initial = useMemo(() => cloudMode ? { store: createSandbox(), error: null } : readSandbox(), []);
  const [sandbox, setSandbox] = useState(initial.store);
  const sandboxRef = useRef(sandbox);
  const [user, setUser] = useState<User | null>(cloudMode ? null : { id: "sandbox-preparer", email: "demo@local.invalid" });
  const userRef = useRef(user?.id ?? null);
  userRef.current = user?.id ?? null;
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeRef = useRef<string | null>(activeId);
  activeRef.current = activeId;
  const [cache, setCache] = useState<Cache>({});
  const [loading, setLoading] = useState(cloudMode);
  const [ready, setReady] = useState(!cloudMode);
  const [error, setError] = useState<string | null>(cloud.error ?? initial.error);
  const generation = useRef(0);
  const fileUrls = useRef(new Map<string, string>());
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const activeSandbox = sandbox.workspaces.find((ws) => ws.workspace.id === sandbox.activeId)!;
  const workspace = cloudMode ? workspaces.find((ws) => ws.id === activeId) ?? null : activeSandbox.workspace;

  const rpc = useCallback(async (action: string, payload: Record<string, any> = {}, id: string | null = activeRef.current) => {
    if (!cloud.client) throw new Error(cloud.error ?? "Supabase chưa được cấu hình.");
    const result = await cloud.client.rpc("esg_mutate", { action, payload, workspace_id: id });
    if (result.error) throw new Error(result.error.message);
    return result.data;
  }, [cloud]);
  const commitSandbox = useCallback((store: SandboxStore) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }
    catch { throw new Error("Không lưu được dữ liệu thử nghiệm trong trình duyệt (có thể đã đầy). Xuất sao lưu trước khi tiếp tục."); }
    sandboxRef.current = store; setSandbox(store);
  }, []);
  const run = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    try { return await operation(); }
    catch (cause) { setError(message(cause)); throw cause; }
  }, []);
  const refreshCloud = useCallback(async (id: string | null, token = ++generation.current) => {
    if (!id) { if (token === generation.current) { setCache({}); setReady(true); } return; }
    try {
      // One RPC reads the tables, locks and audit in the same transaction.
      const backup = await rpc("exportWorkspace", {}, id);
      if (token !== generation.current || activeRef.current !== id) return;
      const next: Cache = Object.fromEntries(TABLE_NAMES.map((kind) => [TABLE_API[kind][0], []]));
      for (const item of backup.records ?? []) if (TABLE_NAMES.includes(item.kind)) next[TABLE_API[item.kind as TableName][0]].push(item.record);
      TABLE_NAMES.forEach((kind) => next[TABLE_API[kind][0]].sort((a: AnyDoc, b: AnyDoc) => b._creationTime - a._creationTime));
      next.listAudit = (backup.audit ?? []).map(normalizeAudit).sort((a: AuditEvent, b: AuditEvent) => b.timestamp - a.timestamp);
      next.exportWorkspace = { formatVersion: 1, workspace: workspaces.find((ws) => ws.id === id) ?? backup.workspace, exportedAt: backup.exportedAt, tables: Object.fromEntries(TABLE_NAMES.map((kind) => [kind, next[TABLE_API[kind][0]]])), periods: backup.periods ?? [], snapshots: backup.snapshots ?? [], audit: next.listAudit };
      setCache(next); setReady(true);
    } catch (cause) { if (token === generation.current) { setCache({}); setError(message(cause)); setReady(true); } }
  }, [rpc, workspaces]);
  const refreshMembership = useCallback(async () => {
    const requestingUser = userRef.current;
    const [ws, invites] = await Promise.all([rpc("listWorkspaces", {}, null), rpc("listInvitations", {}, null)]);
    if (requestingUser !== userRef.current) return;
    const list = (ws ?? []).map((item: any): Workspace => ({ id: item.id ?? item.workspace_id, name: item.name ?? item.workspace_name, role: item.role }));
    setWorkspaces(list); setInvitations(invites ?? []);
    setActiveId((current) => list.some((item: Workspace) => item.id === current) ? current : list[0]?.id ?? null);
  }, [rpc]);

  useEffect(() => {
    if (!cloudMode) return;
    if (!cloud.client) { setLoading(false); setReady(true); return; }
    let current = true;
    const apply = (session: any) => { if (current) { setUser(session?.user ? { id: session.user.id, email: session.user.email ?? "" } : null); setLoading(false); } };
    void cloud.client.auth.getSession().then(({ data, error: authError }) => { if (authError && current) setError(authError.message); apply(data.session); });
    const subscription = cloud.client.auth.onAuthStateChange((_event, session) => apply(session));
    return () => { current = false; subscription.data.subscription.unsubscribe(); };
  }, [cloud]);
  useEffect(() => {
    if (!cloudMode || loading) return;
    const token = ++generation.current;
    setCache({}); setReady(false);
    if (!user) { setWorkspaces([]); setInvitations([]); setActiveId(null); setReady(true); return; }
    let current = true;
    void refreshMembership().catch((cause) => { if (current && token === generation.current) { setError(message(cause)); setReady(true); } });
    return () => { current = false; };
  }, [user?.id, loading, refreshMembership]);
  useEffect(() => {
    if (!cloudMode || loading) return;
    ++generation.current; setCache({}); setReady(false);
    void refreshCloud(activeId);
  }, [activeId, loading, refreshCloud]);
  useEffect(() => {
    if (!cloudMode || !activeId || !cloud.client || !user) return;
    const refresh = () => { void refreshCloud(activeRef.current); };
    const channel = cloud.client.channel(`esg:${activeId}`).on("postgres_changes", { event: "*", schema: "public", table: "esg_records", filter: `workspace_id=eq.${activeId}` }, refresh).on("postgres_changes", { event: "*", schema: "public", table: "period_locks", filter: `workspace_id=eq.${activeId}` }, refresh).subscribe();
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", refresh); void cloud.client?.removeChannel(channel); };
  }, [activeId, cloud, refreshCloud, user]);
  useEffect(() => () => { fileUrls.current.forEach((url) => URL.revokeObjectURL(url)); }, []);

  const currentCache = cloudMode ? cache : sandboxCache(activeSandbox);
  const mutate = useCallback(async (action: string, input: Record<string, any> = {}) => {
    const requestedWorkspace = cloudMode ? activeRef.current : sandboxRef.current.activeId;
    const operation = () => run(async () => {
      if ((cloudMode ? activeRef.current : sandboxRef.current.activeId) !== requestedWorkspace) throw new Error("Workspace đã thay đổi trước khi lưu. Chọn lại workspace và thử lại.");
      const payload = structuredClone(input);
      if (action.startsWith("import")) payload.rows = payload.rows?.map((row: any) => row && "data" in row ? row : { data: row });
      if (action.startsWith("removeMany") && payload.ids) payload.rows = payload.ids.map((id: string) => ({ id, expectedVersion: payload.versions?.[id] }));
      if (cloudMode) {
        if (!user || !activeRef.current) throw new Error("Đăng nhập và chọn workspace trước khi ghi dữ liệu.");
        if (action === "reviewDataRecord" && payload.expectedVersion === undefined) payload.expectedVersion = cache.listDataRecords?.find((row: AnyDoc) => row._id === payload.id)?._version;
        const id = activeRef.current;
        const result = await rpc(action, action === "seedDefaults" ? { tables: seedTables() } : payload, id);
        if (activeRef.current === id) await refreshCloud(id);
        return result;
      }
      const store = sandboxRef.current, ws = store.workspaces.find((item) => item.workspace.id === store.activeId)!;
      if (action === "reviewDataRecord" && payload.expectedVersion === undefined) payload.expectedVersion = ws.tables.dataRecords.find((row) => row._id === payload.id)?._version;
      const result = action === "seedDefaults" ? seedSandbox(ws) : mutateSandbox(ws, action, payload, { id: action === "reviewDataRecord" ? "sandbox-reviewer" : "sandbox-preparer", role: "owner" });
      commitSandbox({ ...store, workspaces: store.workspaces.map((item) => item.workspace.id === ws.workspace.id ? result.workspace : item) });
      return result.result;
    });
    const task = queue.current.then(operation, operation);
    queue.current = task.catch(() => undefined);
    return task;
  }, [cache, commitSandbox, refreshCloud, rpc, run, user]);

  const session: AppSession = {
    mode: cloudMode ? "cloud" : "sandbox", workspace, workspaces: cloudMode ? workspaces : sandbox.workspaces.map((ws) => ws.workspace), user, invitations, loading,
    capabilities: { write: Boolean(workspace && ["owner", "editor"].includes(workspace.role)), review: Boolean(workspace && ["owner", "reviewer"].includes(workspace.role)), admin: workspace?.role === "owner" },
    error, clearError: () => setError(null),
    login: (email, password) => run(async () => { if (!cloud.client) throw new Error("Đăng nhập chỉ khả dụng sau khi cấu hình Supabase."); const result = await cloud.client.auth.signInWithPassword({ email, password }); if (result.error) throw result.error; }),
    signup: (email, password) => run(async () => { if (!cloud.client) throw new Error("Đăng ký chỉ khả dụng sau khi cấu hình Supabase."); const result = await cloud.client.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } }); if (result.error) throw result.error; }),
    logout: () => run(async () => { if (!cloud.client) return; const result = await cloud.client.auth.signOut(); if (result.error) throw result.error; ++generation.current; setCache({}); setWorkspaces([]); setActiveId(null); }),
    createWorkspace: (name) => run(async () => {
      if (!name.trim() || name.trim().length > 120) throw new Error("Tên workspace cần từ 1 đến 120 ký tự.");
      if (!cloudMode) { const created = createSandbox(name.trim()); const store = sandboxRef.current; commitSandbox({ ...store, activeId: created.activeId, workspaces: [...store.workspaces, ...created.workspaces] }); return; }
      const created = await rpc("createWorkspace", { name: name.trim() }, null); await refreshMembership(); setActiveId(created.id ?? created.workspace_id);
    }),
    switchWorkspace: (id) => run(async () => {
      if (!cloudMode) { if (!sandboxRef.current.workspaces.some((ws) => ws.workspace.id === id)) throw new Error("Không tìm thấy workspace."); commitSandbox({ ...sandboxRef.current, activeId: id }); return; }
      if (!workspaces.some((ws) => ws.id === id)) throw new Error("Bạn không thuộc workspace này."); ++generation.current; activeRef.current = id; setCache({}); setReady(false); setActiveId(id);
    }),
    invite: (email, role) => run(async () => { if (!cloudMode) throw new Error("Sandbox không gửi lời mời và không chia sẻ dữ liệu."); await rpc("inviteMember", { email: email.trim().toLowerCase(), role }); }),
    acceptInvitation: (id) => run(async () => { await rpc("acceptInvitation", { id }, null); await refreshMembership(); }),
    uploadEvidence: (file, code, title) => run(async () => {
      if (!workspace || !["owner", "editor"].includes(workspace.role)) throw new Error("Cần quyền nhập dữ liệu để tải bằng chứng.");
      if (!code.trim() || !title.trim()) throw new Error("Bằng chứng cần mã và tiêu đề.");
      if (file.size <= 0 || file.size > 10 * 1024 * 1024) throw new Error("Tệp phải lớn hơn 0 và không quá 10 MiB.");
      const mime = FILE_TYPES[file.name.split(".").pop()?.toLowerCase() ?? ""];
      if (!mime || (file.type && file.type !== mime && !(mime === "text/csv" && ["application/vnd.ms-excel", "text/plain"].includes(file.type)))) throw new Error("Chỉ hỗ trợ PDF, PNG/JPEG/WebP/GIF, CSV và XLSX với kiểu tệp phù hợp.");
      const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
      if ((cloudMode ? activeRef.current : sandboxRef.current.activeId) !== workspace.id) throw new Error("Workspace đã thay đổi trong lúc xử lý tệp. Hãy tải lại trong workspace cần lưu.");
      const path = `${workspace.id}/${crypto.randomUUID()}`;
      const data = { code: code.trim(), title: title.trim(), sourceUrl: "", description: "", sha256: hash, filePath: cloudMode ? path : `sandbox/${path}`, fileName: file.name, size: file.size, mimeType: mime };
      if (cloudMode) {
        if (!cloud.client) throw new Error("Supabase chưa sẵn sàng.");
        const uploaded = await cloud.client.storage.from("esg-evidence").upload(path, file, { contentType: mime, upsert: false });
        if (uploaded.error) throw uploaded.error;
        try { await mutate("upsertEvidence", { data }); }
        catch (cause) { await cloud.client.storage.from("esg-evidence").remove([path]); throw cause; }
      } else {
        await mutate("upsertEvidence", { data }); fileUrls.current.set(data.filePath, URL.createObjectURL(file));
      }
    }),
    openEvidence: (row) => run(async () => {
      if (!workspace) throw new Error("Chọn workspace trước khi mở bằng chứng.");
      const current = currentCache.listEvidence?.find((item: AnyDoc) => item._id === row._id);
      if (!current) throw new Error("Bằng chứng không thuộc workspace hiện tại.");
      let url = String(current.sourceUrl ?? "");
      if (url && !/^https:\/\//i.test(url)) throw new Error("Nguồn bằng chứng phải là HTTPS.");
      if (current.filePath) {
        if (cloudMode) { if (!cloud.client) throw new Error("Supabase chưa sẵn sàng."); const signed = await cloud.client.storage.from("esg-evidence").createSignedUrl(String(current.filePath), 60); if (signed.error) throw signed.error; url = signed.data.signedUrl; }
        else { url = fileUrls.current.get(String(current.filePath)) ?? ""; if (!url) throw new Error("Tệp thử nghiệm chỉ tồn tại trong phiên trình duyệt đã tải lên. Sau khi tải lại trang chỉ còn metadata; hãy tải lại tệp hoặc dùng nguồn HTTPS."); }
      }
      if (!url) throw new Error("Bằng chứng chưa có tệp hoặc nguồn HTTPS.");
      window.open(url, "_blank", "noopener,noreferrer");
    }),
  };
  return <DataContext.Provider value={{ session, cache: currentCache, ready, mutate }}>{children}</DataContext.Provider>;
}
function useData(): DataContextValue { const context = useContext(DataContext); if (!context) throw new Error("DataProvider chưa được khởi tạo."); return context; }
export function useAppSession(): AppSession { return useData().session; }
export function useQuery(action: ApiFunction, args: Record<string, any> | "skip" = {}): any {
  const context = useData();
  if (args === "skip" || !context.ready) return undefined;
  if (action === "dataRecordsByPeriod") return (context.cache.listDataRecords ?? []).filter((row: AnyDoc) => periodContains(String(args.period), String(row.period)));
  if (action === "exportWorkspace") return context.cache.exportWorkspace ?? null;
  return context.cache[action] ?? [];
}
export function useMutation(action: ApiFunction): (payload?: Record<string, any>) => Promise<any> {
  const context = useData();
  return useCallback((payload = {}) => context.mutate(action, payload), [action, context.mutate]);
}
