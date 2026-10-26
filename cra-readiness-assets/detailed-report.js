(() => {
  "use strict";

  let fontsPromise;
  const STATUS = ["Yes", "No", "Not applicable"];
  const COLORS = { Yes: "#187657", No: "#b63828", "Not applicable": "#365ba5", Unanswered: "#666666" };

  const clean = value => String(value == null ? "" : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
  const statusFor = (state, id) => STATUS.includes(state?.answers?.[id]) ? state.answers[id] : "Unanswered";
  const itemsFor = catalog => Array.isArray(catalog?.items) ? catalog.items : [];
  const countSummary = (state, catalog) => {
    const items = itemsFor(catalog);
    const counts = { Yes: 0, No: 0, "Not applicable": 0, Unanswered: 0 };
    const unresolvedPriority = { Critical: 0, High: 0 };
    for (const item of items) {
      const status = statusFor(state, item.id);
      counts[status]++;
      if (status === "No" || status === "Unanswered") {
        if (/^critical$/i.test(item.priority || "")) unresolvedPriority.Critical++;
        if (/^high$/i.test(item.priority || "")) unresolvedPriority.High++;
      }
    }
    return { items, counts, reviewed: items.length - counts.Unanswered, total: items.length, unresolvedPriority };
  };

  // Escape user-provided text so Markdown cannot turn it into raw HTML or markup.
  const md = value => clean(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/([\\`*_{}\[\]()#+.!|])/g, "\\$1");
  const mdBlock = value => {
    const text = clean(value);
    return text ? text.split(/\r?\n/).map(line => `> ${md(line)}`).join("\n") : "> _No notes recorded._";
  };
  const mdLink = ref => {
    const label = md(ref?.label || "Reference");
    const url = clean(ref?.url || "").replace(/[\s()<>]/g, ch => encodeURIComponent(ch));
    return url ? `[${label}](${url})` : label;
  };

  function markdown(state = {}, catalog = {}) {
    const { items, counts, reviewed, total, unresolvedPriority } = countSummary(state, catalog);
    const categories = Array.isArray(catalog.categories) ? catalog.categories : [];
    const categoryTitle = Object.fromEntries(categories.map(category => [category.id, category.title]));
    const out = [
      `# CRA readiness detailed report`, "",
      `**Product / project:** ${md(state.product || "Not specified")}`,
      `**Reviewer:** ${md(state.reviewer || "Not specified")}`,
      `**Updated:** ${md(state.updated || "Not recorded")}`,
      `**Catalog version:** ${md(catalog.version || "Not specified")} (revision ${md(catalog.revision || 1)})`, "",
      "> Engineering readiness aid. Priority labels guide engineering work and are not legal classifications. This self-assessment is not a conformity assessment, legal determination, or certification.", "",
      ...(catalog.answerGuidance ? [md(catalog.answerGuidance), ""] : []),
      "## Summary", "",
      `- Reviewed: **${reviewed} / ${total}**`,
      `- Yes: **${counts.Yes}**`, `- No: **${counts.No}**`,
      `- Not applicable: **${counts["Not applicable"]}**`, `- Unanswered: **${counts.Unanswered}**`,
      `- Unresolved Critical (No or unanswered): **${unresolvedPriority.Critical}**`,
      `- Unresolved High (No or unanswered): **${unresolvedPriority.High}**`, ""
    ];
    for (const [index, item] of items.entries()) {
      const answer = statusFor(state, item.id);
      const category = categoryTitle[item.category] || item.category || "Uncategorized";
      const note = state.notes?.[item.id];
      out.push(`## ${index + 1}. ${md(item.title || "Untitled item")}`, "",
        `- **Control ID:** ${md(item.id || "Not specified")}`, `- **Category:** ${md(category)}`, `- **Priority:** ${md(item.priority || "Not specified")}`,
        `- **Answer:** ${md(answer)}`, "", `**Guidance**  \n${md(item.guidance || "Not provided")}`, "",
        `**Evidence**  \n${md(item.evidence || "Not provided")}`, "",
        `**Applicability**  \n${md(item.applicability || "Not specified")}`, "",
        `**Basis**  \n${md(item.basis || "Not specified")}`, "",
        "**Notes**", mdBlock(note), "", "**References**");
      if (Array.isArray(item.references) && item.references.length) {
        for (const ref of item.references) out.push(`- ${mdLink(ref)}`);
      } else out.push("- None listed");
      out.push("");
    }
    return out.join("\n");
  }

  function loadFonts() {
    if (!fontsPromise) {
      fontsPromise = new Promise((resolve, reject) => {
        if (window.CRAReadinessFonts?.Regular && window.CRAReadinessFonts?.Bold) {
          resolve([window.CRAReadinessFonts.Regular, window.CRAReadinessFonts.Bold]);
          return;
        }
        const script = document.createElement("script");
        script.src = new URL("./cra-readiness-assets/report-fonts.js", document.baseURI).href;
        script.onload = () => window.CRAReadinessFonts?.Regular && window.CRAReadinessFonts?.Bold
          ? resolve([window.CRAReadinessFonts.Regular, window.CRAReadinessFonts.Bold])
          : reject(new Error("The local report fonts are incomplete."));
        script.onerror = () => reject(new Error("The local report fonts could not be loaded."));
        document.head.append(script);
      }).catch(error => { fontsPromise = undefined; throw error; });
    }
    return fontsPromise;
  }

  async function createPdf(state = {}, catalog = {}) {
    const originalExport = window.CRAReadiness?.originalExport;
    if (!originalExport?.createPdf) throw new Error("The base CRA PDF exporter is unavailable.");
    const fontData = await loadFonts();
    const pdf = originalExport.createPdf({ product: "", reviewer: "", answers: {}, notes: {} });
    pdf.addPage();
    while (pdf.getNumberOfPages() > 1) pdf.deletePage(1);
    ["normal", "bold"].forEach((weight, index) => {
      const filename = `NotoSans-${weight}.ttf`;
      pdf.addFileToVFS(filename, fontData[index]);
      pdf.addFont(filename, "NotoSans", weight);
    });
    const summary = countSummary(state, catalog);
    const categories = Array.isArray(catalog.categories) ? catalog.categories : [];
    const categoryTitle = Object.fromEntries(categories.map(category => [category.id, category.title]));
    pdf.setProperties({ title: `CRA readiness detailed report - ${clean(state.product || "Assessment")}`, author: "Apriorit", subject: "Engineering readiness self-assessment, not legal advice or certification", creator: "Apriorit CRA Readiness" });

    const left = 18, width = 174, top = 28, bottom = 274;
    let cursor = top;
    const font = (size, bold = false, color = "#333333") => {
      pdf.setFont("NotoSans", bold ? "bold" : "normal"); pdf.setFontSize(size); pdf.setTextColor(color);
    };
    const nextPage = () => { pdf.addPage(); cursor = top; };
    const ensure = height => { if (cursor + height > bottom) nextPage(); };
    const wrap = (value, size, bold = false, maxWidth = width) => {
      const safe = clean(value).replace(/\t/g, "    ");
      const lines = [];
      font(size, bold);
      for (const paragraph of safe.split(/\r?\n/)) {
        let line = "";
        for (const word of paragraph.split(/\s+/)) {
          if (!word) continue;
          const candidate = line ? `${line} ${word}` : word;
          if (pdf.getTextWidth(candidate) <= maxWidth) { line = candidate; continue; }
          if (line) { lines.push(line); line = ""; }
          // Split very long words by measured character width, including Unicode text.
          let part = "";
          for (const char of Array.from(word)) {
            if (part && pdf.getTextWidth(part + char) > maxWidth) { lines.push(part); part = char; }
            else part += char;
          }
          line = part;
        }
        lines.push(line);
      }
      return lines.length ? lines : [""];
    };
    const text = (value, { size = 10, bold = false, color = "#333333", gap = 3, link } = {}) => {
      const lineHeight = size * 0.35278 * 1.5;
      for (const line of wrap(value, size, bold)) {
        ensure(lineHeight);
        font(size, bold, color);
        if (link) pdf.textWithLink(line, left, cursor, { url: link }); else pdf.text(line, left, cursor);
        cursor += lineHeight;
      }
      cursor += gap;
    };
    const label = value => text(value.toUpperCase(), { size: 8, bold: true, color: "#626262", gap: 1 });
    const section = value => { ensure(40); cursor += 3; text(value, { size: 15, bold: true, color: "#222222", gap: 4 }); };
    const list = (value, options = {}) => text(value, options);

    text("CRA readiness detailed report", { size: 23, bold: true, color: "#222222", gap: 6 });
    label("Product / project"); text(state.product || "Not specified", { size: 12, bold: true });
    label("Reviewer"); text(state.reviewer || "Not specified");
    label("Last updated"); text(state.updated || "Not recorded");
    text(`Catalog version: ${catalog.version || "Not specified"} (revision ${catalog.revision || 1})`, { size: 9, color: "#626262" });
    text("Engineering priority labels guide engineering work and are not legal classifications. This self-assessment is not a conformity assessment, legal determination, or certification.", { size: 9, color: "#626262", gap: 5 });
    if (catalog.answerGuidance) text(catalog.answerGuidance, { size: 9, color: "#626262", gap: 5 });
    section("Summary");
    text(`Reviewed: ${summary.reviewed} / ${summary.total}    Yes: ${summary.counts.Yes}    No: ${summary.counts.No}`, { size: 10, bold: true });
    text(`Not applicable: ${summary.counts["Not applicable"]}    Unanswered: ${summary.counts.Unanswered}`, { size: 10 });
    text(`Unresolved Critical (No or unanswered): ${summary.unresolvedPriority.Critical}`, { size: 10, bold: true });
    text(`Unresolved High (No or unanswered): ${summary.unresolvedPriority.High}`, { size: 10, bold: true });

    section("Detailed assessment");
    for (const [index, item] of summary.items.entries()) {
      ensure(40);
      pdf.setDrawColor("#fc6113"); pdf.line(left, cursor - 2, left + 12, cursor - 2); cursor += 4;
      text(`${index + 1}. ${item.title || "Untitled item"}`, { size: 13, bold: true, color: "#222222", gap: 2 });
      text(`Control ID: ${item.id || "Not specified"} | ${categoryTitle[item.category] || item.category || "Uncategorized"} | ${item.priority || "Priority not specified"} | ${statusFor(state, item.id)}`, { size: 9, bold: true, color: COLORS[statusFor(state, item.id)] });
      label("Guidance"); text(item.guidance || "Not provided");
      label("Evidence"); text(item.evidence || "Not provided");
      label("Applicability"); text(item.applicability || "Not specified");
      label("Basis"); text(item.basis || "Not specified");
      label("Notes"); text(state.notes?.[item.id] || "No notes recorded.", { color: state.notes?.[item.id] ? "#222222" : "#777777" });
      label("References");
      if (Array.isArray(item.references) && item.references.length) {
        for (const ref of item.references) text(ref.label || ref.url || "Reference", { size: 8, color: "#b33e05", gap: 1, link: ref.url || undefined });
      } else list("None listed", { size: 9, color: "#777777" });
      cursor += 5;
    }

    const pageCount = pdf.getNumberOfPages();
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
      pdf.setPage(pageNumber);
      font(15, true, "#222222"); pdf.text("Apriorit", left, 15);
      font(8, false, "#626262"); pdf.text("CYBER RESILIENCE ACT / DETAILED READINESS", left + width, 15, { align: "right" });
      pdf.setDrawColor("#fc6113"); pdf.setLineWidth(0.6); pdf.line(left, 20, left + width, 20);
      pdf.setLineWidth(0.2); pdf.setDrawColor("#dddddd"); pdf.line(left, 282, left + width, 282);
      font(8, false, "#626262"); pdf.text("Apriorit | Engineering self-assessment | Not a certification", left, 288);
      pdf.text(`${pageNumber} / ${pageCount}`, left + width, 288, { align: "right" });
    }
    return pdf;
  }

  function filenamePart(value) {
    return clean(value || "Assessment").normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 60) || "Assessment";
  }
  function downloadMarkdown(state, catalog) {
    const blob = new Blob([markdown(state, catalog)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `Apriorit-CRA-Detailed-${filenamePart(state?.product)}.md`;
    anchor.click(); URL.revokeObjectURL(url);
  }
  async function downloadPdf(state, catalog) {
    const pdf = await createPdf(state, catalog);
    pdf.save(`Apriorit-CRA-Detailed-${filenamePart(state?.product)}.pdf`);
    return pdf;
  }

  window.CRADetailedReport = { markdown, createPdf, downloadMarkdown, downloadPdf };
})();
