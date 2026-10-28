# Apriorit CRA Readiness

## Deployment

### GitHub Pages

The repository includes a manually triggered deployment workflow at
`.github/workflows/pages.yml`. It publishes the checked-in static files without
installing dependencies or rebuilding the application. Pushes and pull requests
do not deploy the site.

1. Commit and push these files to the repository's default branch.
2. In **Settings → Pages → Build and deployment**, set **Source** to
   **GitHub Actions**.
3. When ready to publish, open **Actions → Deploy to GitHub Pages → Run
   workflow**, select the default branch, and run it. This publishes the site.
4. Open the URL shown in the successful deployment or in **Settings → Pages**.
   Without a custom domain, this repository's URL is
   `https://serhii-apriorit.github.io/cra-checklist/`.

Run the workflow again explicitly whenever you want to publish updated files.
It uses the built-in `GITHUB_TOKEN`; no personal access token is required.
Only `index.html`, `cra-readiness-apriorit.js` and `cra-readiness-assets/` are
included in the published artifact. Relative asset URLs support the repository
subdirectory without a base-path setting or routing fallback.

For a private repository, its owner needs GitHub Pro, Team or Enterprise.
The published site is normally public even when its source repository is private;
private Pages sites require an organization using GitHub Enterprise Cloud.
See [GitHub Pages setup](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
and [plan availability](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

### Other static hosts

Copy the runtime files into a static hosting directory. `index.html`,
`cra-readiness-apriorit.js` and `cra-readiness-assets/` must remain together.
The site can be served from the domain root or a subdirectory. No Node.js,
database, API server, credentials or build step are needed on the host.

Serve JavaScript, CSS, SVG and TTF files with their standard content types.
HTTPS is recommended. A normal static host such as Nginx, Apache or a static
hosting service is sufficient. The site also supports opening `index.html`
directly from disk, subject to the browser allowing local storage.

All runtime scripts, styles, fonts and the logo are included locally.
Official regulatory links remain external and need a connection when opened.
There is no service worker or automatic offline caching of a hosted site.

## Data And Features

The **General verification** tab retains the ten readiness requirements and its
existing answer choices. **Detailed verification** adds a grouped developer
security assessment with Yes / No / Not applicable answers, evidence notes
(collapsed by default), engineering priorities, applicability guidance and
source references. It covers
software, firmware and qualifying product backends; conditional controls remain
visible so reviewers can assess applicability. N/A reasons are optional.
Choose Yes only after all applicable checks for an item are verified, No if any
applicable check fails or a required control is missing, and Not applicable only
if the entire item is outside the product context. Leave unreviewed items
unanswered. Related controls distinguish mechanisms, trust boundaries and
lifecycle stages; shared evidence can support more than one item.

The detailed catalog contains 94 controls after consolidating repeated risk
reviews, requirements matrices, authorization checks, platform/debug reviews,
identity/storage protection and alert-response checks. Each combined control
retains the applicable scenarios from its former items. Catalog revision 2
migrates existing assessments: any previous No keeps the combined answer No;
Yes requires every constituent answer to be Yes or N/A, with at least one Yes;
all N/A stays N/A; incomplete combinations become unanswered. Previous answers
and notes are retained together in the combined control's notes. Expanded note
limits prevent consolidation from truncating existing evidence.

Catalog revision 3 strengthens six existing controls: automated and complete
release SBOMs, required CI scans, enforced security gates and exceptions,
authenticated artifact provenance, measured vulnerability-response targets and
release-linked handoff evidence. These are engineering verification details;
project policy remains distinct from legal requirements and reporting clocks.
Earlier Yes answers for these expanded controls become unanswered for review,
with the previous response and all evidence retained in notes. Other answers
and control IDs are preserved; the revision 3 checklist contains 96 controls.

Catalog revision 4 rewords several questions in plainer language, merges
component isolation into runtime least privilege and session fixation into
token resistance, and requires MFA for privileged access. Merged answers follow
the revision 2 rules, and an earlier Yes for privileged access becomes
unanswered for review with notes retained. The checklist contains 94 controls.

Catalog revision 5 clarifies approval and testing of alternatives where privileged
MFA is technically impossible, removes repeated key-lifecycle verification from
least privilege, and clarifies resource-access and logging opt-out wording.
Longer verification instructions use bullet lists inside the existing collapsed
“How to verify / evidence” section. An earlier Yes for privileged access becomes
unanswered for review; the previous answer and notes are preserved.

Detailed verification includes **Review with your project agent**. Copy a prompt
for unanswered controls (or all controls) to an agent with project access, then
paste its JSON response, preview it and apply the results. The prompt includes
the current questions, verification guidance, applicability and response schema.
Unknown results stay unanswered. Existing answers are kept unless replacement is
selected; notes and file evidence are merged without duplicating repeat imports.
Invalid, duplicate or retired control IDs, mismatched revisions and malformed
file references reject the whole import before any changes are applied.

File evidence has its own field on each control, separate from review notes. Each
reference contains a repository-relative `path`, positive `line` number and
optional `description`. Paths cannot be absolute, URLs or parent traversals. File
evidence and the export preference are saved locally with the assessment. The
**Include file evidence in PDF and Markdown** checkbox is off by default; both
report formats omit the separate references until explicitly selected. Review
notes remain included. Existing notes are not automatically rewritten or parsed
for file references.

Agent responses use format `cra-detailed-agent-review`, version `1`, the current
`catalogRevision` and a `results` array. Each result requires `id`, `answer`
(`Yes`, `No`, `Not applicable` or `null`), `notes` and `fileEvidence`. A sparse
array is accepted; omitted controls are preserved and null never clears an
existing answer. An optional `project` label is shown in the preview and does not
overwrite the human-entered project/reviewer fields. This feature uses no agent
API, project connection or server-side upload: users choose where to copy the
prompt and which reviewed results to bring back.

Each tab has independent project/reviewer fields, answers, notes, progress,
reset and PDF/Markdown downloads. General data retains its original
`cra-readiness-assessment-v1` storage key; detailed data uses
`cra-detailed-assessment-v1` and stable control IDs. Filters affect only the view;
reports always contain every control. Progress is the number reviewed, including
N/A, and is not a compliance score. Unresolved priority counts include No and
unanswered items, excluding N/A.

**Grouped verification**, the third tab, is an independent experiment with 18
broader, evidence-led questions. It maps each of the 94 detailed controls to
exactly one evidence bundle without changing the first two assessments. Each
question suggests evidence to review once; expand **Coverage and individual
exceptions** for the full original wording, priority, applicability and sources.

Choose Yes only after verifying every applicable check, No for a confirmed gap,
and N/A only when the entire group is outside scope. Yes and N/A supply inherited
answers to controls; individual exceptions, including explicit unknowns, always
take precedence. A group No records a gap without inventing individual failures.
Any known gap keeps the group No; otherwise an unknown keeps it unverified;
mixed Yes/N/A is Yes and all N/A is N/A. Clearing a group decision preserves
individual findings and notes. Progress shows both grouped question outcomes
and underlying control answer counts. Grouping reduces repeated evidence review
and answer entry, not the scope of verification.

The experiment saves under `cra-grouped-assessment-v1` and does not copy from or
write to either existing assessment. Shared evidence notes apply to the whole
bundle, with individual notes and file references available. Its project-agent
prompt includes bundle guidance and original controls, using the same strict
JSON validation and preview-before-apply workflow. Inherited answers are kept
unless replacement is selected. Unknown agent findings never erase answers.
Code inspection alone cannot establish deployed behavior or operational evidence.

Experimental PDF/Markdown exports retain all 18 group outcomes, 94 original
controls, shared/individual notes and each answer's origin, even when filtered.
Separate file references remain opt-in. Reset affects only the experiment. If
the catalog or grouping revision changes, group decisions and individual passes
require review again; notes and file evidence are retained.

Answers, notes and project/reviewer fields are saved in browser local storage.
They are not uploaded or shared between users or devices. Changing the origin,
browser profile, or file location may make an earlier assessment unavailable.
Private browsing, browser policy and clearing site data can affect persistence.
Existing assessment data is not embedded in this archive.

PDF generation, the optional reference appendix and Markdown export run in the
browser. PDF fonts include Cyrillic support. Keep all bundled files and license
notices when distributing the site. This is a readiness self-assessment, not a
conformity assessment, certification or legal determination.

## Local Preview And Source Rebuild

To preview the checked-in site, serve the repository with any static HTTP server,
for example `python3 -m http.server 8000`, then open `http://localhost:8000/`.

This repository contains the prebuilt runtime bundle and PDF font data. The
original development sources, `vendor/`, `app-entry.js` and `build.mjs` are not
included, so there is no source rebuild command to run here. Deployment uses
the existing bundle directly.

The new feature is maintained directly in readable scripts:
`cra-readiness-assets/detailed-catalog.js` holds the versioned control catalog and
CRA/engineering references;
`detailed-verification.js` owns the independent panel and state;
`detailed-report.js` owns its browser-local exports. The original bundle is
unchanged. `detailed-verification.css` supplies scoped styles and accessible
tab visibility. All new runtime assets are included by the existing packaging
workflow without a build step.

`grouped-catalog.js` defines the 18 experimental bundles and conservative answer
aggregation; `grouped-verification.js` owns the third panel, separate state,
agent review and exports; `grouped-verification.css` styles the experiment.
Shared tab navigation supports all three panels with arrow keys, Home and End.
The original general bundle and detailed catalog/report/agent helpers are unchanged.

The catalog provides focused English developer security controls. Repeated
artifacts (such as an SBOM) are referenced across distinct lifecycle activities
instead of requesting duplicate evidence. Critical, High
and Medium express engineering priority, not statutory product classifications
or permission to omit applicable obligations. CRA outcomes, supporting
engineering practices and contractual processes have separate basis labels.

Run `node tests/verification.cjs` with the `playwright` package and Chrome
available. If Playwright is installed outside the normal Node resolution path,
set `PLAYWRIGHT_MODULE` to its absolute package directory. Set
`PLAYWRIGHT_CHANNEL` to another installed Playwright browser channel if needed.
The suite serves an isolated local preview under `/cra-checklist/`, checks
catalog coverage, browser interactions, saving, storage failure,
independent resets and both tabs' downloads. It writes reports and desktop/mobile
screenshots to a temporary directory printed on completion. It does not deploy.
Run `node tests/agent-review.cjs` for dependency-free prompt, JSON validation,
atomic merge, relative-path and Markdown evidence-inclusion checks.
Run `node tests/grouped-verification.cjs` with the same Playwright setup for
one-to-one control coverage, conservative group/exception outcomes, three-tab
navigation, persistence, isolated reset, agent import protection, PDF/Markdown
exports, optional file evidence and desktop/mobile screenshots.

## Third-Party Materials

The locally bundled application includes React, React DOM, Lucide, jsPDF and
their helper dependencies, including html2canvas, DOMPurify and canvg. Existing
library notices are retained in the bundled script and supplied license files.
Montserrat and Noto Sans license texts are in `cra-readiness-assets/fonts/`.
The Apriorit logo is the supplied company's official website asset.
