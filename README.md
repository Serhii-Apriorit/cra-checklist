# Apriorit CRA Readiness

## Deployment

Extract `cra-readiness-site.zip` into a static hosting directory. `index.html`,
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

Answers, notes and project/reviewer fields are saved in browser local storage.
They are not uploaded or shared between users or devices. Changing the origin,
browser profile, or file location may make an earlier assessment unavailable.
Private browsing, browser policy and clearing site data can affect persistence.
Existing assessment data is not embedded in this archive.

PDF generation, the optional reference appendix and Markdown export run in the
browser. PDF fonts include Cyrillic support. Keep all bundled files and license
notices when distributing the site. This is a readiness self-assessment, not a
conformity assessment, certification or legal determination.

## Source Rebuild

In the development workspace, sources are retained under
`cra-readiness-assets/vendor/`; `app-entry.js` exports their local interfaces.
The deployment archive contains only runtime files, not these source files.

From the workspace root:

```sh
node cra-readiness-assets/build.mjs
node cra-readiness-assets/build.mjs --package
```

These commands require Node.js and npm; packaging also requires `zip`.
The build uses esbuild 0.25.12 through `npx`, which may need Internet access
on the build machine. Rebuilding does not fetch application code from AppDeploy.
The locally retained sources are compiled into one browser script. PDF font data
is generated from the local Noto Sans TTF files.

The upstream html2canvas source produces a duplicate-case warning during build;
this source was retained unchanged. The application's export workflows were
tested with remote requests blocked.

## Third-Party Materials

The locally bundled application includes React, React DOM, Lucide, jsPDF and
their helper dependencies, including html2canvas, DOMPurify and canvg. Existing
library notices are retained in the bundled script and supplied license files.
Montserrat and Noto Sans license texts are in `cra-readiness-assets/fonts/`.
The Apriorit logo is the supplied company's official website asset.