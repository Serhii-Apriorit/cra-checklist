(() => {
  "use strict";

  const statuses = ["Have it", "Need to add", "Need to verify", "Partially", "Unanswered"];
  const statusColors = {
    "Have it": "#187657",
    "Need to add": "#b63828",
    "Need to verify": "#365ba5",
    "Partially": "#956200",
    "Unanswered": "#666666"
  };
  let fontsPromise;
  let exporting = false;
  let liveAssessment;

  async function loadFonts() {
    if (!fontsPromise) {
      fontsPromise = new Promise((resolve, reject) => {
        if (window.CRAReadinessFonts) {
          resolve([window.CRAReadinessFonts.Regular, window.CRAReadinessFonts.Bold]);
          return;
        }
        const script = document.createElement("script");
        script.src = new URL("./cra-readiness-assets/report-fonts.js", document.baseURI).href;
        script.onload = () => {
          if (window.CRAReadinessFonts?.Regular && window.CRAReadinessFonts?.Bold) {
            resolve([window.CRAReadinessFonts.Regular, window.CRAReadinessFonts.Bold]);
          } else {
            script.remove();
            reject(new Error("The local report fonts are incomplete. Check the site files."));
          }
        };
        script.onerror = () => {
          script.remove();
          reject(new Error("The local report fonts could not be loaded. Check the site files."));
        };
        document.head.append(script);
      }).catch(error => {
        fontsPromise = undefined;
        throw error;
      });
    }
    return fontsPromise;
  }

  function readAssessment() {
    const panel = document.getElementById("general-verification-panel") || document.querySelector(".workspace");
    let state = { product: "", reviewer: "", answers: {}, notes: {} };
    try {
      const saved = JSON.parse(localStorage.getItem("cra-readiness-assessment-v1") || "null");
      if (saved && typeof saved === "object") state = { ...state, ...saved };
    } catch {
      state.answers = {};
      state.notes = {};
    }
    // Storage may fail while React still holds a complete assessment in memory.
    // Keep inputs seen before filtering so exports do not depend on persistence.
    if (liveAssessment) state = { ...state, ...liveAssessment };
    state.answers = Object.fromEntries(Object.entries(state.answers || {}).filter(([key, value]) => /^\d+$/.test(key) && Number(key) < 10 && statuses.slice(0, 4).includes(value)));
    state.notes = Object.fromEntries(Object.entries(state.notes || {}).filter(([key, value]) => /^\d+$/.test(key) && Number(key) < 10 && typeof value === "string"));
    state.product = panel.querySelector('.metadata-fields input')?.value || "";
    state.reviewer = panel.querySelectorAll('.metadata-fields input')[1]?.value || "";
    for (const article of panel.querySelectorAll('.requirement')) {
      const index = Number(article.id.replace("requirement-", "")) - 1;
      const answer = article.querySelector('input:checked');
      if (answer) state.answers[index] = answer.value;
      state.notes[index] = article.querySelector('textarea')?.value || "";
    }
    liveAssessment = { ...state, answers: { ...state.answers }, notes: { ...state.notes } };
    return state;
  }

  for (const type of ["input", "change"]) {
    document.addEventListener(type, event => {
      if (event.target.closest("#general-verification-panel")) readAssessment();
    }, true);
  }
  document.addEventListener("click", event => {
    if (event.target.closest(".modal .button.danger") && document.getElementById("reset-title")) {
      liveAssessment = { product: "", reviewer: "", answers: {}, notes: {} };
    }
  }, true);

  async function createReport(state, includeAppendix) {
    const { requirements, regulation, originalExport } = window.CRAReadiness;
    const fonts = await loadFonts();
    const pdf = originalExport.createPdf({ product: "", reviewer: "", answers: {}, notes: {} });
    pdf.addPage();
    while (pdf.getNumberOfPages() > 1) pdf.deletePage(1);
    for (const [index, weight] of ["normal", "bold"].entries()) {
      const filename = `NotoSans-${weight}.ttf`;
      pdf.addFileToVFS(filename, fonts[index]);
      pdf.addFont(filename, "NotoSans", weight);
    }
    pdf.setProperties({
      title: `CRA readiness - ${state.product || "Assessment"}`,
      author: "Apriorit",
      subject: "Readiness self-assessment, not a conformity assessment or legal determination",
      creator: "Apriorit CRA Readiness"
    });

    const left = 18;
    const width = 174;
    const bottom = 274;
    let cursor = 29;
    const font = (size, bold, color) => {
      pdf.setFont("NotoSans", bold ? "bold" : "normal");
      pdf.setFontSize(size);
      pdf.setTextColor(color);
    };
    const nextPage = () => {
      pdf.addPage();
      cursor = 29;
    };
    const ensure = height => {
      if (cursor + height > bottom) nextPage();
    };
    const text = (value, { size = 11, bold = false, color = "#333333", gap = 3, link } = {}) => {
      font(size, bold, color);
      const lines = pdf.splitTextToSize(String(value || ""), width);
      const lineHeight = size * 0.35278 * 1.5;
      for (const line of lines) {
        ensure(lineHeight);
        font(size, bold, color);
        if (link) pdf.textWithLink(line, left, cursor, { url: link });
        else pdf.text(line, left, cursor);
        cursor += lineHeight;
      }
      cursor += gap;
    };
    const section = title => {
      ensure(24);
      cursor += 3;
      text(title, { size: 15, bold: true, color: "#222222", gap: 4 });
    };
    const label = title => text(title, { size: 9, bold: true, color: "#626262", gap: 1 });
    const status = index => statuses.includes(state.answers[index]) ? state.answers[index] : "Unanswered";
    const counts = Object.fromEntries(statuses.map(value => [value, requirements.filter((item, index) => status(index) === value).length]));

    text("CRA readiness assessment", { size: 24, bold: true, color: "#222222", gap: 5 });
    label("PRODUCT / PROJECT");
    text(state.product || "Not specified", { size: 13, bold: true });
    label("REVIEWER");
    text(state.reviewer || "Not specified");
    text(`Exported ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, { size: 9, color: "#626262" });
    text(`${requirements.length - counts.Unanswered} of ${requirements.length} reviewed | ${counts["Have it"]} marked Have it`, { size: 12, bold: true });
    text(statuses.map(value => `${value}: ${counts[value]}`).join("   |   "), { size: 9 });
    text("These are evidence-review statuses, not a compliance score or certification. A readiness self-assessment is not a conformity assessment or legal determination.", { size: 10, color: "#626262" });
    section("Assessment at a glance");
    for (const [index, item] of requirements.entries()) {
      font(9, false, "#333333");
      const lines = pdf.splitTextToSize(`${String(index + 1).padStart(2, "0")}  ${item.title}`, 128);
      const height = Math.max(11, lines.length * 4.8 + 4);
      ensure(height);
      pdf.setDrawColor("#dddddd");
      pdf.line(left, cursor - 4, left + width, cursor - 4);
      pdf.text(lines, left, cursor, { lineHeightFactor: 1.5 });
      font(9, true, statusColors[status(index)]);
      pdf.text(status(index), left + width, cursor, { align: "right" });
      cursor += height;
    }
    text("Main obligations: 11 December 2027. Article 14 reporting: since 11 September 2026. Confirm product scope and transitional rules before relying on this assessment.", { size: 9, color: "#626262" });

    nextPage();
    section("Detailed assessment");
    for (const [index, item] of requirements.entries()) {
      ensure(48);
      pdf.setDrawColor("#fc6113");
      pdf.line(left, cursor - 2, left + 12, cursor - 2);
      cursor += 5;
      text(`${String(index + 1).padStart(2, "0")}  ${item.title}`, { size: 14, bold: true, color: "#222222" });
      text(status(index), { size: 11, bold: true, color: statusColors[status(index)] });
      if (item.badge) text(item.badge, { size: 10, bold: true, color: "#956200" });
      text(item.text);
      ensure(18);
      label("EVIDENCE / NOTES");
      text(state.notes[index] || "No evidence or notes recorded.", { color: state.notes[index] ? "#222222" : "#777777", gap: 4 });
      if (item.clarification) {
        ensure(20);
        text(item.clarification.title, { size: 10, bold: true });
        text(item.clarification.text, { size: 10, color: "#555555" });
      }
      for (const [title, anchor] of item.references) {
        text(title, { size: 9, color: "#b33e05", link: `${regulation}#${anchor}`, gap: 1 });
      }
      cursor += 7;
    }

    if (includeAppendix) {
      nextPage();
      section("Appendix / Scope and evidence guide");
      const scope = document.querySelector(".scope-content");
      for (const paragraph of scope?.querySelectorAll(".scope-intro, .scope-explanations p, .scope-footnote") || []) {
        text(paragraph.textContent.trim());
      }
      for (const row of scope?.querySelectorAll("tbody tr") || []) {
        ensure(18);
        text(row.cells[0].textContent.trim(), { size: 10, bold: true, gap: 1 });
        text(row.cells[1].textContent.trim(), { size: 10 });
      }
      for (const anchor of scope?.querySelectorAll(".scope-sources a") || []) {
        text(anchor.textContent.trim(), { size: 9, color: "#b33e05", link: anchor.href });
      }
      section("Examples of evidence");
      text("These are examples of proof, not mandatory document formats.", { size: 10 });
      for (const [index, item] of requirements.entries()) {
        ensure(22);
        text(`${index + 1}. ${item.title}`, { size: 11, bold: true });
        text(item.evidence, { size: 10 });
        for (const [title, anchor] of item.references) {
          text(title, { size: 9, color: "#b33e05", link: `${regulation}#${anchor}`, gap: 1 });
        }
      }
      section("Important exceptions");
      for (const exception of document.querySelectorAll("#general-verification-panel .exception-grid section")) {
        ensure(28);
        text(exception.querySelector("h4").textContent, { size: 11, bold: true });
        text(exception.querySelector("p").textContent, { size: 10 });
        let annex;
        for (const reference of exception.querySelector("small").textContent.split(";")) {
          const title = reference.trim();
          const articleMatch = title.match(/^Article\s+(\d+)/i);
          const annexMatch = title.match(/^Annex\s+([IVX]+)/i);
          const recitalMatch = title.match(/^recital\s+(\d+)/i);
          if (annexMatch) annex = annexMatch[1];
          const anchor = articleMatch ? `art_${articleMatch[1]}`
            : annexMatch || /^Part\b/i.test(title) && annex ? `anx_${annex}`
            : recitalMatch ? `rct_${recitalMatch[1]}` : undefined;
          text(title, { size: 9, color: anchor ? "#b33e05" : "#626262", link: anchor ? `${regulation}#${anchor}` : undefined });
        }
      }
    }

    const pageCount = pdf.getNumberOfPages();
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
      pdf.setPage(pageNumber);
      font(16, true, "#222222");
      pdf.text("Apriorit", left, 15);
      font(8, false, "#626262");
      pdf.text("CYBER RESILIENCE ACT / READINESS", left + width, 15, { align: "right" });
      pdf.setDrawColor("#fc6113");
      pdf.setLineWidth(0.6);
      pdf.line(left, 20, left + width, 20);
      pdf.setLineWidth(0.2);
      pdf.setDrawColor("#dddddd");
      pdf.line(left, 282, left + width, 282);
      font(8, false, "#626262");
      pdf.text("Apriorit | Readiness self-assessment | Not a certification", left, 288);
      pdf.text(`${pageNumber} / ${pageCount}`, left + width, 288, { align: "right" });
    }
    return pdf;
  }

  document.addEventListener("click", async event => {
    const button = event.target.closest("#general-verification-panel .export-card button");
    if (!button || !button.textContent.includes("Download PDF")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (exporting) return;
    exporting = true;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    const message = document.querySelector(".apriorit-export-status");
    message.textContent = "Preparing PDF...";
    try {
      const state = readAssessment();
      const includeAppendix = document.getElementById("apriorit-pdf-appendix").checked;
      const pdf = await createReport(state, includeAppendix);
      const filename = (state.product || "assessment").replace(/[^\p{L}\p{N}_-]+/gu, "-").slice(0, 80);
      pdf.save(`Apriorit-CRA-${filename}.pdf`);
      message.textContent = "PDF download started.";
    } catch (error) {
      message.textContent = error.message || "PDF could not be created. Please retry.";
    } finally {
      exporting = false;
      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  }, true);

  function enhanceBranding() {
    const brand = document.querySelector(".brand");
    if (brand) brand.setAttribute("aria-label", "Apriorit CRA Readiness home");
    const footer = document.querySelector(".footer-brand");
    if (footer && !footer.dataset.apriorit) {
      footer.dataset.apriorit = "true";
      footer.append(document.createTextNode(" by Apriorit"));
    }
    const exportCard = document.querySelector(".export-card");
    if (exportCard && !exportCard.querySelector(".apriorit-pdf-options")) {
      const options = document.createElement("label");
      options.className = "apriorit-pdf-options";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = "apriorit-pdf-appendix";
      options.append(checkbox, document.createTextNode("Include reference appendix"));
      const message = document.createElement("p");
      message.className = "apriorit-export-status";
      message.setAttribute("role", "status");
      message.setAttribute("aria-live", "polite");
      exportCard.querySelector(".button.primary").before(options);
      exportCard.append(message);
    }
  }
  const observer = new MutationObserver(enhanceBranding);
  observer.observe(document.getElementById("root"), { childList: true, subtree: true });
  enhanceBranding();
})();
