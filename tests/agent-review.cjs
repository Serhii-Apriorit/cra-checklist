const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const context = { window: {} };
for (const file of ["detailed-catalog.js", "detailed-agent.js", "detailed-report.js"]) {
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../cra-readiness-assets", file), "utf8"), context);
}
const { CRADetailedCatalog: catalog, CRADetailedAgent: agent, CRADetailedReport: reports } = context.window;
const [a, b] = catalog.items;
const payload = results => ({ format: "cra-detailed-agent-review", version: 1, catalogRevision: catalog.revision, results });
const result = (id, answer, notes = "", fileEvidence = []) => ({ id, answer, notes, fileEvidence });
const parse = value => agent.parse(JSON.stringify(value), catalog);
const plain = value => JSON.parse(JSON.stringify(value));
const prompt = agent.buildPrompt(catalog);
for (const item of catalog.items) assert.ok(prompt.includes(`"id": "${item.id}"`));
assert.ok(prompt.includes("file references exclusively in structured fileEvidence, never in notes"));
assert.ok(prompt.includes("source code alone"));
assert.ok(prompt.includes('"catalogRevision"'));
const subset = agent.buildPrompt(catalog, [b]);
assert.ok(subset.includes(`"id": "${b.id}"`) && !subset.includes(`"id": "${a.id}"`));

const evidence = { path: "src/auth/session.ts", line: 42, description: "Expiry is checked here <script>" };
assert.deepEqual(plain(agent.validateEvidence({ ...evidence, path: ".\\src\\auth\\session.ts" })), evidence);
for (const path of ["/etc/passwd", "../secrets", "src/../secrets", "C:\\private\\key", "\\\\host\\share", "https://example.test/a", "src//file", "src/./file", " a ", "src/\u0000file"]) {
  assert.throws(() => agent.validateEvidence({ path, line: 1 }), /relative|path/i);
}
for (const line of [0, -1, 1.2, "42", 10000001]) assert.throws(() => agent.validateEvidence({ path: "src/file", line }), /line/);
assert.equal(agent.sanitizeEvidence([evidence, evidence, { path: "../x", line: 1 }]).length, 1);

for (const value of [
  { ...payload([result(a.id, "Yes")]), catalogRevision: -1 },
  { ...payload([result(a.id, "Yes")]), extra: true },
  payload([result("unknown-control", "Yes")]),
  payload([result(a.id, "Yes"), result(a.id, "No")]),
  payload([result(a.id, "Maybe")]),
  payload([result(a.id, "Yes", "x".repeat(10001))]),
  payload([result(a.id, "Yes", "", [{ path: "/absolute", line: 1 }])]),
  payload([{ id: a.id, answer: "Yes", notes: "" }]),
  payload([])
]) assert.throws(() => parse(value));
assert.throws(() => agent.parse("{}".repeat(1000001), catalog), /limit/);
assert.equal(agent.parse("```json\n" + JSON.stringify(payload([result(a.id, null)])) + "\n```", catalog).results[0].answer, null);

const state = { version: 1, catalogRevision: catalog.revision, product: "Human project", reviewer: "Human", answers: { [a.id]: "No" }, notes: { [a.id]: "Human note" }, fileEvidence: {}, includeFileEvidence: false };
const before = JSON.stringify(state);
const review = parse(payload([result(a.id, "Yes", "Agent rationale", [evidence]), result(b.id, null, "Needs runtime verification")]));
const merged = agent.merge(state, review);
assert.equal(JSON.stringify(state), before, "Merge must not mutate state");
assert.equal(merged.state.answers[a.id], "No", "Human answers are preserved by default");
assert.equal(merged.state.answers[b.id], undefined, "Unknown results stay unanswered");
assert.ok(merged.state.notes[a.id].includes("Human note") && merged.state.notes[a.id].includes("Agent rationale"));
assert.ok(!merged.state.notes[a.id].includes(evidence.path), "File references must stay out of ordinary notes");
assert.equal(merged.state.fileEvidence[a.id].length, 1);
assert.equal(merged.state.product, "Human project");
assert.deepEqual(plain(agent.merge(merged.state, review).state), plain(merged.state), "Repeated imports must be idempotent");
assert.equal(agent.merge(state, review, { overwriteAnswers: true }).state.answers[a.id], "Yes");
const unknown = parse(payload([result(a.id, null)]));
assert.equal(agent.merge(state, unknown, { overwriteAnswers: true }).state.answers[a.id], "No", "Unknown must never clear an existing answer");
assert.throws(() => agent.merge(state, review, { noteLimit: () => 5 }), /notes exceed/);
assert.equal(JSON.stringify(state), before, "A rejected import must be atomic");
const tooMany = { ...state, fileEvidence: { [a.id]: Array.from({ length: 20 }, (_, n) => ({ path: "src/file", line: n + 1 })) } };
assert.throws(() => agent.merge(tooMany, review), /20/);
assert.equal(tooMany.fileEvidence[a.id].length, 20);

const without = reports.markdown(merged.state, catalog);
const withFiles = reports.markdown(merged.state, catalog, { includeFileEvidence: true });
assert.ok(!without.includes(evidence.path) && !without.includes("**File evidence**"));
assert.ok(withFiles.includes("src/auth/session\\.ts:42"));
assert.ok(withFiles.includes("&lt;script&gt;") && !withFiles.includes("<script>"));
assert.ok(without.includes("Human note") && withFiles.includes("Human note"));
console.log("PASS: prompt/schema, relative evidence, atomic imports, preserved answers, repeat imports and optional Markdown evidence");
