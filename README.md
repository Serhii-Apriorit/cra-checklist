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

Each tab has independent project/reviewer fields, answers, notes, progress,
reset and PDF/Markdown downloads. General data retains its original
`cra-readiness-assessment-v1` storage key; detailed data uses
`cra-detailed-assessment-v1` and stable control IDs. Filters affect only the view;
reports always contain every control. Progress is the number reviewed, including
N/A, and is not a compliance score. Unresolved priority counts include No and
unanswered items, excluding N/A.

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

## Third-Party Materials

The locally bundled application includes React, React DOM, Lucide, jsPDF and
their helper dependencies, including html2canvas, DOMPurify and canvg. Existing
library notices are retained in the bundled script and supplied license files.
Montserrat and Noto Sans license texts are in `cra-readiness-assets/fonts/`.
The Apriorit logo is the supplied company's official website asset.
