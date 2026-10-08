// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const backend = vi.hoisted(() => ({ client: null as any, createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: (...args: unknown[]) => { backend.createClient(...args); return backend.client; } }));
let root: Root | undefined;
let container: HTMLDivElement;
let data: typeof import("../src/data");
let state: any;
async function mount() {
  data = await import("../src/data");
  function Probe(): ReactNode {
    state = { session: data.useAppSession(), kpis: data.useQuery(data.api.app.listKpis), audit: data.useQuery(data.api.app.listAudit), backup: data.useQuery(data.api.app.exportWorkspace), upsert: data.useMutation(data.api.app.upsertKpi), seed: data.useMutation(data.api.app.seedDefaults) };
    return null;
  }
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => { root!.render(<data.DataProvider><Probe /></data.DataProvider>); });
}
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear(); vi.resetModules(); vi.stubEnv("VITE_SUPABASE_URL", ""); vi.stubEnv("VITE_SUPABASE_ANON_KEY", ""); backend.client = null; backend.createClient.mockClear(); state = null;
});
afterEach(async () => { await act(async () => root?.unmount()); container?.remove(); root = undefined; vi.unstubAllEnvs(); });

describe("data provider workspace boundary", () => {
  it("persists sandbox transactions and isolates switched workspaces", async () => {
    await mount();
    expect(state.session.mode).toBe("sandbox");
    const firstId = state.session.workspace.id;
    await act(async () => { await state.upsert({ data: { code: "E01", name: "Điện", unit: "kWh", aggregation: "sum" } }); });
    expect(state.kpis).toHaveLength(1);
    await act(async () => { await state.session.createWorkspace("Nhà máy B"); });
    expect(state.kpis).toHaveLength(0);
    await act(async () => { await state.upsert({ data: { code: "E01", name: "Điện B", unit: "kWh", aggregation: "sum" } }); });
    await act(async () => { await state.session.switchWorkspace(firstId); });
    expect(state.kpis[0].name).toBe("Điện");
    expect(state.audit[0].actor).toBe("sandbox-preparer");
    expect(JSON.parse(localStorage.getItem("esgHub.sandbox.v1")!).workspaces).toHaveLength(2);
    expect(backend.createClient).not.toHaveBeenCalled();
  });
  it("seeds templates idempotently without creating factory measurements", async () => {
    await mount();
    await act(async () => { await state.seed(); });
    const count = state.kpis.length;
    expect(count).toBeGreaterThan(0);
    expect(state.backup.tables.dataRecords).toEqual([]);
    expect(state.backup.tables.ghgEntries).toEqual([]);
    const events = state.audit.length;
    await act(async () => { const result = await state.seed(); expect(Object.values(result).every((n) => n === 0)).toBe(true); });
    expect(state.kpis).toHaveLength(count);
    expect(state.audit).toHaveLength(events);
  });
  it("rejects a queued write if its intended workspace has changed", async () => {
    await mount();
    let write: Promise<any>;
    await act(async () => {
      write = state.upsert({ data: { code: "E01", name: "Điện", unit: "kWh", aggregation: "sum" } });
      // Workspace creation happens before the queued mutation starts.
      await state.session.createWorkspace("Khác");
      await expect(write).rejects.toThrow(/Workspace đã thay đổi/);
    });
    expect(state.kpis).toEqual([]);
    const stored = JSON.parse(localStorage.getItem("esgHub.sandbox.v1")!);
    expect(stored.workspaces.every((ws: any) => ws.tables.kpis.length === 0)).toBe(true);
  });
  it("loads one atomic cloud export and normalizes real audit fields", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co"); vi.stubEnv("VITE_SUPABASE_ANON_KEY", "sb_publishable_test");
    const workspaceId = "11111111-1111-1111-1111-111111111111";
    const rpc = vi.fn(async (functionName: string, args: { action: string }) => ({ error: null, data: args.action === "listWorkspaces" ? [{ id: workspaceId, name: "Cloud", role: "viewer" }] : args.action === "listInvitations" ? [] : { exportedAt: "2026-10-01T00:00:00Z", workspace: { id: workspaceId, name: "Cloud" }, records: [{ kind: "kpis", record: { _id: "k1", _creationTime: 1, _version: 1, code: "E01", name: "Điện", unit: "kWh", aggregation: "sum" } }], audit: [{ id: 7, entity: "esg_records", record_id: "k1", operation: "INSERT", new_data: { kind: "kpis", data: { code: "E01" } }, old_data: null, actor_id: "u1", occurred_at: "2026-10-01T00:00:00Z" }] } }));
    const channel: any = { on: () => channel, subscribe: () => channel };
    backend.client = { rpc, auth: { getSession: async () => ({ data: { session: { user: { id: "u1", email: "viewer@example.com" } } }, error: null }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) }, channel: () => channel, removeChannel: async () => {} };
    await mount();
    await act(async () => { await vi.waitFor(() => expect(state.kpis?.length).toBe(1)); });
    expect(state.session.capabilities).toEqual({ write: false, review: false, admin: false });
    expect(state.audit[0]).toMatchObject({ _id: "7", table: "kpis", action: "INSERT", actor: "u1", timestamp: Date.parse("2026-10-01T00:00:00Z") });
    expect(state.backup.tables.kpis).toHaveLength(1);
    expect(rpc.mock.calls.map(([, args]) => args.action)).toContain("exportWorkspace");
    expect(rpc.mock.calls.map(([, args]) => args.action)).not.toContain("listKpis");
  });
  it("refuses secret Supabase keys and does not downgrade to sandbox", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co"); vi.stubEnv("VITE_SUPABASE_ANON_KEY", "sb_secret_fake_test_key");
    await mount();
    expect(state.session.mode).toBe("cloud");
    expect(state.session.error).toMatch(/khóa bí mật|Khóa bí mật/);
    expect(state.session.capabilities.write).toBe(false);
    expect(backend.createClient).not.toHaveBeenCalled();
  });
});
