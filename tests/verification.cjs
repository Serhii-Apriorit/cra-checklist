/* Run with node tests/verification.cjs; see README for Playwright setup. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const http = require("node:http");
const vm = require("node:vm");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const repo = path.resolve(__dirname, "..");
const output = fs.mkdtempSync(path.join(os.tmpdir(), "cra-verification-"));
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(repo, "cra-readiness-assets/detailed-catalog.js"), "utf8"), context);
const catalog = context.window.CRADetailedCatalog;
assert.ok(catalog.items.length >= 80 && catalog.items.length <= 120);
assert.equal(catalog.categories.length, 12);
assert.equal(catalog.items.length, 94);
assert.equal(catalog.revision, 4);
assert.equal(catalog.items.filter(item => item.reviewRevision === 3).length, 6);
assert.equal(catalog.items.filter(item => item.reviewRevision === 4).length, 1);
assert.equal(catalog.items.reduce((count, item) => count + item.mergedFrom.length, 0), 14);
for (const item of catalog.items) {
  for (const former of item.mergedFrom) assert.ok(!catalog.items.some(control => control.id === former.id), `Retired control still displayed: ${former.id}`);
}
assert.equal(new Set(catalog.items.map(item => item.id)).size, catalog.items.length);
assert.equal(new Set(catalog.items.map(item => item.title.toLowerCase())).size, catalog.items.length);
for (const item of catalog.items) {
  for (const field of ["id", "category", "title", "priority", "guidance", "evidence", "applicability", "basis"]) assert.ok(item[field], `${item.id}: missing ${field}`);
  assert.ok(["Critical", "High", "Medium"].includes(item.priority));
  assert.ok(catalog.categories.some(category => category.id === item.category));
  assert.ok(item.references.length);
  for (const ref of item.references) assert.ok(ref.label && new URL(ref.url).protocol === "https:");
}
const labels = new Set(catalog.items.flatMap(item => item.references.map(reference => reference.label)));
for (const point of "abcdefghijklm") assert.ok(labels.has(`CRA Annex I, Part I, point 2(${point})`));
for (let point = 1; point <= 8; point++) assert.ok(labels.has(`CRA Annex I, Part II, point ${point}`));

const mime = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".ttf": "font/ttf" };
const server = http.createServer((req, res) => {
  if (req.method !== "GET") { res.writeHead(405); return res.end(); }
  const relative = decodeURIComponent(new URL(req.url, "http://localhost").pathname).replace(/^\/cra-checklist\//, "");
  const filename = path.resolve(repo, relative || "index.html");
  if (!filename.startsWith(repo + path.sep)) { res.writeHead(404); return res.end(); }
  fs.readFile(filename, (error, data) => { res.writeHead(error ? 404 : 200, { "Content-Type": mime[path.extname(filename)] || "application/octet-stream" }); res.end(error ? "Not found" : data); });
});

(async () => {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/cra-checklist/`;
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || "chrome" });
  try {
    const browserContext = await browser.newContext({ viewport: { width: 1440, height: 1050 }, acceptDownloads: true });
    const page = await browserContext.newPage();
    const errors = [], requests = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => requests.push({ method: request.method(), url: request.url() }));
    await browserContext.addInitScript(() => {
      if (!sessionStorage.getItem("test-seeded")) {
        localStorage.setItem("cra-readiness-assessment-v1", JSON.stringify({ product: "Existing general product", reviewer: "General reviewer", answers: { 0: "Have it", 4: "Partially" }, notes: { 0: "General evidence preserved", 4: "Filtered-out evidence" } }));
        sessionStorage.setItem("test-seeded", "yes");
      }
    });
    await page.goto(url);
    const general = page.locator("#general-verification-panel");
    const detail = page.locator("#detailed-verification-panel");
    await general.waitFor();
    assert.equal(await general.isVisible(), true);
    assert.equal(await detail.isVisible(), false);
    assert.equal(await general.locator(".requirement").count(), 10);
    assert.equal(await general.locator(".metadata-fields input").first().inputValue(), "Existing general product");
    await page.getByRole("tab", { name: /General verification/ }).focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.getByRole("tab", { name: /Detailed verification/ }).getAttribute("aria-selected"), "true");
    assert.equal(await detail.isVisible(), true);
    assert.equal(await detail.locator(".dv-control").count(), catalog.items.length);
    assert.equal(await detail.locator("[data-count=unanswered]").innerText(), String(catalog.items.length));
    const [a, b, c] = catalog.items;
    const card = id => detail.locator(`[id="control-${id}"]`);
    await card(a.id).getByRole("radio", { name: "Yes", exact: true }).check();
    await card(b.id).getByRole("radio", { name: "No", exact: true }).check();
    await card(c.id).getByRole("radio", { name: "Not applicable", exact: true }).check();
    assert.equal(await card(c.id).locator(".dv-na-hint").isVisible(), true);
    assert.equal(await detail.locator("[data-count=reviewed]").innerText(), "3");
    assert.equal(await detail.locator("[data-count=na]").innerText(), "1");
    const [unknownControl, knownControl] = catalog.items.slice(3, 5);
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async value => { window.copiedAgentPrompt = value; } } }));
    await detail.getByRole("button", { name: "Copy agent prompt", exact: true }).click();
    const copiedPrompt = await page.evaluate(() => window.copiedAgentPrompt);
    assert.ok(copiedPrompt.includes(`"id": "${unknownControl.id}"`));
    assert.ok(!copiedPrompt.includes(`"id": "${a.id}"`), "Default prompt scope must omit answered controls");
    await detail.getByLabel("Prompt scope", { exact: true }).selectOption("all");
    await detail.getByRole("button", { name: "Copy agent prompt", exact: true }).click();
    assert.ok((await page.evaluate(() => window.copiedAgentPrompt)).includes(`"id": "${a.id}"`));
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined }));
    await detail.getByRole("button", { name: "Copy agent prompt", exact: true }).click();
    assert.equal(await detail.getByLabel("Agent review prompt", { exact: true }).isVisible(), true);
    assert.ok((await detail.locator(".dv-agent-status").first().innerText()).includes("copy it manually"));
    await card(a.id).locator(".dv-notes summary").click();
    await card(a.id).locator("textarea").fill("Human review note");
    await card(a.id).locator(".dv-notes summary").click();
    const agentResults = {
      format: "cra-detailed-agent-review", version: 1, catalogRevision: catalog.revision, project: "Project review",
      results: [
        { id: a.id, answer: "No", notes: "Agent identified a gap", fileEvidence: [{ path: "src/agentproof.ts", line: 42, description: "FILE-PROOF-SENTINEL <img src=x onerror=window.injected=true>" }] },
        { id: unknownControl.id, answer: null, notes: "Deployment behavior needs human verification", fileEvidence: [] },
        { id: knownControl.id, answer: "Yes", notes: "Confirmed by project review", fileEvidence: [] }
      ]
    };
    const openImport = async payload => {
      await detail.locator(".dv-agent-import").evaluate(node => { node.open = true; });
      await detail.getByLabel("Agent results JSON", { exact: true }).fill(JSON.stringify(payload));
      await detail.getByRole("button", { name: "Preview agent results", exact: true }).click();
    };
    const beforeInvalid = await page.evaluate(() => localStorage.getItem("cra-detailed-assessment-v1"));
    await openImport({ ...agentResults, results: [...agentResults.results, { id: "unknown-control", answer: "Yes", notes: "", fileEvidence: [] }] });
    assert.equal(await detail.getByRole("button", { name: "Apply agent results", exact: true }).isDisabled(), true);
    assert.equal(await page.evaluate(() => localStorage.getItem("cra-detailed-assessment-v1")), beforeInvalid, "Invalid batches must not change the assessment");
    await openImport(agentResults);
    assert.equal(await detail.locator("[data-count=reviewed]").innerText(), "3", "Preview must not apply answers");
    await detail.getByRole("button", { name: "Apply agent results", exact: true }).click();
    assert.equal(await detail.locator("[data-count=reviewed]").innerText(), "4");
    assert.equal(await card(a.id).getByRole("radio", { name: "Yes", exact: true }).isChecked(), true);
    assert.equal(await card(unknownControl.id).locator("input:checked").count(), 0);
    const importedNotes = await card(a.id).locator("textarea").inputValue();
    assert.ok(importedNotes.includes("Human review note") && importedNotes.includes("Agent identified a gap"));
    assert.ok(!importedNotes.includes("src/agentproof.ts"));
    assert.equal(await card(a.id).locator(".dv-file-entry").count(), 1);
    assert.equal(await page.evaluate(() => window.injected), undefined);
    await openImport(agentResults);
    await detail.getByRole("button", { name: "Apply agent results", exact: true }).click();
    assert.equal(await card(a.id).locator("textarea").inputValue(), importedNotes, "Repeated imports must not duplicate notes");
    assert.equal(await card(a.id).locator(".dv-file-entry").count(), 1);
    await openImport({ ...agentResults, results: [{ id: a.id, answer: "No", notes: "", fileEvidence: [] }] });
    await detail.getByLabel("Replace existing answers for matching controls", { exact: true }).check();
    await detail.getByRole("button", { name: "Apply agent results", exact: true }).click();
    assert.equal(await card(a.id).getByRole("radio", { name: "No", exact: true }).isChecked(), true);
    await card(a.id).getByRole("radio", { name: "Yes", exact: true }).check();
    await card(knownControl.id).getByRole("button", { name: "Clear answer", exact: true }).click();
    assert.equal(await detail.locator("[data-count=reviewed]").innerText(), "3");
    const files = card(a.id).locator(".dv-file-evidence");
    await files.locator("summary").click();
    await files.getByLabel("Relative path", { exact: true }).fill("../secret");
    await files.getByLabel("Line number", { exact: true }).fill("1");
    await files.getByRole("button", { name: "Add file evidence", exact: true }).click();
    assert.ok((await files.locator(".dv-file-status").innerText()).includes("repository-relative"));
    await files.getByLabel("Relative path", { exact: true }).fill("src/manualproof.ts");
    await files.getByLabel("Line number", { exact: true }).fill("43");
    await files.getByRole("button", { name: "Add file evidence", exact: true }).click();
    assert.equal(await files.locator(".dv-file-entry").count(), 2);
    await files.getByRole("button", { name: "Remove file evidence src/manualproof.ts:43", exact: true }).click();
    assert.equal(await files.locator(".dv-file-entry").count(), 1);
    await files.locator("summary").click();
    assert.equal(await detail.getByLabel("Include file evidence in PDF and Markdown", { exact: true }).isChecked(), false);
    const malicious = '<img src=x onerror="window.injection=true"> & Тест';
    await detail.locator("[data-field=product]").fill(malicious);
    await detail.locator("[data-field=reviewer]").fill("Detailed reviewer");
    const note = ("Detailed evidence Тест & <script>alert(1)</script>\n" + "LongUnbrokenEvidence".repeat(600)).slice(0, 9960) + "\nEND-OF-LONG-NOTE";
    assert.equal(await detail.locator(".dv-notes textarea:visible").count(), 0);
    await card(a.id).locator(".dv-notes summary").click();
    await card(a.id).locator("textarea").fill(note);
    await card(a.id).locator(".dv-notes summary").click();
    assert.equal(await card(a.id).locator("textarea").isVisible(), false);
    assert.equal(await page.evaluate(() => window.injection), undefined);
    await detail.getByRole("searchbox").fill("debug");
    assert.ok(await detail.locator(".dv-control:visible").count() > 0);
    assert.ok(await detail.locator(".dv-control:visible").count() < catalog.items.length);
    assert.equal(await detail.locator("[data-count=reviewed]").innerText(), "3");
    await detail.getByRole("button", { name: "Clear filters", exact: true }).click();
    await detail.locator("[data-filter=answer]").selectOption("Not applicable");
    assert.equal(await detail.locator(".dv-control:visible").count(), 1);
    const mdDownload = page.waitForEvent("download");
    await detail.getByRole("button", { name: "Download Markdown", exact: true }).click();
    const mdFile = path.join(output, "detailed.md");
    await (await mdDownload).saveAs(mdFile);
    const markdown = fs.readFileSync(mdFile, "utf8");
    for (const item of catalog.items) assert.ok(markdown.includes(item.id), `Export missing ${item.id}`);
    assert.ok(markdown.includes("END-OF-LONG-NOTE"));
    assert.ok(!markdown.includes("<script>"));
    assert.ok(markdown.includes("&lt;script&gt;"));
    assert.ok(!markdown.includes("agentproof") && !markdown.includes("FILE-PROOF-SENTINEL"));
    const pdfDownload = page.waitForEvent("download", { timeout: 120000 });
    await detail.getByRole("button", { name: "Download PDF", exact: true }).click();
    await (await pdfDownload).saveAs(path.join(output, "detailed.pdf"));
    await detail.getByLabel("Include file evidence in PDF and Markdown", { exact: true }).check();
    const evidenceMdDownload = page.waitForEvent("download");
    await detail.getByRole("button", { name: "Download Markdown", exact: true }).click();
    await (await evidenceMdDownload).saveAs(path.join(output, "detailed-with-file-evidence.md"));
    const evidenceMarkdown = fs.readFileSync(path.join(output, "detailed-with-file-evidence.md"), "utf8");
    assert.ok(evidenceMarkdown.includes("agentproof") && evidenceMarkdown.includes("FILE-PROOF-SENTINEL"));
    const evidencePdfDownload = page.waitForEvent("download", { timeout: 120000 });
    await detail.getByRole("button", { name: "Download PDF", exact: true }).click();
    await (await evidencePdfDownload).saveAs(path.join(output, "detailed-with-file-evidence.pdf"));
    await page.reload();
    await page.getByRole("tab", { name: /Detailed verification/ }).click();
    assert.equal(await detail.locator("[data-field=product]").inputValue(), malicious);
    assert.equal(await card(a.id).locator("textarea").inputValue(), note);
    assert.equal(await card(a.id).locator("textarea").isVisible(), false);
    assert.equal(await card(a.id).locator(".dv-file-entry").count(), 1);
    assert.equal(await detail.getByLabel("Include file evidence in PDF and Markdown", { exact: true }).isChecked(), true);
    assert.equal(await detail.locator("[data-count=reviewed]").innerText(), "3");
    await detail.locator("[data-filter=answer]").selectOption("Unanswered");
    const filteredCard = detail.locator(".dv-control:visible").first();
    const filteredId = await filteredCard.getAttribute("id");
    await filteredCard.getByRole("radio", { name: "Yes", exact: true }).check();
    const focusedId = await page.evaluate(() => document.activeElement.closest(".dv-control")?.id);
    assert.ok(focusedId && focusedId !== filteredId, "Focus should move to the next visible control");
    await detail.getByRole("button", { name: "Clear filters", exact: true }).click();
    await page.locator(`[id="${filteredId}"]`).getByRole("button", { name: "Clear answer" }).click();
    assert.equal(await detail.locator("[data-count=reviewed]").innerText(), "3");
    await card(a.id).getByRole("button", { name: "Clear answer" }).click();
    assert.equal(await detail.locator("[data-count=reviewed]").innerText(), "2");
    await card(a.id).getByRole("radio", { name: "Yes", exact: true }).check();
    await page.getByRole("tab", { name: /General verification/ }).click();
    assert.equal(await general.locator(".metadata-fields input").first().inputValue(), "Existing general product");
    await general.getByRole("combobox", { name: "Filter requirements" }).selectOption("Have it");
    const generalPdfDownload = page.waitForEvent("download", { timeout: 120000 });
    await general.getByRole("button", { name: "Download PDF", exact: true }).click();
    await (await generalPdfDownload).saveAs(path.join(output, "general.pdf"));
    const generalMdDownload = page.waitForEvent("download");
    await general.getByRole("button", { name: "Download Markdown", exact: true }).click();
    await (await generalMdDownload).saveAs(path.join(output, "general.md"));
    assert.ok(fs.readFileSync(path.join(output, "general.md"), "utf8").includes("Filtered-out evidence"));
    await page.getByRole("tab", { name: /Detailed verification/ }).click();
    await page.locator(".verification-tabs").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, "desktop.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(".verification-tabs").scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(output, "mobile.png") });
    await detail.getByRole("button", { name: "Start a new detailed assessment", exact: true }).click();
    await page.getByRole("button", { name: "Keep assessment", exact: true }).click();
    assert.equal(await detail.locator("[data-count=reviewed]").innerText(), "3");
    await detail.getByRole("button", { name: "Start a new detailed assessment", exact: true }).click();
    await page.getByRole("button", { name: "Clear detailed assessment", exact: true }).click();
    assert.equal(await detail.locator("[data-count=reviewed]").innerText(), "0");
    assert.equal(await general.locator(".metadata-fields input").first().inputValue(), "Existing general product");
    await card(a.id).getByRole("radio", { name: "No", exact: true }).check();
    await page.getByRole("tab", { name: /General verification/ }).click();
    await general.getByRole("button", { name: "Start a new assessment", exact: true }).click();
    await page.getByRole("button", { name: "Clear and start new", exact: true }).click();
    await page.getByRole("tab", { name: /Detailed verification/ }).click();
    assert.equal(await detail.locator("[data-count=reviewed]").innerText(), "1");
    await page.evaluate(() => localStorage.setItem("cra-detailed-assessment-v1", "{invalid json"));
    await page.reload();
    await page.getByRole("tab", { name: /Detailed verification/ }).click();
    assert.equal(await detail.locator("[data-count=reviewed]").innerText(), "0");
    await page.evaluate(() => localStorage.setItem("cra-detailed-assessment-v1", JSON.stringify({ version: 1, product: 42, answers: { unknown: "Yes" }, notes: { unknown: 4 } })));
    await page.reload();
    await page.getByRole("tab", { name: /Detailed verification/ }).click();
    assert.equal(await detail.locator("[data-field=product]").inputValue(), "");
    assert.equal(await detail.locator("[data-count=reviewed]").innerText(), "0");
    // Realistic pre-consolidation assessments must not silently promote partial passes.
    await page.evaluate(() => localStorage.setItem("cra-detailed-assessment-v1", JSON.stringify({
      version: 1, product: "Legacy assessment", reviewer: "Prior reviewer",
      answers: {
        "risk-assessment-current": "Yes", "trust-boundaries-threats": "No", "security-design-decisions": "Yes",
        "security-requirements-acceptance": "Yes", "annex-requirement-mapping": "Yes", "contract-security-deliverables": "Yes",
        "role-function-controls": "Yes", "server-side-authorization": "Yes",
        "least-privilege-runtime": "Yes", "service-identities-scoped": "Yes", "component-isolation": "Yes",
        "data-at-rest-protection": "Yes", "device-local-secret-protection": "No",
        "default-services-minimized": "Not applicable", "platform-hardening": "Not applicable",
        "regular-security-testing": "Yes", "secure-sdlc-operational": "No", "vulnerability-remediation-timely": "No",
        "production-debug-disabled": "Yes", "physical-debug-access": "Not applicable"
      },
      notes: { "risk-assessment-current": "R".repeat(9990) + "RISK-END", "trust-boundaries-threats": "T".repeat(9990) + "THREAT-END", "security-design-decisions": "D".repeat(9990) + "DESIGN-END", "server-side-authorization": "Prior authorization evidence" }
    })));
    await page.reload();
    await page.getByRole("tab", { name: /Detailed verification/ }).click();
    assert.equal(await card("risk-assessment-current").getByRole("radio", { name: "No", exact: true }).isChecked(), true);
    assert.equal(await card("security-requirements-acceptance").getByRole("radio", { name: "Yes", exact: true }).isChecked(), true);
    assert.equal(await card("role-function-controls").locator("input:checked").count(), 0);
    assert.equal(await card("least-privilege-runtime").getByRole("radio", { name: "Yes", exact: true }).isChecked(), true);
    assert.equal(await card("data-at-rest-protection").getByRole("radio", { name: "No", exact: true }).isChecked(), true);
    assert.equal(await card("default-services-minimized").getByRole("radio", { name: "Not applicable", exact: true }).isChecked(), true);
    assert.equal(await card("regular-security-testing").getByRole("radio", { name: "No", exact: true }).isChecked(), true);
    assert.equal(await card("vulnerability-remediation-timely").getByRole("radio", { name: "No", exact: true }).isChecked(), true);
    assert.equal(await card("production-debug-disabled").getByRole("radio", { name: "Yes", exact: true }).isChecked(), true);
    const migratedNotes = await card("risk-assessment-current").locator("textarea").inputValue();
    assert.ok(migratedNotes.includes("RISK-END") && migratedNotes.includes("THREAT-END") && migratedNotes.includes("DESIGN-END"));
    assert.ok(migratedNotes.length > 30000, "All three long source notes must survive consolidation");
    assert.equal(await detail.locator(".dv-control").count(), catalog.items.length);
    assert.equal(await detail.locator(".dv-migration-notice").isVisible(), true);
    assert.equal(await card("risk-assessment-current").locator("textarea").isVisible(), false);
    await page.reload();
    await page.getByRole("tab", { name: /Detailed verification/ }).click();
    assert.equal(await card("risk-assessment-current").locator("textarea").inputValue(), migratedNotes, "Migration must be idempotent");
    const mergedMdDownload = page.waitForEvent("download");
    await detail.getByRole("button", { name: "Download Markdown", exact: true }).click();
    await (await mergedMdDownload).saveAs(path.join(output, "consolidated.md"));
    assert.ok(fs.readFileSync(path.join(output, "consolidated.md"), "utf8").includes("THREAT-END"));
    // Expanded evidence requirements invalidate only old passes, without re-running consolidation.
    const expandedIds = catalog.items.filter(item => item.reviewRevision === 3).map(item => item.id);
    await page.evaluate(ids => localStorage.setItem("cra-detailed-assessment-v1", JSON.stringify({
      version: 1, catalogRevision: 2, product: "Revision 2 assessment", reviewer: "Existing reviewer",
      answers: { ...Object.fromEntries(ids.map(id => [id, "Yes"])), "risk-assessment-current": "Yes", "default-services-minimized": "Not applicable", "data-at-rest-protection": "No" },
      notes: { "sbom-release-specific": "S".repeat(9990) + "SBOM-END", "regular-security-testing": "C".repeat(21000) + "SCANS-END", "risk-assessment-current": "R".repeat(30000) + "RISK-HISTORY-END" }
    })), expandedIds);
    await page.reload();
    await page.getByRole("tab", { name: /Detailed verification/ }).click();
    for (const id of expandedIds) {
      assert.equal(await card(id).locator("input:checked").count(), 0, `Expanded control must require review: ${id}`);
      assert.ok((await card(id).locator("textarea").inputValue()).includes("Previous answer: Yes before catalog revision 3"));
    }
    assert.equal(await card("risk-assessment-current").getByRole("radio", { name: "Yes", exact: true }).isChecked(), true);
    assert.equal(await card("risk-assessment-current").locator("textarea").inputValue(), "R".repeat(30000) + "RISK-HISTORY-END");
    assert.ok((await card("sbom-release-specific").locator("textarea").inputValue()).endsWith("SBOM-END"));
    const expandedNotes = await card("regular-security-testing").locator("textarea").inputValue();
    assert.ok(expandedNotes.endsWith("SCANS-END"));
    assert.equal(await detail.locator(".dv-control").count(), catalog.items.length);
    assert.equal(await card("default-services-minimized").getByRole("radio", { name: "Not applicable", exact: true }).isChecked(), true);
    assert.equal(await card("data-at-rest-protection").getByRole("radio", { name: "No", exact: true }).isChecked(), true);
    await card("sbom-release-specific").getByRole("radio", { name: "Yes", exact: true }).check();
    await page.reload();
    await page.getByRole("tab", { name: /Detailed verification/ }).click();
    assert.equal(await card("sbom-release-specific").getByRole("radio", { name: "Yes", exact: true }).isChecked(), true);
    assert.equal(await card("regular-security-testing").locator("textarea").inputValue(), expandedNotes, "Revision 3 review migration must be idempotent");
    // Revision 4 merges: any retired No fails the combined control; a lone pass stays unverified.
    await page.evaluate(() => localStorage.setItem("cra-detailed-assessment-v1", JSON.stringify({
      version: 1, catalogRevision: 3,
      answers: { "least-privilege-runtime": "Yes", "component-isolation": "No", "tokens-unpredictable": "Yes", "session-rotation-binding": "Yes", "privileged-mfa": "Yes", "browser-session-storage": "Yes" },
      notes: { "component-isolation": "ISOLATION-END" }
    })));
    await page.reload();
    await page.getByRole("tab", { name: /Detailed verification/ }).click();
    assert.equal(await card("least-privilege-runtime").getByRole("radio", { name: "No", exact: true }).isChecked(), true);
    assert.ok((await card("least-privilege-runtime").locator("textarea").inputValue()).includes("ISOLATION-END"));
    assert.equal(await card("tokens-unpredictable").getByRole("radio", { name: "Yes", exact: true }).isChecked(), true);
    assert.equal(await card("privileged-mfa").locator("input:checked").count(), 0);
    assert.equal(await card("browser-session-storage").getByRole("radio", { name: "Yes", exact: true }).isChecked(), true);
    assert.equal(await detail.locator('[id="control-component-isolation"]').count(), 0);
    await page.evaluate(ids => localStorage.setItem("cra-detailed-assessment-v1", JSON.stringify({ version: 1, catalogRevision: 4, answers: Object.fromEntries(ids.map(id => [id, "Yes"])), notes: {} })), catalog.items.map(item => item.id));
    await page.reload();
    await page.getByRole("tab", { name: /Detailed verification/ }).click();
    await detail.getByRole("button", { name: "Copy agent prompt", exact: true }).click();
    assert.ok((await detail.locator(".dv-agent-status").first().innerText()).includes("All controls are answered"));
    await detail.getByLabel("Prompt scope", { exact: true }).selectOption("all");
    assert.ok((await detail.getByLabel("Agent review prompt", { exact: true }).inputValue()).includes('"id": "product-boundaries"'));
    const blocked = await browser.newContext();
    await blocked.addInitScript(() => { Storage.prototype.getItem = Storage.prototype.setItem = () => { throw new DOMException("Blocked", "SecurityError"); }; });
    const blockedPage = await blocked.newPage();
    await blockedPage.goto(url);
    await blockedPage.getByRole("tab", { name: /Detailed verification/ }).click();
    await blockedPage.locator(".dv-control").first().getByRole("radio", { name: "Yes", exact: true }).check();
    assert.ok((await blockedPage.locator(".dv-save-state").innerText()).includes("unavailable"));
    assert.equal(await blockedPage.locator("[data-count=reviewed]").innerText(), "1");
    await blockedPage.getByRole("tab", { name: /General verification/ }).click();
    const blockedGeneral = blockedPage.locator("#general-verification-panel");
    await blockedGeneral.locator("#requirement-1").getByRole("radio", { name: "Have it", exact: true }).check();
    await blockedGeneral.locator("#requirement-5").getByRole("radio", { name: "Partially", exact: true }).check();
    await blockedGeneral.locator("#requirement-5 .notes summary").click();
    await blockedGeneral.locator("#requirement-5 textarea").fill("Unavailable storage filtered evidence");
    await blockedGeneral.getByRole("combobox", { name: "Filter requirements" }).selectOption("Have it");
    const blockedPdfDownload = blockedPage.waitForEvent("download", { timeout: 120000 });
    await blockedGeneral.getByRole("button", { name: "Download PDF", exact: true }).click();
    await (await blockedPdfDownload).saveAs(path.join(output, "general-storage-unavailable.pdf"));
    await blocked.close();
    assert.deepEqual(errors, []);
    assert.ok(requests.every(request => request.method === "GET" && request.url.startsWith(url.slice(0, url.indexOf("/cra-checklist/")))));
    console.log(JSON.stringify({ result: "PASS", controls: catalog.items.length, output, browserErrors: errors, requests: requests.length }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
