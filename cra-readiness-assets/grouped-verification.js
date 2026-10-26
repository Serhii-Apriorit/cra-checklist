/* Independent experiment: shared-evidence decisions with explicit control exceptions. */
(() => {
  "use strict";
  const catalog = window.CRADetailedCatalog, grouped = window.CRAGroupedCatalog, agent = window.CRADetailedAgent;
  if (!catalog || !grouped || !agent) return;
  const storageKey = "cra-grouped-assessment-v1", choices = ["Yes", "No", "Not applicable"];
  const empty = () => ({ version: 1, catalogRevision: catalog.revision, groupingRevision: grouped.revision, product: "", reviewer: "", groupAnswers: {}, groupNotes: {}, answers: {}, notes: {}, fileEvidence: {}, includeFileEvidence: false, updated: "" });
  let saveAvailable = true, notice = "", panel, state = restore(), exporting = false;
  let search = "", filter = "all", cardNodes = new Map();
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const button = (text, className, handler) => {
    const node = el("button", className, text); node.type = "button"; node.addEventListener("click", handler); return node;
  };
  const field = (label, input) => { const wrap = el("label", "dv-field", label); input.setAttribute("aria-label", label); wrap.append(input); return wrap; };
  function restore() {
    const result = empty();
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (!saved || saved.version !== 1) return result;
      for (const key of ["product", "reviewer", "updated"]) if (typeof saved[key] === "string") result[key] = saved[key].slice(0, 300);
      result.includeFileEvidence = saved.includeFileEvidence === true;
      const current = saved.catalogRevision === catalog.revision && saved.groupingRevision === grouped.revision;
      for (const group of grouped.groups) {
        if (current && choices.includes(saved.groupAnswers?.[group.id])) result.groupAnswers[group.id] = saved.groupAnswers[group.id];
        if (typeof saved.groupNotes?.[group.id] === "string") result.groupNotes[group.id] = saved.groupNotes[group.id].slice(0, 30000);
      }
      for (const item of catalog.items) {
        if (choices.includes(saved.answers?.[item.id]) || saved.answers?.[item.id] === null) result.answers[item.id] = saved.answers[item.id];
        if (!current && result.answers[item.id] === "Yes") result.answers[item.id] = null;
        if (typeof saved.notes?.[item.id] === "string") result.notes[item.id] = saved.notes[item.id].slice(0, 30000);
        const files = agent.sanitizeEvidence(saved.fileEvidence?.[item.id]);
        if (files.length) result.fileEvidence[item.id] = files;
      }
      if (!current) notice = "The experiment’s catalog changed. Group decisions and individual passes need review; notes and file evidence were retained.";
    } catch (error) { if (!(error instanceof SyntaxError)) saveAvailable = false; }
    return result;
  }
  function save() {
    state.updated = new Date().toISOString();
    try { localStorage.setItem(storageKey, JSON.stringify(state)); saveAvailable = true; } catch { saveAvailable = false; }
    const node = panel?.querySelector(".gv-save-state");
    if (node) { node.textContent = saveAvailable ? "Saved on this device" : "Local saving unavailable — download a copy"; node.classList.toggle("dv-save-error", !saveAvailable); }
  }
  const effectiveAnswers = () => Object.fromEntries(catalog.items.map(item => [item.id, grouped.answerFor(state, item.id)]).filter(([, answer]) => answer));
  function update() {
    const focusedCard = document.activeElement?.closest(".gv-question");
    const statuses = grouped.groups.map(group => grouped.statusFor(state, group));
    const count = status => statuses.filter(value => value === status).length;
    const answers = effectiveAnswers();
    const counts = { reviewed: grouped.groups.length - count("Unanswered"), yes: count("Yes"), no: count("No"), na: count("Not applicable"), unanswered: count("Unanswered"), controls: Object.keys(answers).length };
    for (const node of panel.querySelectorAll("[data-gv-count]")) node.textContent = counts[node.dataset.gvCount];
    panel.querySelector("progress").value = counts.reviewed;
    let visible = 0;
    for (const group of grouped.groups) {
      const card = cardNodes.get(group.id), status = grouped.statusFor(state, group);
      card.dataset.answer = status;
      const coverage = group.ids.filter(id => grouped.answerFor(state, id)).length;
      card.querySelector(".gv-group-status").textContent = `${status} · ${coverage}/${group.ids.length} controls answered`;
      const decision = state.groupAnswers[group.id];
      for (const label of card.querySelectorAll(".gv-decision .dv-answer")) {
        const radio = label.querySelector("input"); radio.checked = radio.value === decision; label.classList.toggle("dv-selected", radio.checked);
      }
      card.querySelector(".gv-clear").hidden = !decision;
      card.querySelector(".gv-decision-note").textContent = decision === "No" ? "Gap recorded for this group. Individual failures are not assumed; identify them below if known. Unknown checks stay unanswered." : decision ? "This decision supplies the answer for controls without an individual exception. Existing exceptions take precedence." : "Answer the group after reviewing shared evidence, or use the project agent to review individual controls.";
      card.querySelector(".gv-conflict").hidden = !decision || status === decision;
      card.querySelector(".gv-conflict").textContent = `Current outcome: ${status}. Individual exceptions take precedence over the group decision.`;
      for (const row of card.querySelectorAll("[data-gv-control]")) {
        const id = row.dataset.gvControl;
        row.querySelector(".gv-control-status").textContent = `${grouped.answerFor(state, id) || "Unanswered"}${Object.prototype.hasOwnProperty.call(state.answers, id) ? " · individual review" : decision === "Yes" || decision === "Not applicable" ? " · group decision" : ""}`;
      }
      const haystack = [group.title, group.guidance, group.evidence, ...catalog.items.filter(item => group.ids.includes(item.id)).flatMap(item => [item.id, item.title, item.guidance, item.applicability])].join(" ").toLowerCase();
      card.hidden = !(filter === "all" || filter === "attention" && ["No", "Unanswered"].includes(status) || filter === status) || !haystack.includes(search.trim().toLowerCase());
      if (!card.hidden) visible++;
    }
    panel.querySelector(".gv-filter-result").textContent = `Showing ${visible} of ${grouped.groups.length} questions. Exports include all 96 original controls and every group decision.`;
    panel.querySelector(".gv-empty").hidden = visible !== 0;
    if (focusedCard?.hidden) {
      const next = [...cardNodes.values()].find(card => !card.hidden);
      (next?.querySelector("input[type=radio]") || panel.querySelector(".gv-toolbar select")).focus();
    }
  }
  function metadata(key, label, placeholder) {
    const input = el("input"); input.type = "text"; input.maxLength = 300; input.value = state[key]; input.placeholder = placeholder;
    input.addEventListener("input", () => { state[key] = input.value; save(); }); return field(label, input);
  }
  function controlRow(item) {
    const row = el("details", "gv-control"); row.dataset.gvControl = item.id;
    const summary = el("summary"); summary.append(el("span", "", item.title), el("small", "gv-control-status")); row.append(summary);
    row.append(el("p", "gv-control-meta", `${item.id} · ${item.priority} · ${item.basis}`), el("p", "", item.guidance), el("p", "", `Applicability: ${item.applicability}`), el("p", "", `Evidence: ${item.evidence}`));
    const select = el("select");
    for (const [value, label] of [["inherit", "Use group decision"], ["unknown", "Unanswered / needs verification"], ...choices.map(value => [value, value])]) {
      const option = el("option", "", label); option.value = value; select.append(option);
    }
    select.value = Object.prototype.hasOwnProperty.call(state.answers, item.id) ? state.answers[item.id] || "unknown" : "inherit";
    select.addEventListener("change", () => {
      if (select.value === "inherit") delete state.answers[item.id]; else state.answers[item.id] = select.value === "unknown" ? null : select.value;
      save(); update();
    });
    row.append(field("Individual answer / exception", select));
    const notes = el("textarea"); notes.rows = 3; notes.maxLength = 30000; notes.value = state.notes[item.id] || "";
    notes.addEventListener("input", () => { state.notes[item.id] = notes.value; save(); }); row.append(field("Individual review notes", notes));
    const files = el("details", "gv-files"); files.append(el("summary", "", "File evidence (optional)"));
    const editor = el("textarea"); editor.rows = 3; editor.value = JSON.stringify(state.fileEvidence[item.id] || [], null, 2); editor.placeholder = '[{"path":"src/example.ts","line":42,"description":"Verified evidence"}]';
    const message = el("p", "gv-file-status"); message.setAttribute("role", "status");
    files.append(field("File evidence JSON array", editor), button("Save file evidence", "button secondary", () => {
      try {
        const input = JSON.parse(editor.value);
        if (!Array.isArray(input) || input.length > 20) throw new Error("Use an array with at most 20 file references.");
        const valid = input.map(agent.validateEvidence); state.fileEvidence[item.id] = valid; save(); message.textContent = "File evidence saved.";
      } catch (error) { message.textContent = error.message; }
    }), message); row.append(files);
    const refs = el("p", "gv-references");
    for (const ref of item.references) { const link = el("a", "", ref.label); link.href = ref.url; link.target = "_blank"; link.rel = "noreferrer"; refs.append(link, document.createTextNode(" ")); }
    row.append(refs); return row;
  }
  function groupCard(group, index) {
    const card = el("article", "dv-control gv-question"); card.id = `grouped-question-${group.id}`;
    const items = group.ids.map(id => catalog.items.find(item => item.id === id));
    const priority = items.some(item => item.priority === "Critical") ? "Critical" : items.some(item => item.priority === "High") ? "High" : "Medium";
    const top = el("div", "dv-control-top"); top.append(el("span", "dv-control-id", `QUESTION ${String(index + 1).padStart(2, "0")} · ${items.length} original controls`), el("span", `dv-priority dv-priority-${priority.toLowerCase()}`, `${priority} included`));
    card.append(top, el("h3", "", group.title), el("p", "gv-guidance", group.guidance));
    const evidence = el("div", "gv-evidence"); evidence.append(el("strong", "", "Review this evidence once"), el("p", "", group.evidence)); card.append(evidence);
    const decisions = el("fieldset", "dv-answers gv-decision"); decisions.append(el("legend", "gv-legend", "Group decision"));
    for (const [index, choice] of choices.entries()) {
      const label = el("label", `dv-answer dv-answer-${index}`); const radio = el("input"); radio.type = "radio"; radio.name = `gv-${group.id}`; radio.value = choice;
      radio.addEventListener("change", () => { state.groupAnswers[group.id] = choice; save(); update(); }); label.append(radio, document.createTextNode(choice)); decisions.append(label);
    }
    decisions.append(button("Clear group decision", "dv-clear gv-clear", () => { delete state.groupAnswers[group.id]; save(); update(); }));
    card.append(decisions, el("p", "gv-decision-note"), el("p", "gv-conflict"), el("p", "gv-group-status"));
    const notes = el("details", "gv-notes"); notes.append(el("summary", "", "Shared evidence and review notes"));
    const input = el("textarea"); input.rows = 3; input.maxLength = 30000; input.value = state.groupNotes[group.id] || "";
    input.placeholder = "Record the release/version, evidence bundle, coverage, owner and any remaining verification. Reuse this note across the group.";
    input.addEventListener("input", () => { state.groupNotes[group.id] = input.value; save(); }); notes.append(field("Shared evidence / notes", input)); card.append(notes);
    const checks = el("details", "gv-checks"); checks.append(el("summary", "", `Coverage and individual exceptions (${items.length} controls)`));
    checks.append(el("p", "", "All original wording, applicability and references are retained below. Record No, N/A or unknown for individual exceptions; a group Yes never overrides them. Clear an exception by choosing Use group decision."));
    for (const item of items) checks.append(controlRow(item)); card.append(checks);
    cardNodes.set(group.id, card); return card;
  }
  function agentReview() {
    const section = el("section", "dv-agent-assistance gv-agent");
    section.append(el("h3", "", "Let your project agent do the first pass"), el("p", "", "Reuse existing project evidence across the bundles, then review the gaps and unknowns. The agent still evaluates each original control; grouped headings never replace verification. Copy/paste only; nothing is uploaded automatically."));
    const scope = el("select");
    for (const [value, title] of [["unanswered", "Unanswered controls"], ["all", "All controls"]]) { const option = el("option", "", title); option.value = value; scope.append(option); }
    const promptDetails = el("details"); promptDetails.append(el("summary", "", "View prompt / copy manually"));
    const prompt = el("textarea"); prompt.readOnly = true; prompt.rows = 7; promptDetails.append(field("Agent review prompt", prompt));
    const status = el("p", "gv-agent-status"); status.setAttribute("role", "status");
    const refresh = () => {
      const items = catalog.items.filter(item => scope.value === "all" || !grouped.answerFor(state, item.id));
      prompt.value = items.length ? `Experimental grouped review. Organize your inspection around these shared evidence bundles, reuse each artifact across relevant controls, and report individual findings. Identify remaining human verification in notes; do not assume a bundle passes from a partial sample.\n\n${JSON.stringify(grouped.groups.map(({ title, evidence, ids }) => ({ title, evidence, ids: ids.filter(id => items.some(item => item.id === id)) })).filter(group => group.ids.length), null, 2)}\n\n${agent.buildPrompt(catalog, items)}` : "All controls are answered. Choose All controls to request another review.";
      return items.length;
    };
    scope.addEventListener("change", refresh); promptDetails.addEventListener("toggle", () => { if (promptDetails.open) refresh(); });
    const actions = el("div", "dv-agent-actions"); actions.append(field("Prompt scope", scope), button("Copy agent prompt", "button secondary", async () => {
      if (!refresh()) { status.textContent = prompt.value; return; }
      try { await navigator.clipboard.writeText(prompt.value); status.textContent = "Prompt copied. Paste it into your project agent."; }
      catch { promptDetails.open = true; prompt.focus(); prompt.select(); status.textContent = "Copy the selected prompt manually."; }
    }));
    const imports = el("details", "gv-import"); imports.append(el("summary", "", "Paste agent results"));
    const input = el("textarea"); input.rows = 6; input.maxLength = 2000000; input.spellcheck = false; imports.append(field("Agent results JSON", input));
    const replace = el("input"); replace.type = "checkbox"; const replaceLabel = el("label", "dv-checkbox"); replaceLabel.append(replace, document.createTextNode("Replace existing answers, including inherited group answers")); imports.append(replaceLabel);
    const preview = el("div", "gv-preview"); preview.hidden = true;
    const importStatus = el("p"); importStatus.setAttribute("role", "status"); let parsed;
    const merge = review => {
      const result = agent.merge({ ...state, answers: effectiveAnswers() }, review, { overwriteAnswers: replace.checked, noteLimit: () => 30000 });
      result.state.answers = { ...state.answers };
      for (const entry of review.results) if (entry.answer !== null && (replace.checked || !grouped.answerFor(state, entry.id))) result.state.answers[entry.id] = entry.answer;
      return result;
    };
    const apply = button("Apply agent results", "button primary", () => {
      if (!parsed) return;
      try { const result = merge(parsed); state = result.state; notice = `Agent review applied: ${result.summary.answered} answers filled; ${result.summary.preserved} existing answers kept. Review the findings and remaining unknowns.`; save(); render(); panel.querySelector("h2").focus(); }
      catch (error) { importStatus.textContent = error.message; }
    }); apply.disabled = true;
    const invalidate = () => { parsed = undefined; apply.disabled = true; preview.hidden = true; importStatus.textContent = ""; };
    input.addEventListener("input", invalidate); replace.addEventListener("change", invalidate);
    imports.append(replaceLabel, button("Preview agent results", "button secondary", () => {
      invalidate(); preview.replaceChildren();
      try {
        const review = agent.parse(input.value, catalog), result = merge(review);
        preview.append(el("p", "", `${review.project ? `Agent project: ${review.project}. ` : ""}${review.results.length} findings: ${result.summary.answered} answers to fill; ${result.summary.preserved} existing answers to keep. Unknowns remain unverified. Preview includes all returned findings.`));
        const list = el("ul");
        for (const entry of review.results) {
          const item = catalog.items.find(item => item.id === entry.id), row = el("li"), detail = el("details");
          detail.append(el("summary", "", `${item.title} — current: ${grouped.answerFor(state, entry.id) || "Unanswered"}; agent: ${entry.answer || "Unanswered"}`));
          if (entry.notes) detail.append(el("p", "", entry.notes));
          for (const file of entry.fileEvidence) detail.append(el("p", "", `${file.path}:${file.line}${file.description ? ` — ${file.description}` : ""}`));
          row.append(detail); list.append(row);
        }
        preview.append(list); preview.hidden = false; parsed = review; apply.disabled = false; importStatus.textContent = "Valid results. Review before applying.";
      } catch (error) { importStatus.textContent = error.message; }
    }), apply, importStatus, preview);
    section.append(actions, status, promptDetails, imports); refresh(); return section;
  }
  function reportData() {
    const notes = {};
    for (const item of catalog.items) {
      const group = grouped.groupFor(item.id), explicit = Object.prototype.hasOwnProperty.call(state.answers, item.id);
      notes[item.id] = [`Experimental question: ${group.title}`, `Group outcome: ${grouped.statusFor(state, group)}; group decision: ${state.groupAnswers[group.id] || "Unanswered"}.`, `Answer source: ${explicit ? "individual review / exception" : ["Yes", "Not applicable"].includes(state.groupAnswers[group.id]) ? "group decision covering the full control" : "unanswered; a group gap does not identify individual failures"}.`, state.groupNotes[group.id] ? `Shared evidence / notes:\n${state.groupNotes[group.id]}` : "", state.notes[item.id] ? `Individual notes:\n${state.notes[item.id]}` : ""].filter(Boolean).join("\n\n");
    }
    const outcomes = grouped.groups.map(group => `${grouped.statusFor(state, group)}: ${group.title}`).join("\n");
    return { state: { ...state, answers: effectiveAnswers(), notes }, catalog: { ...catalog, version: `${catalog.version} / experimental grouping ${grouped.revision}`, answerGuidance: `EXPERIMENTAL GROUPED REVIEW: 18 questions retain all 96 original controls. Answers inherited from a group decision are identified in each control's notes. No group gap is assumed to fail every underlying control.\n\nGroup outcomes:\n${outcomes}\n\n${catalog.answerGuidance}` } };
  }
  function download(content, filename) {
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" })), anchor = el("a"); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function exportReport(format, node) {
    if (exporting) return;
    exporting = true; node.disabled = true; const status = panel.querySelector(".gv-export-status"); status.textContent = "Preparing download…";
    const snapshot = reportData(), options = { includeFileEvidence: state.includeFileEvidence };
    snapshot.state = JSON.parse(JSON.stringify(snapshot.state));
    try {
      if (format === "md") download(window.CRADetailedReport.markdown(snapshot.state, snapshot.catalog, options).replace("# CRA readiness detailed report", "# CRA readiness experimental grouped report"), "Apriorit-CRA-Experimental.md");
      else { const pdf = await window.CRADetailedReport.createPdf(snapshot.state, snapshot.catalog, options); pdf.setProperties({ title: "CRA readiness experimental grouped report" }); pdf.save("Apriorit-CRA-Experimental.pdf"); }
      status.textContent = "Download started. All group decisions, shared notes and 96 original controls are included.";
    } catch (error) { status.textContent = error.message || "Download failed. Please retry."; }
    finally { exporting = false; node.disabled = false; }
  }
  function render() {
    panel.replaceChildren(); cardNodes = new Map();
    const sidebar = el("aside", "dv-sidebar"); sidebar.setAttribute("aria-label", "Experimental assessment summary");
    const summary = el("section", "dv-summary"); summary.append(el("div", "dv-overline", "GROUPED EXPERIMENT"));
    const total = el("div", "dv-progress-total"), reviewed = el("strong"); reviewed.dataset.gvCount = "reviewed"; total.append(reviewed, el("span", "", " / 18"));
    const bar = el("progress"); bar.max = 18; bar.setAttribute("aria-label", "Grouped questions reviewed"); summary.append(total, el("p", "", "questions reviewed"), bar);
    const counts = el("dl", "dv-counts");
    for (const [key, label] of [["yes", "Yes"], ["no", "No / gap found"], ["na", "Not applicable"], ["unanswered", "Needs verification"]]) { const row = el("div", `dv-count-${key}`), value = el("dd"); value.dataset.gvCount = key; row.append(el("dt", "", label), value); counts.append(row); }
    const coverage = el("p", "gv-coverage"), covered = el("b"); covered.dataset.gvCount = "controls"; coverage.append(covered, document.createTextNode(" / 96 underlying controls answered")); summary.append(counts, coverage, el("p", "dv-summary-foot", "Review progress, not a compliance score. A group gap may leave individual controls unverified."));
    const exports = el("section", "dv-exports"); exports.append(el("h3", "", "Keep your experiment"), el("p", "", "All original checks, sources, group decisions and shared evidence are included."));
    const include = el("input"); include.type = "checkbox"; include.checked = state.includeFileEvidence; include.addEventListener("change", () => { state.includeFileEvidence = include.checked; save(); });
    const includeLabel = el("label", "dv-checkbox"); includeLabel.append(include, document.createTextNode("Include file evidence in PDF and Markdown")); exports.append(includeLabel);
    for (const [format, label] of [["pdf", "Download PDF"], ["md", "Download Markdown"]]) { const node = button(label, `button ${format === "pdf" ? "primary" : "secondary"}`, () => exportReport(format, node)); exports.append(node); }
    const exportStatus = el("p", "gv-export-status"); exportStatus.setAttribute("role", "status"); exports.append(exportStatus);
    sidebar.append(summary, exports);
    const main = el("div", "dv-main"), intro = el("section", "dv-intro"), headingRow = el("div", "dv-heading-row");
    const heading = el("h2", "", "Grouped developer verification"); heading.tabIndex = -1; const saved = el("span", "gv-save-state"); saved.setAttribute("role", "status"); headingRow.append(heading, saved);
    intro.append(headingRow, el("p", "", "18 evidence-led questions. Full coverage of the same 96 developer controls. Review shared evidence once, then focus on gaps and exceptions."));
    const how = el("div", "gv-how");
    for (const [title, body] of [["1. Gather once", "Use the suggested evidence bundle or ask your project agent for a first pass."], ["2. Decide as a group", "Yes: every applicable check is verified. No: a confirmed gap. N/A: the entire group is outside scope."], ["3. Review exceptions", "Expand original checks for mixed applicability, known failures or unknowns. Individual answers always take precedence."]]) { const step = el("div"); step.append(el("strong", "", title), el("p", "", body)); how.append(step); }
    const metadataRow = el("div", "dv-metadata"); metadataRow.append(metadata("product", "Product / project (optional)", "Product and release/version"), metadata("reviewer", "Reviewer (optional)", "Your name or team"));
    intro.append(how, el("p", "gv-independence", "Experimental and saved separately. The first two assessments are unchanged. Grouping reduces repeated evidence review; it does not remove required checks or prove runtime behavior from source alone."), metadataRow);
    if (notice) { const message = el("p", "dv-assistance-notice", notice); message.setAttribute("role", "status"); intro.append(message); }
    const toolbar = el("section", "gv-toolbar"); toolbar.setAttribute("aria-label", "Filter grouped questions");
    const searchInput = el("input"); searchInput.type = "search"; searchInput.value = search; searchInput.placeholder = "Search questions or any original control…"; searchInput.addEventListener("input", () => { search = searchInput.value; update(); });
    const statusFilter = el("select");
    for (const [value, label] of [["all", "All questions"], ["attention", "Gaps and unknowns"], ["Yes", "Yes"], ["No", "No / gap found"], ["Not applicable", "Not applicable"], ["Unanswered", "Needs verification"]]) { const option = el("option", "", label); option.value = value; statusFilter.append(option); }
    statusFilter.value = filter; statusFilter.addEventListener("change", () => { filter = statusFilter.value; update(); });
    toolbar.append(field("Search full coverage", searchInput), field("Group outcome", statusFilter));
    const result = el("p", "dv-filter-result gv-filter-result"); result.setAttribute("role", "status"); main.append(intro, agentReview(), toolbar, result);
    grouped.groups.forEach((group, index) => main.append(groupCard(group, index))); main.append(el("p", "gv-empty", "No matching questions. Change the search or outcome filter."));
    const dialog = el("dialog", "dv-reset-dialog"); dialog.setAttribute("aria-labelledby", "gv-reset-title"); const title = el("h2", "", "Start a new experimental assessment?"); title.id = "gv-reset-title";
    dialog.append(title, el("p", "", "This clears only the third tab’s project details, group decisions, exceptions, notes and file evidence. Download a copy first if needed.")); const actions = el("div", "dv-dialog-actions");
    const cancel = button("Keep experiment", "button secondary", () => dialog.close()); cancel.autofocus = true; actions.append(cancel, button("Clear experimental assessment", "button primary", () => { state = empty(); notice = ""; search = ""; filter = "all"; save(); dialog.close(); render(); panel.querySelector("h2").focus(); })); dialog.append(actions);
    sidebar.append(button("Start a new experimental assessment", "dv-reset", () => dialog.showModal())); panel.append(sidebar, main, dialog); save(); update();
  }
  function mount() {
    const detailed = document.getElementById("detailed-verification-panel");
    if (!detailed || document.getElementById("grouped-verification-panel")) return;
    panel = el("section", "dv-workspace gv-workspace"); panel.id = "grouped-verification-panel"; panel.setAttribute("role", "tabpanel"); panel.setAttribute("aria-labelledby", "grouped-verification-tab"); panel.tabIndex = 0;
    panel.hidden = document.getElementById("grouped-verification-tab")?.getAttribute("aria-selected") !== "true";
    detailed.after(panel); render();
  }
  new MutationObserver(mount).observe(document.getElementById("root"), { childList: true, subtree: true }); mount();
})();
