// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildExampleReport, evidenceRegistry, exampleKpis, exampleSheets, exampleYears, sampleMetrics, sampleMonths, SAMPLE_WARNING } from "../src/reportExample";
import { documentChapters, documentHtml, parseDocument } from "../src/resourceDocument";
import { buildXlsx, readXlsx } from "../src/xlsx";
import { workflowBranches, workflowMarkdown, workflowSteps } from "../src/workflow";

describe("reference report reconciliations", () => {
  it("reconciles monthly inputs with annual figures independently", () => {
    const year = exampleYears[1];
    expect(new Set(sampleMonths.map(row => row.period)).size).toBe(12);
    for (const key of ["pairs", "electricityKwh", "dieselLitres", "lpgKg", "waterM3", "dischargeM3"] as const) expect(sampleMonths.reduce((sum, row) => sum + row[key], 0)).toBe(year[key]);
    expect(year.women + year.men).toBe(year.employees);
    expect(1100 + 220 - 120).toBe(year.employees);
    expect(18720 + 10080).toBe(year.trainingHours);
  });
  it("keeps GHG, water, waste and economic calculations consistent", () => {
    const values = sampleMetrics(exampleYears[1]);
    expect(values.scope1).toBeCloseTo(236.64, 8); expect(values.scope2Location).toBe(3000);
    expect(values.ghgTotal).toBeCloseTo(3236.64, 8); expect(values.ghgKgPerPair).toBeCloseTo(1.3486, 8);
    expect(values.energyGJ).toBe(24984); expect(values.waterConsumedM3).toBe(18000);
    expect(values.waterLitresPerPair).toBe(37.5); expect(values.wasteTotal).toBe(400); expect(values.recoveryPct).toBe(75);
    expect(values.injuryRate).toBe(1.25); expect(values.retainedValue).toBe(55);
    expect(650 + 180 + 40 + 34 + 1).toBe(exampleYears[1].distributed);
    expect(550 + 145 + 32 + 28 + 1).toBe(exampleYears[0].distributed);
  });
  it("preserves source warnings and missing-data limits in exports", async () => {
    const sheets = exampleSheets(); const bytes = buildXlsx(sheets);
    const parsed = await readXlsx({ name: "sample.xlsx", size: bytes.byteLength, arrayBuffer: async () => bytes.slice().buffer } as File);
    expect(parsed).toHaveLength(5); expect(parsed[0].rows[0][0]).toBe(SAMPLE_WARNING);
    expect(parsed[0].rows.flat().join(" ")).toContain("THIẾU — không phải số 0");
    const ghg = parsed[1].rows.find(row => row[0] === "GHG-1"); expect(Number(ghg?.[4])).toBeCloseTo(236.64, 8);
    const knownEvidence = new Set(evidenceRegistry.map(row => row[0]));
    for (const row of exampleKpis) for (const code of row[6].split(" + ")) expect(knownEvidence.has(code as typeof evidenceRegistry[number][0])).toBe(true);
  });
  it("keeps published documentation and browser resources synchronized", () => {
    expect(readFileSync("docs/ESG_REPORT_EXAMPLE.md", "utf8")).toBe(buildExampleReport());
    expect(readFileSync("docs/WORKFLOW_GUIDE.md", "utf8")).toBe(workflowMarkdown());
    expect(documentChapters(parseDocument(buildExampleReport()))).toHaveLength(21);
    const outline = readFileSync("docs/ESG_REPORT_OUTLINE.md", "utf8");
    for (let n = 1; n <= 30; n++) expect(outline).toMatch(new RegExp(`\\| 2-${n} \\|`));
  });
});

describe("downloadable documents", () => {
  it("escapes markup and disallows executable links", () => {
    const html = documentHtml('# Document\n\n<script>alert(1)</script> [bad](javascript:alert) [ok](https://example.org/)\n\n| A | B |\n| --- | --- |\n| <img src=x onerror=alert> | **safe** |', '<unsafe>');
    const doc = new DOMParser().parseFromString(html, "text/html");
    expect(doc.querySelectorAll("script,img")).toHaveLength(0); expect(doc.querySelector("title")?.textContent).toBe("<unsafe>");
    expect([...doc.querySelectorAll("a")].map(a => a.getAttribute("href"))).toEqual(["https://example.org/"]);
    expect(doc.querySelector("strong")?.textContent).toBe("safe"); expect(doc.querySelectorAll("tbody tr")).toHaveLength(1);
  });
  it("uses navigation links for real app routes only", () => {
    const routes = new Set(["home", "qa", "learn", "assess", "roadmap", "topics", "evidence", "data", "ghg", "reports", "capa", "audit", "project-audit", "report-kit", "report-example", "guide"]);
    for (const item of [...workflowBranches, ...workflowSteps]) expect(routes.has(item.route)).toBe(true);
    const html = documentHtml(buildExampleReport(), "sample"); expect(html).toContain(SAMPLE_WARNING);
    const doc = new DOMParser().parseFromString(html, "text/html");
    for (const a of doc.querySelectorAll('a[href^="#"]')) expect(routes.has(a.getAttribute("href")!.slice(1))).toBe(true);
    expect(doc.querySelectorAll("table").length).toBeGreaterThanOrEqual(12);
  });
});

import { buildEclatReport, eclatIssues, eclatMetrics, eclatSheets, eclatSource, ECLAT_WARNING, pdfPageForPrinted } from "../src/eclatReference";
describe("Eclat reference provenance and limits", () => {
  it("keeps the reference tied to the downloaded source and printed/PDF pages", () => {
    expect(eclatSource.pdfPages).toBe(85); expect(eclatSource.bytes).toBe(39637351);
    expect(eclatSource.sha256).toBe('11eeb02e9051c77f694ffb268db713b6051524c032d289281bc0bd1365bae833');
    expect(eclatMetrics).toHaveLength(25);
    for (const row of eclatMetrics) { expect(row.scope).toBeTruthy(); expect(row.unit).toBeTruthy(); expect(row.evidence).toBeTruthy(); expect(pdfPageForPrinted(row.printedPage)).toBeLessThanOrEqual(85); }
    expect(pdfPageForPrinted(4)).toBe(3); expect(pdfPageForPrinted(167)).toBe(84);
    const byCode = Object.fromEntries(eclatMetrics.map(row => [row.code, row]));
    expect(byCode['GHG-1'].value2024 + byCode['GHG-2'].value2024).toBeCloseTo(byCode['GHG-12'].value2024, 8);
    expect(byCode['GHG-12'].value2024 + byCode['GHG-3'].value2024).toBeCloseTo(byCode['GHG-ALL'].value2024, 8);
    expect(639+1063+1596+10825+289+1417+640+4199).toBe(byCode['HR-END'].value2024);
  });
  it("preserves conflicting source totals and never creates Eclat monthly data", () => {
    expect(eclatIssues).toHaveLength(6);
    expect(139444.46+238381+9163+8065.28).toBeCloseTo(395053.74, 8);
    expect(1945.86+428.85+85.6+1151.57+1430.53+24.36+898.30+160.89).toBeCloseTo(6125.96, 8);
    expect(34464+2028198+650460).toBe(2713122);
    expect(eclatMetrics.find(row=>row.code==='WATER-GROUP')?.quality).toContain('Cần làm rõ');
    const sheets = eclatSheets(); expect(sheets[0].rows[0][0]).toBe(ECLAT_WARNING);
    expect(sheets.some(sheet=>sheet.name.toLowerCase().includes('thang'))).toBe(false);
    const report = buildEclatReport(); expect(report).toContain('LIMITED ASSURANCE'); expect(report).toContain('không được tự tạo từ số năm');
    expect(report).toContain('10.329.559'); expect(report).toContain('4.029.218');
  });
  it("keeps downloadable reference and registry synchronized with browser content", () => {
    expect(readFileSync('docs/ESG_REPORT_ECLAT_REFERENCE.md','utf8')).toBe(buildEclatReport());
    const registry = JSON.parse(readFileSync('docs/eclat-source-register.json','utf8'));
    expect(registry).toEqual({ source:eclatSource, metrics:eclatMetrics, issues:eclatIssues });
    expect(documentChapters(parseDocument(buildEclatReport()))).toHaveLength(22);
    const html = documentHtml(buildEclatReport(), 'reference'); expect(html).toContain(ECLAT_WARNING); expect(html).toContain('#page=69');
  });
});
