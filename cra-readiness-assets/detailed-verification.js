/* Independent developer assessment. The original React bundle owns the general panel. */
(() => {
  "use strict";
  const catalog = window.CRADetailedCatalog;
  const agent = window.CRADetailedAgent;
  if (!catalog || !agent) return;
  const storageKey = "cra-detailed-assessment-v1";
  const choices = ["Yes", "No", "Not applicable"];
  const empty = () => ({ version: 1, catalogRevision: catalog.revision, product: "", reviewer: "", answers: {}, notes: {}, fileEvidence: {}, includeFileEvidence: false, updated: "" });
  const noteLimit = item => 10000 * (1 + (item.mergedFrom?.length || 0)) + (item.mergedFrom?.length ? 2048 : 0) + (item.reviewRevision ? 2048 : 0);
  let saveAvailable = true;
  let migrationNotice = "";
  let assistanceNotice = "";
  let state = restore();
  let activeTab = "general";
  let mountPoint;
  let exporting = false;
  let cards = new Map();
  let groups = new Map();
  let filters = { search: "", category: "all", priority: "all", answer: "all" };

  function consolidateSavedAssessment(saved) {
    // Each merge applies once: only to assessments saved before the merge's catalog revision.
    const pending = item => (item.mergedFrom || []).filter(member => (member.revision || 2) > (saved.catalogRevision || 0));
    const answers = { ...saved.answers };
    const notes = { ...saved.notes };
    let changed = false;
    for (const item of catalog.items.filter(item => pending(item).length)) {
      const members = [{ id: item.id, label: item.title }, ...pending(item)];
      if (!members.some(member => choices.includes(answers[member.id]) || typeof notes[member.id] === "string" && notes[member.id])) continue;
      changed = true;
      const previous = members.map(member => ({ ...member, answer: choices.includes(answers[member.id]) ? answers[member.id] : "Unanswered", note: typeof notes[member.id] === "string" ? notes[member.id].slice(0, 10000) : "" }));
      // A previous pass for only part of a merged control must never become a pass for all of it.
      let answer;
      if (previous.some(member => member.answer === "No")) answer = "No";
      else if (previous.every(member => member.answer === "Not applicable")) answer = "Not applicable";
      else if (previous.every(member => member.answer === "Yes" || member.answer === "Not applicable")) answer = "Yes";
      for (const member of members) { delete answers[member.id]; delete notes[member.id]; }
      if (answer) answers[item.id] = answer;
      notes[item.id] = "Previous responses preserved after checklist consolidation. Review the combined control before changing its answer.\n\n" + previous.map(member => `${member.label}\nPrevious answer: ${member.answer}${member.note ? `\n${member.note}` : ""}`).join("\n\n");
    }
    if (changed) migrationNotice = "The checklist has been consolidated. Previous responses and notes are preserved under the combined controls. Review any merged controls now shown as unanswered.";
    return { ...saved, answers, notes };
  }

  function reviewExpandedControls(saved) {
    const answers = { ...saved.answers };
    const notes = { ...saved.notes };
    const expanded = catalog.items.filter(item => item.reviewRevision > (saved.catalogRevision || 0) && answers[item.id] === "Yes");
    for (const item of expanded) {
      delete answers[item.id];
      const previousNote = typeof notes[item.id] === "string" ? notes[item.id] : "";
      notes[item.id] = `Previous answer: Yes before catalog revision ${item.reviewRevision}. This control now requires additional verification. Review the updated guidance before answering again.${previousNote ? `\n\n${previousNote}` : ""}`;
    }
    if (expanded.length) {
      migrationNotice = [migrationNotice, `${expanded.length} previously satisfied controls now have expanded verification requirements and are unanswered for review. Their previous Yes answers and evidence are preserved in notes.`].filter(Boolean).join(" ");
    }
    return { ...saved, answers, notes, catalogRevision: catalog.revision };
  }

  function restore() {
    const result = empty();
    try {
      let saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (!saved || typeof saved !== "object" || saved.version !== 1) return result;
      saved = consolidateSavedAssessment(saved);
      saved = reviewExpandedControls(saved);
      for (const field of ["product", "reviewer"]) {
        if (typeof saved[field] === "string") result[field] = saved[field].slice(0, 300);
      }
      if (typeof saved.updated === "string") result.updated = saved.updated;
      result.includeFileEvidence = saved.includeFileEvidence === true;
      for (const item of catalog.items) {
        if (choices.includes(saved.answers?.[item.id])) result.answers[item.id] = saved.answers[item.id];
        if (typeof saved.notes?.[item.id] === "string") result.notes[item.id] = saved.notes[item.id].slice(0, noteLimit(item));
        const evidence = agent.sanitizeEvidence(saved.fileEvidence?.[item.id]);
        if (evidence.length) result.fileEvidence[item.id] = evidence;
      }
    } catch (error) {
      // Invalid JSON is recoverable; blocked storage must remain visible to the user.
      if (!(error instanceof SyntaxError)) saveAvailable = false;
    }
    return result;
  }

  function save() {
    state.updated = new Date().toISOString();
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      saveAvailable = true;
    } catch { saveAvailable = false; }
    updateSaveStatus();
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(text, className, handler) {
    const node = el("button", className, text);
    node.type = "button";
    node.addEventListener("click", handler);
    return node;
  }
  function summary() {
    const count = value => catalog.items.filter(item => (state.answers[item.id] || "Unanswered") === value).length;
    const unresolved = priority => catalog.items.filter(item => item.priority === priority && (!state.answers[item.id] || state.answers[item.id] === "No")).length;
    return { total: catalog.items.length, reviewed: catalog.items.length - count("Unanswered"), yes: count("Yes"), no: count("No"), na: count("Not applicable"), unanswered: count("Unanswered"), critical: unresolved("Critical"), high: unresolved("High") };
  }
  function updateSaveStatus() {
    const node = mountPoint?.querySelector(".dv-save-state");
    if (!node) return;
    node.textContent = saveAvailable ? "Saved on this device" : "Local saving unavailable - download a copy";
    node.classList.toggle("dv-save-error", !saveAvailable);
  }

  function selectTab(name, focus = false) {
    activeTab = name;
    for (const tab of document.querySelectorAll(".verification-tabs [role=tab]")) {
      const selected = tab.dataset.tab === name;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    }
    document.getElementById("general-verification-panel").hidden = name !== "general";
    mountPoint.hidden = name !== "detailed";
    const grouped = document.getElementById("grouped-verification-panel");
    if (grouped) grouped.hidden = name !== "grouped";
  }

  function createTabs(general) {
    const tabs = el("div", "verification-tabs");
    tabs.id = "cra-verification-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Verification type");
    const tabDefinitions = [["general", "General verification", "10 readiness requirements"], ["detailed", "Detailed verification", `${catalog.items.length} developer controls`]];
    if (window.CRAGroupedCatalog) tabDefinitions.push(["grouped", "Grouped verification", `${window.CRAGroupedCatalog.groups.length} questions · experiment`]);
    for (const [name, title, subtitle] of tabDefinitions) {
      const tab = button("", "verification-tab", () => selectTab(name));
      tab.id = `${name}-verification-tab`;
      tab.dataset.tab = name;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", `${name}-verification-panel`);
      tab.append(el("span", "", title), el("small", "", subtitle));
      tab.addEventListener("keydown", event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const names = tabDefinitions.map(([name]) => name);
        const next = (names.indexOf(activeTab) + (event.key === "ArrowLeft" ? -1 : 1) + names.length) % names.length;
        selectTab(event.key === "Home" ? names[0] : event.key === "End" ? names[names.length - 1] : names[next], true);
      });
      tabs.append(tab);
    }
    general.before(tabs);
  }

  function field(label, fieldName, placeholder) {
    const wrap = el("label", "dv-field", label);
    const input = el("input");
    input.type = "text";
    input.maxLength = 300;
    input.value = state[fieldName];
    input.placeholder = placeholder;
    input.dataset.field = fieldName;
    input.addEventListener("input", () => { state[fieldName] = input.value; save(); });
    wrap.append(input);
    return wrap;
  }

  function selectFilter(label, key, values) {
    const wrap = el("label", "dv-field", label);
    const select = el("select");
    select.dataset.filter = key;
    for (const [value, title] of values) {
      const option = el("option", "", title);
      option.value = value;
      select.append(option);
    }
    select.value = filters[key];
    select.addEventListener("change", () => { filters[key] = select.value; applyFilters(); });
    wrap.append(select);
    return wrap;
  }

  function createCard(item) {
    const card = el("article", "dv-control");
    card.id = `control-${item.id}`;
    const top = el("div", "dv-control-top");
    top.append(el("span", "dv-control-id", item.id), el("span", `dv-priority dv-priority-${item.priority.toLowerCase()}`, item.priority));
    const title = el("h4", "", item.title);
    title.id = `title-${item.id}`;
    const answers = el("fieldset", "dv-answers");
    answers.append(el("legend", "sr-only", `Answer for ${item.title}`));
    for (const [index, choice] of choices.entries()) {
      const label = el("label", `dv-answer dv-answer-${index}`);
      const radio = el("input");
      radio.type = "radio";
      radio.name = `detailed-${item.id}`;
      radio.value = choice;
      radio.checked = state.answers[item.id] === choice;
      radio.addEventListener("change", () => {
        state.answers[item.id] = choice;
        save();
        updateCard(item);
        updateSummary();
        applyFilters();
      });
      label.append(radio, el("span", "", choice));
      answers.append(label);
    }
    const clear = button("Clear answer", "dv-clear", () => {
      delete state.answers[item.id];
      for (const radio of answers.querySelectorAll("input")) radio.checked = false;
      save(); updateCard(item); updateSummary(); applyFilters(card);
      if (!card.hidden) answers.querySelector("input").focus();
    });
    answers.append(clear);
    const naHint = el("p", "dv-na-hint", "Why does this control not apply? You can record an optional justification in notes below.");
    const details = el("details", "dv-guidance");
    details.append(el("summary", "", "How to verify / evidence"));
    for (const [heading, text] of [["How to verify", item.guidance], ["Evidence examples", item.evidence], ["Applicability", item.applicability], ["Basis", item.basis]]) {
      const paragraph = el("p");
      paragraph.append(el("strong", "", `${heading}. `), document.createTextNode(text));
      details.append(paragraph);
    }
    const refs = el("div", "dv-references");
    for (const reference of item.references) {
      const a = el("a", "", reference.label);
      a.href = reference.url;
      a.target = "_blank";
      a.rel = "noreferrer";
      refs.append(a);
    }
    details.append(refs);
    const notesLabel = el("label", "dv-notes-label", "Review notes (optional)");
    const notesSection = el("details", "dv-notes");
    const notesSummary = el("summary", "", state.notes[item.id] ? "Edit notes" : "Add notes");
    const notes = el("textarea");
    notes.rows = 2;
    notes.maxLength = noteLimit(item);
    notes.id = `evidence-${item.id}`;
    notes.value = state.notes[item.id] || "";
    notes.placeholder = "Explain the result, describe a gap, or justify N/A. Put project paths and line numbers under File evidence.";
    notes.addEventListener("input", () => {
      state.notes[item.id] = notes.value;
      notesSummary.textContent = notes.value ? "Edit notes" : "Add notes";
      save();
    });
    notesLabel.append(notes);
    notesSection.append(notesSummary, notesLabel);
    card.append(top, title, answers, naHint, details, notesSection, createFileEvidence(item));
    cards.set(item.id, card);
    updateCard(item);
    return card;
  }

  function createFileEvidence(item) {
    const section = el("details", "dv-file-evidence");
    const heading = el("summary");
    const list = el("ul", "dv-file-list");
    const form = el("form", "dv-file-form");
    const pathLabel = el("label", "dv-field", "Relative path");
    const path = el("input"); path.type = "text"; path.required = true; path.maxLength = 500; path.placeholder = "src/auth/session.ts";
    pathLabel.append(path);
    const lineLabel = el("label", "dv-field", "Line number");
    const line = el("input"); line.type = "number"; line.min = "1"; line.max = "10000000"; line.step = "1"; line.required = true;
    lineLabel.append(line);
    const descriptionLabel = el("label", "dv-field dv-file-description", "What this supports (optional)");
    const description = el("input"); description.type = "text"; description.maxLength = 1000; description.placeholder = "Session expiry is enforced here";
    descriptionLabel.append(description);
    const add = el("button", "button secondary", "Add file evidence"); add.type = "submit";
    const message = el("p", "dv-file-status"); message.setAttribute("role", "status");
    form.append(pathLabel, lineLabel, descriptionLabel, add, message);
    const refresh = () => {
      const entries = state.fileEvidence[item.id] || [];
      heading.textContent = `File evidence (${entries.length})`;
      list.replaceChildren();
      for (const [index, entry] of entries.entries()) {
        const row = el("li", "dv-file-entry");
        const body = el("div"); body.append(el("code", "", `${entry.path}:${entry.line}`));
        if (entry.description) body.append(el("p", "", entry.description));
        const remove = button("Remove", "dv-clear", () => {
          state.fileEvidence[item.id] = entries.filter((value, position) => position !== index);
          save(); refresh();
          path.focus();
        });
        remove.setAttribute("aria-label", `Remove file evidence ${entry.path}:${entry.line}`);
        row.append(body, remove); list.append(row);
      }
    };
    form.addEventListener("submit", event => {
      event.preventDefault();
      try {
        const entry = agent.validateEvidence({ path: path.value, line: Number(line.value), description: description.value });
        const entries = state.fileEvidence[item.id] || [];
        if (entries.some(value => agent.evidenceKey(value) === agent.evidenceKey(entry))) throw new Error("This file evidence is already recorded.");
        if (entries.length >= 20) throw new Error("A control can contain up to 20 file evidence entries.");
        state.fileEvidence[item.id] = [...entries, entry];
        save(); refresh(); form.reset();
        message.textContent = "File evidence saved separately from notes.";
      } catch (error) { message.textContent = error.message; }
    });
    section.append(heading, el("p", "dv-file-help", "Use project-relative paths and positive line numbers. File evidence is stored separately and included in reports only when selected."), list, form);
    refresh();
    return section;
  }

  function createAgentAssistance() {
    const section = el("section", "dv-agent-assistance");
    const heading = el("h3", "", "Review with your project agent");
    heading.id = "dv-agent-heading"; section.setAttribute("aria-labelledby", heading.id);
    section.append(heading, el("p", "", "Copy a review prompt to an agent with access to your project. Paste its JSON results here, preview them, then apply the known answers. Unverified items stay unanswered; this page does not contact an agent or upload project data."));
    const actions = el("div", "dv-agent-actions");
    const scopeLabel = el("label", "dv-field", "Prompt scope");
    const scope = el("select");
    scope.setAttribute("aria-label", "Prompt scope");
    for (const [value, title] of [["unanswered", "Unanswered controls"], ["all", "All controls"]]) {
      const option = el("option", "", title); option.value = value; scope.append(option);
    }
    scopeLabel.append(scope);
    const promptDetails = el("details", "dv-agent-prompt");
    promptDetails.append(el("summary", "", "View prompt / copy manually"));
    const promptLabel = el("label", "dv-field", "Agent review prompt");
    const promptText = el("textarea"); promptText.readOnly = true; promptText.rows = 8; promptText.spellcheck = false;
    promptLabel.append(promptText); promptDetails.append(promptLabel);
    const copyStatus = el("p", "dv-agent-status"); copyStatus.setAttribute("role", "status");
    const refreshPrompt = () => {
      const items = catalog.items.filter(item => scope.value === "all" || !state.answers[item.id]);
      if (!items.length) {
        promptText.value = "All controls are answered. Select All controls to request another review.";
        return 0;
      }
      const prompt = agent.buildPrompt(catalog, items);
      if (promptText.value !== prompt) promptText.value = prompt;
      return items.length;
    };
    scope.addEventListener("change", refreshPrompt);
    promptDetails.addEventListener("toggle", () => { if (promptDetails.open) refreshPrompt(); });
    const copy = button("Copy agent prompt", "button secondary", async () => {
      if (!refreshPrompt()) { copyStatus.textContent = "All controls are answered. Select All controls to request another review."; return; }
      try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(promptText.value);
        copyStatus.textContent = "Prompt copied. Give it to your project agent, then paste the JSON response below.";
      } catch {
        promptDetails.open = true;
        promptText.focus(); promptText.select();
        copyStatus.textContent = "Automatic clipboard access is unavailable. The prompt is selected; copy it manually.";
      }
    });
    actions.append(scopeLabel, copy);
    const imports = el("details", "dv-agent-import");
    imports.append(el("summary", "", "Paste agent results"), el("p", "", "Existing answers are kept by default. Notes and file evidence are merged after you review the preview; file paths are not added to notes."));
    const inputLabel = el("label", "dv-field", "Agent results JSON");
    const input = el("textarea"); input.rows = 7; input.maxLength = 2000000; input.spellcheck = false;
    input.placeholder = 'Paste the JSON object returned by the agent…'; inputLabel.append(input);
    const overwriteLabel = el("label", "dv-checkbox");
    const overwrite = el("input"); overwrite.type = "checkbox";
    overwriteLabel.append(overwrite, document.createTextNode("Replace existing answers for matching controls"));
    const status = el("p", "dv-agent-status"); status.setAttribute("role", "status");
    const preview = el("div", "dv-import-preview"); preview.hidden = true;
    let parsed;
    const apply = button("Apply agent results", "button primary", () => {
      if (!parsed) return;
      try {
        const merged = agent.merge(state, parsed, { overwriteAnswers: overwrite.checked, noteLimit });
        state = merged.state;
        assistanceNotice = `Agent results applied: ${merged.summary.answered} answers filled, ${merged.summary.preserved} existing answers kept, ${merged.summary.filesAdded} file evidence entries added. Review the imported findings before relying on them.`;
        save(); render(); mountPoint.querySelector("h2").focus();
      } catch (error) { status.textContent = error.message; }
    });
    apply.disabled = true;
    const showPreview = () => {
      parsed = undefined; apply.disabled = true; preview.hidden = true; preview.replaceChildren();
      try {
        const review = agent.parse(input.value, catalog);
        const merged = agent.merge(state, review, { overwriteAnswers: overwrite.checked, noteLimit });
        preview.append(el("p", "", `${review.project ? `Agent project: ${review.project}. ` : ""}${review.results.length} controls received; ${merged.summary.answered} answers will be filled, ${merged.summary.preserved} existing answers kept, ${merged.summary.filesAdded} file evidence entries added. Unknown results do not clear existing answers.`));
        const list = el("ul", "dv-import-results");
        for (const result of review.results) {
          const item = catalog.items.find(item => item.id === result.id);
          const row = el("li"); const details = el("details");
          details.append(el("summary", "", `${item.title} — current: ${state.answers[result.id] || "Unanswered"}; agent: ${result.answer || "Unanswered"}`));
          if (result.notes) details.append(el("p", "dv-preview-notes", result.notes));
          for (const evidence of result.fileEvidence) details.append(el("p", "dv-preview-file", `${evidence.path}:${evidence.line}${evidence.description ? ` — ${evidence.description}` : ""}`));
          row.append(details); list.append(row);
        }
        preview.append(list); preview.hidden = false; parsed = review; apply.disabled = false;
        status.textContent = "Valid results. Review the preview before applying.";
      } catch (error) { status.textContent = error.message; }
    };
    const previewButton = button("Preview agent results", "button secondary", showPreview);
    input.addEventListener("input", () => { parsed = undefined; apply.disabled = true; preview.hidden = true; status.textContent = ""; });
    overwrite.addEventListener("change", () => { if (parsed) showPreview(); });
    const importActions = el("div", "dv-agent-actions"); importActions.append(previewButton, apply);
    imports.append(inputLabel, overwriteLabel, importActions, status, preview);
    section.append(actions, copyStatus, promptDetails, imports);
    if (assistanceNotice) {
      const notice = el("p", "dv-assistance-notice", assistanceNotice); notice.setAttribute("role", "status"); section.prepend(notice);
    }
    refreshPrompt();
    return section;
  }

  function updateCard(item) {
    const card = cards.get(item.id);
    const answer = state.answers[item.id];
    card.dataset.answer = answer || "Unanswered";
    card.querySelector(".dv-na-hint").hidden = answer !== "Not applicable";
    card.querySelector(".dv-clear").hidden = !answer;
    for (const label of card.querySelectorAll(".dv-answer")) label.classList.toggle("dv-selected", label.querySelector("input").value === answer);
  }

  function updateSummary() {
    const counts = summary();
    for (const node of mountPoint.querySelectorAll("[data-count]")) node.textContent = String(counts[node.dataset.count]);
    const progress = mountPoint.querySelector("progress");
    progress.max = counts.total;
    progress.value = counts.reviewed;
    for (const category of catalog.categories) {
      const items = catalog.items.filter(item => item.category === category.id);
      const reviewed = items.filter(item => state.answers[item.id]).length;
      groups.get(category.id).querySelector(".dv-group-progress").textContent = `${reviewed} / ${items.length} reviewed`;
    }
  }

  function applyFilters(previousCard) {
    const focusedCard = previousCard || document.activeElement?.closest(".dv-control");
    const search = filters.search.trim().toLowerCase();
    let visible = 0;
    for (const category of catalog.categories) {
      let groupVisible = 0;
      for (const item of catalog.items.filter(control => control.category === category.id)) {
        const answer = state.answers[item.id] || "Unanswered";
        const matches = (filters.category === "all" || filters.category === item.category)
          && (filters.priority === "all" || filters.priority === item.priority)
          && (filters.answer === "all" || filters.answer === answer)
          && (!search || [item.id, item.title, item.guidance, item.evidence, item.applicability, item.basis, category.title].join(" ").toLowerCase().includes(search));
        cards.get(item.id).hidden = !matches;
        if (matches) groupVisible++;
      }
      groups.get(category.id).hidden = !groupVisible;
      visible += groupVisible;
    }
    mountPoint.querySelector(".dv-filter-result").textContent = `Showing ${visible} of ${catalog.items.length} controls. Progress and downloads always include all controls.`;
    mountPoint.querySelector(".dv-empty").hidden = visible !== 0;
    if (focusedCard?.hidden) {
      const ordered = [...cards.values()];
      const index = ordered.indexOf(focusedCard);
      const next = ordered.slice(index + 1).find(card => !card.hidden) || ordered.find(card => !card.hidden);
      if (next) next.querySelector("input[type=radio]").focus();
      else mountPoint.querySelector("[data-filter=answer]").focus();
    }
  }

  async function exportAssessment(format, node) {
    if (exporting) return;
    exporting = true;
    node.disabled = true;
    node.setAttribute("aria-busy", "true");
    const message = mountPoint.querySelector(".dv-export-status");
    message.textContent = `Preparing ${format === "pdf" ? "PDF" : "Markdown"}…`;
    // Freeze the assessment at the click, even if users keep editing during font loading.
    const snapshot = JSON.parse(JSON.stringify(state));
    try {
      const options = { includeFileEvidence: snapshot.includeFileEvidence };
      if (format === "pdf") await window.CRADetailedReport.downloadPdf(snapshot, catalog, options);
      else window.CRADetailedReport.downloadMarkdown(snapshot, catalog, options);
      message.textContent = `${format === "pdf" ? "PDF" : "Markdown"} download started. All controls are included.`;
    } catch (error) {
      message.textContent = error.message || "The download could not be created. Please retry.";
    } finally {
      exporting = false;
      node.disabled = false;
      node.removeAttribute("aria-busy");
    }
  }

  function createReset() {
    const dialog = el("dialog", "dv-reset-dialog");
    const title = el("h2", "", "Start a new detailed assessment?");
    title.id = "dv-reset-title";
    dialog.setAttribute("aria-labelledby", title.id);
    dialog.append(title, el("p", "", "This clears only the detailed assessment’s project details, answers and notes. Download a copy first if you need it."));
    const actions = el("div", "dv-dialog-actions");
    const cancel = button("Keep assessment", "button secondary", () => dialog.close());
    cancel.autofocus = true;
    actions.append(cancel, button("Clear detailed assessment", "button primary", () => {
      state = empty();
      migrationNotice = "";
      assistanceNotice = "";
      filters = { search: "", category: "all", priority: "all", answer: "all" };
      save(); dialog.close(); render();
      mountPoint.querySelector("h2").focus();
    }));
    dialog.append(actions);
    mountPoint.append(dialog);
    return button("Start a new detailed assessment", "dv-reset", () => dialog.showModal());
  }

  function render() {
    mountPoint.replaceChildren();
    cards = new Map(); groups = new Map();
    const sidebar = el("aside", "dv-sidebar");
    sidebar.setAttribute("aria-label", "Detailed assessment summary");
    const progress = el("section", "dv-summary");
    progress.append(el("div", "dv-overline", "DEVELOPER ASSESSMENT"));
    const total = el("div", "dv-progress-total");
    const reviewed = el("strong"); reviewed.dataset.count = "reviewed";
    total.append(reviewed, el("span", "", ` / ${catalog.items.length}`));
    const bar = el("progress"); bar.setAttribute("aria-label", "Developer controls reviewed");
    progress.append(total, el("p", "", "controls reviewed"), bar);
    const counts = el("dl", "dv-counts");
    for (const [key, label] of [["yes", "Yes"], ["no", "No"], ["na", "Not applicable"], ["unanswered", "Unanswered"]]) {
      const row = el("div", `dv-count-${key}`);
      const number = el("dd"); number.dataset.count = key;
      row.append(el("dt", "", label), number); counts.append(row);
    }
    const unresolved = el("div", "dv-unresolved");
    unresolved.append(el("strong", "", "Needs review or remediation"));
    for (const [key, label] of [["critical", "Critical"], ["high", "High"]]) {
      const row = el("p"); const count = el("b"); count.dataset.count = key;
      row.append(document.createTextNode(`${label}: `), count); unresolved.append(row);
    }
    unresolved.append(el("small", "", "Includes No and unanswered controls. N/A is excluded."));
    progress.append(counts, unresolved, el("p", "dv-summary-foot", "Review progress, not a compliance score."));
    const exports = el("section", "dv-exports");
    exports.append(el("h3", "", "Keep your assessment"), el("p", "", "Download every control, answer, priority, reference and note."));
    const evidenceOption = el("label", "dv-checkbox dv-export-evidence");
    const includeEvidence = el("input"); includeEvidence.type = "checkbox"; includeEvidence.checked = state.includeFileEvidence;
    includeEvidence.addEventListener("change", () => { state.includeFileEvidence = includeEvidence.checked; save(); });
    evidenceOption.append(includeEvidence, document.createTextNode("Include file evidence in PDF and Markdown"));
    exports.append(evidenceOption);
    exports.append(el("small", "", "Review notes are always included. This option controls the separate file evidence field."));
    for (const [format, title] of [["pdf", "Download PDF"], ["md", "Download Markdown"]]) {
      const node = button(title, `button ${format === "pdf" ? "primary" : "secondary"}`, () => exportAssessment(format, node));
      exports.append(node);
    }
    const message = el("p", "dv-export-status"); message.setAttribute("role", "status");
    exports.append(message, el("small", "", "Your answers stay in this browser."));
    sidebar.append(progress, exports);
    const main = el("div", "dv-main");
    const intro = el("section", "dv-intro");
    const headingRow = el("div", "dv-heading-row");
    const heading = el("h2", "", "Detailed developer verification"); heading.tabIndex = -1;
    const saved = el("span", "dv-save-state"); saved.setAttribute("role", "status");
    headingRow.append(heading, saved);
    const meta = el("div", "dv-metadata");
    meta.append(field("Product / project (optional)", "product", "e.g. Acme Platform"), field("Reviewer (optional)", "reviewer", "Your name or team"));
    intro.append(headingRow, el("p", "", `${catalog.answerGuidance} Evidence and notes are optional.`), meta);
    if (migrationNotice) {
      const notice = el("p", "dv-migration-notice", migrationNotice);
      notice.setAttribute("role", "status");
      intro.append(notice);
    }
    const guide = el("details", "dv-priority-guide");
    guide.append(el("summary", "", "About importance and applicability"), el("p", "", "Critical: failures can directly enable compromise, privileged access or untrusted releases. High: substantial protection against likely threats. Medium: supporting assurance, documentation or operations."), el("p", "", "Priorities are engineering guidance, separate from CRA product classifications and legal applicability. A Medium priority does not make an applicable obligation optional. Conditional web, desktop, mobile, firmware and backend controls remain visible; assess applicability using the product risk assessment."), el("p", "", "This review expands CRA security outcomes into practical checks. The general tab covers wider manufacturer readiness. Completing either assessment is not certification or a legal determination."));
    intro.append(guide);
    const toolbar = el("section", "dv-toolbar"); toolbar.setAttribute("aria-label", "Filter developer controls");
    const searchLabel = el("label", "dv-field dv-search", "Search controls");
    const search = el("input"); search.type = "search"; search.value = filters.search; search.placeholder = "Try debug builds, tokens, SBOM…";
    search.addEventListener("input", () => { filters.search = search.value; applyFilters(); }); searchLabel.append(search);
    toolbar.append(searchLabel,
      selectFilter("Category", "category", [["all", "All categories"], ...catalog.categories.map(category => [category.id, category.title])]),
      selectFilter("Importance", "priority", [["all", "All priorities"], ...["Critical", "High", "Medium"].map(value => [value, value])]),
      selectFilter("Answer", "answer", [["all", "All answers"], ...[...choices, "Unanswered"].map(value => [value, value])]),
      button("Clear filters", "dv-clear-filters", () => { filters = { search: "", category: "all", priority: "all", answer: "all" }; search.value = ""; for (const node of toolbar.querySelectorAll("select")) node.value = "all"; applyFilters(); }));
    const result = el("p", "dv-filter-result"); result.setAttribute("role", "status");
    main.append(intro, createAgentAssistance(), toolbar, result);
    for (const category of catalog.categories) {
      const group = el("section", "dv-group");
      const groupHeading = el("div", "dv-group-heading");
      const title = el("h3", "", category.title); title.id = `category-${category.id}`;
      group.setAttribute("aria-labelledby", title.id);
      groupHeading.append(title, el("span", "dv-group-progress"));
      group.append(groupHeading);
      for (const item of catalog.items.filter(item => item.category === category.id)) group.append(createCard(item));
      groups.set(category.id, group); main.append(group);
    }
    main.append(el("p", "dv-empty", "No controls match your filters. Clear the filters to see all controls."));
    mountPoint.append(sidebar, main);
    sidebar.append(createReset());
    updateSaveStatus(); updateSummary(); applyFilters();
  }

  function mount() {
    const general = document.querySelector("#root .workspace");
    if (!general || document.getElementById("cra-verification-tabs")) return;
    general.id = "general-verification-panel";
    general.setAttribute("role", "tabpanel");
    general.setAttribute("aria-labelledby", "general-verification-tab");
    general.tabIndex = 0;
    createTabs(general);
    mountPoint = el("section", "dv-workspace");
    mountPoint.id = "detailed-verification-panel";
    mountPoint.setAttribute("role", "tabpanel");
    mountPoint.setAttribute("aria-labelledby", "detailed-verification-tab");
    mountPoint.tabIndex = 0;
    general.after(mountPoint);
    const lead = document.querySelector(".intro .lead");
    if (lead) lead.textContent = "Start with ten CRA readiness requirements, then explore detailed developer controls. Review your evidence, find the gaps, and take your next step.";
    render(); selectTab(activeTab);
    // Verify persistence is actually available before claiming the initial state is saved.
    save();
  }
  // React replaces the prerendered HTML once; remount only when a new workspace appears.
  new MutationObserver(mount).observe(document.getElementById("root"), { childList: true, subtree: true });
  mount();
})();
