(() => {
  "use strict";

  // Priority is an engineering triage aid, not a CRA product class or legal severity.
  // CRA references identify the underlying outcome; detailed mechanisms labelled
  // Engineering practice are suggested verification controls, not statutory text.
  const regulation = "https://eur-lex.europa.eu/eli/reg/2024/2847/oj/eng";
  const references = {
    scope: { label: "CRA Article 2 — scope", url: `${regulation}#art_2` },
    important: { label: "CRA Article 7 — important products", url: `${regulation}#art_7` },
    critical: { label: "CRA Article 8 — critical products", url: `${regulation}#art_8` },
    conformity: { label: "CRA Article 32 — conformity assessment", url: `${regulation}#art_32` },
    risk: { label: "CRA Article 13(2)–(3) — cybersecurity risk assessment", url: `${regulation}#art_13` },
    manufacturer: { label: "CRA Article 13 — manufacturer obligations", url: `${regulation}#art_13` },
    reporting: { label: "CRA Article 14 — reporting obligations", url: `${regulation}#art_14` },
    asvs: { label: "OWASP ASVS 5.0.0 — engineering verification guidance", url: "https://github.com/OWASP/ASVS/tree/v5.0.0/5.0" },
    ssdf: { label: "NIST SP 800-218 SSDF 1.1 — engineering process guidance", url: "https://csrc.nist.gov/pubs/sp/800/218/final" },
    sessions: { label: "OWASP Session Management — expiration and browser-close limits", url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html" },
    logout: { label: "OWASP WSTG v4.2 — testing logout and credential replay", url: "https://wstg.owasp.org/v4.2/4-Web_Application_Security_Testing/06-Session_Management_Testing/06-Testing_for_Logout_Functionality/" }
  };
  for (const letter of "abcdefghijklm") {
    references[`I2${letter}`] = {
      label: `CRA Annex I, Part I, point 2(${letter})`,
      url: `${regulation}#anx_I`
    };
  }
  for (let point = 1; point <= 8; point += 1) {
    references[`II${point}`] = {
      label: `CRA Annex I, Part II, point ${point}`,
      url: `${regulation}#anx_I`
    };
  }
  references.I1 = { label: "CRA Annex I, Part I, point 1 — risk-based security", url: `${regulation}#anx_I` };

  const categories = [
    { id: "context-design", title: "Product context and secure design" },
    { id: "production-defaults", title: "Production builds and secure defaults" },
    { id: "authentication", title: "Authentication and accounts" },
    { id: "authorization", title: "Authorization and isolation" },
    { id: "sessions-tokens", title: "Sessions and tokens" },
    { id: "data-crypto", title: "Data, cryptography and secrets" },
    { id: "application-security", title: "Input and application security" },
    { id: "platform-devices", title: "Platform and device security" },
    { id: "resilience", title: "Availability and resilience" },
    { id: "logging", title: "Security events and logging" },
    { id: "supply-chain", title: "Dependencies, pipeline and release" },
    { id: "updates-handoff", title: "Updates, vulnerability handling and handoff" }
  ];

  const items = [];
  const add = (category, id, title, priority, guidance, evidence, applicability, basis, refs) => {
    items.push({ id, category, title, priority, guidance, evidence, applicability, basis,
      references: refs.map(key => ({ ...references[key] })) });
  };
  const CRA = "CRA requirement";
  const ENG = "Engineering practice";
  const CONTRACT = "Contractual process";
  let group = "context-design";

  add(group, "product-boundaries", "Are the intended purpose and product boundaries documented?", "High",
    "Identify shipped software, firmware, hardware, remote processing needed for product functions, users and supported environments. Review the boundary against actual release artifacts.",
    "Product description; architecture inventory; supported deployment matrix.",
    "Applies to every assessment; describe the assessed product and version even where CRA scope remains under review.", CRA, ["risk"]);
  add(group, "cra-scope-category", "Is the CRA scope and product-category decision recorded?", "High",
    "Record the applicability analysis, exclusions considered and whether core functionality falls in an important or critical product category. Have the responsible manufacturer review the proposed conformity route.",
    "Scope decision; category rationale; conformity-assessment owner.",
    "For products being evaluated for the EU market; this self-check does not determine statutory status or conformity.", CRA, ["scope", "important", "critical", "conformity"]);
  add(group, "risk-assessment-current", "Does a current cybersecurity risk assessment guide product decisions?", "High",
    "Review risks across development, production, delivery, use and support. Revisit the assessment when architecture, threats, dependencies or intended use changes.",
    "Versioned risk assessment; review dates; change-trigger records.",
    "Applies throughout the product lifecycle; scale depth to the product and its risks.", CRA, ["risk", "I1"]);
  add(group, "trust-boundaries-threats", "Are trust boundaries and credible abuse cases reviewed?", "High",
    "Trace entry points, data flows and trust changes. Exercise misuse scenarios involving remote attackers, compromised users, malicious inputs and relevant physical access.",
    "Data-flow diagram; threat model; abuse-case tests.",
    "Use proportionate threat modelling for each architecture; physical scenarios depend on deployment and exposure.", ENG, ["asvs", "ssdf", "risk"]);
  add(group, "security-requirements-acceptance", "Do security requirements have measurable acceptance criteria?", "High",
    "Translate risk treatments into specific requirements, owners and tests. Link unresolved requirements to tracked decisions before release.",
    "Security backlog; acceptance criteria; requirement-to-test links.",
    "Applies to new work and security-relevant changes, including contracted development.", ENG, ["ssdf", "I1"]);
  add(group, "data-purpose-inventory", "Is each collected or processed data field justified by product purpose?", "High",
    "Inspect forms, telemetry, storage, caches and third-party calls. Remove unnecessary fields and define retention appropriate to the intended purpose.",
    "Data inventory; purpose and retention table; telemetry capture.",
    "Includes personal and other data. Record a rationale if the product processes no user or operational data.", CRA, ["I2g"]);
  add(group, "annex-requirement-mapping", "Is each applicable Annex I requirement linked to evidence?", "High",
    "Map Part I and Part II outcomes to implementation, verification and responsible owners. Record a product-specific reason and reviewer for each not-applicable decision.",
    "Annex I applicability matrix; evidence links; reviewed exceptions.",
    "Use for CRA readiness; engineering checklist answers alone do not establish legal conformity.", CONTRACT, ["manufacturer", "I1"]);
  add(group, "security-design-decisions", "Are security design decisions and residual risks reviewed?", "Medium",
    "Review consequential choices such as trust placement, cryptography and privileged access. Keep rationale, compensating controls and an owner for residual risks.",
    "Design review notes; decision records; residual-risk register.",
    "Applies to material security choices; do not use risk acceptance to waive an applicable statutory obligation.", ENG, ["ssdf", "risk"]);

  group = "production-defaults";
  add(group, "production-debug-disabled", "Are unsafe debug and diagnostic modes disabled in production?", "Critical",
    "Inspect the actual production package and runtime for debug servers, interactive consoles, verbose error pages and insecure diagnostic switches. Test attempts to enable them remotely. Debug symbols alone are not an unsafe debug mode.",
    "Release configuration; port scan; diagnostic endpoint tests.",
    "Applies to production software and devices; justify any supported diagnostic capability with access controls and an operational need.", ENG, ["I2b", "I2j", "asvs"]);
  add(group, "production-demo-accounts-removed", "Are test and demo accounts excluded from production releases?", "Critical",
    "Remove test and demonstration identities from production seed data, installers, images and hosted provisioning. Inspect the resulting account inventory and attempt known development and demonstration logins against a clean production installation.",
    "Account inventory; seed-data review; clean-install login results.",
    "Applies where accounts exist; mark not applicable with an explanation for account-free products.", ENG, ["I2b", "I2d", "asvs"]);
  add(group, "developer-bypass-absent", "Are developer authentication bypasses and hidden backdoors excluded from production?", "Critical",
    "Review feature flags, special headers, magic passwords, maintenance URLs and alternate entry points. Verify that build-time and runtime switches cannot bypass normal authorization in the shipped artifact.",
    "Code review; release-artifact inspection; bypass regression results.",
    "Applies to production releases; legitimate maintenance access must use documented, controlled authorization.", ENG, ["I2d", "ssdf", "asvs"]);
  add(group, "default-services-minimized", "Are only necessary features and interfaces enabled by default?", "High",
    "Compare a clean installation with the approved service and interface list. Check network listeners, APIs, local services, plugins and optional integrations.",
    "Default feature matrix; service inventory; network scan.",
    "Applies to exposed network and local interfaces; explain any interface-specific not-applicable decision.", CRA, ["I2b", "I2j"]);
  add(group, "secure-first-run", "Does first-run setup establish a secure configuration?", "High",
    "Install without custom hardening and check onboarding, permissions and public exposure. Ensure required security setup completes before sensitive functions become available.",
    "First-run walkthrough; installer test; default configuration snapshot.",
    "Applies to first-run or provisioning flows. Document any permitted tailor-made business-user configuration agreement.", CRA, ["I2b"]);
  add(group, "configuration-change-controls", "Are security-sensitive configuration changes restricted and validated?", "High",
    "Attempt changes to authentication, network exposure and trust settings through each supported channel. Confirm authorization, validation and traceability.",
    "Configuration permission tests; change audit; invalid-setting tests.",
    "Applies where security settings can be changed; immutable products should evidence that property.", ENG, ["I2f", "asvs"]);
  add(group, "reset-secure-defaults", "Can users reset the product to its original secure state?", "High",
    "Exercise the documented reset from a modified installation and verify restored security defaults. Identify any retained data and explain how permanent erasure is performed separately.",
    "Reset procedure; before-and-after settings; recovery test.",
    "Apply the risk assessment to reset mechanisms; distinguish configuration reset from permanent data removal.", CRA, ["I2b"]);
  add(group, "production-environment-separation", "Are production resources and credentials separated from development and testing?", "High",
    "Check environment-specific identities, keys, databases and service endpoints. Try using a development identity to reach production resources.",
    "Environment access matrix; credential scopes; cross-environment denial tests.",
    "Applies where multiple environments exist; include supplier-operated build and test environments.", ENG, ["ssdf"]);
  add(group, "production-error-disclosure", "Do production errors reveal only information appropriate to the caller?", "Medium",
    "Trigger failures and inspect browser responses, API bodies and device output for stack traces, paths, queries and secrets. Retain useful restricted diagnostics for operators.",
    "Failure-response samples; error-handler configuration; disclosure tests.",
    "Applies to user-visible errors and externally reachable services; local privileged diagnostics need a separate access review.", ENG, ["asvs", "I2e"]);

  group = "authentication";
  add(group, "default-credentials-safe", "Are factory and initial credentials resistant to unauthorized use?", "Critical",
    "Inspect provisioning for shared default or hardcoded passwords. Verify unique credentials or secure first-use enrollment and that deployed secrets can be changed or revoked.",
    "Provisioning design; image secret scan; initial-credential tests.",
    "Applies to password, key and device-identity provisioning; account-free products may mark this not applicable with evidence.", ENG, ["I2b", "I2d", "asvs"]);
  add(group, "authentication-all-entrypoints", "Do protected entry points authenticate the caller consistently?", "High",
    "Test APIs, administrative tools, device protocols and alternate routes without credentials and with invalid credentials. Confirm the same protection applies beyond the main user interface.",
    "Endpoint inventory; unauthenticated request results; protocol tests.",
    "Applies to functions requiring identity; document deliberately public functionality.", ENG, ["I2d", "asvs"]);
  add(group, "password-storage-protection", "Are passwords stored using suitable salted password hashing?", "High",
    "Review the configured password-hashing algorithm and work factor. Inspect a test account record and verify migration away from weak or reversible storage.",
    "Hashing configuration; sanitized database sample; migration plan.",
    "Applies when the product stores passwords; federated-only or passwordless systems can record not applicable.", ENG, ["asvs", "I2e"]);
  add(group, "privileged-mfa", "Does privileged access use authentication strength appropriate to its risk?", "High",
    "Review administrative, support and release identities. Test MFA or equivalent strong authentication, enrollment and recovery, with particular attention to remote privileged access.",
    "Privileged-access policy; MFA enforcement test; recovery review.",
    "Choose controls from the risk assessment; MFA is an engineering measure, not a universal named CRA implementation mandate.", ENG, ["asvs", "I2d"]);
  add(group, "credential-attack-controls", "Are credential guessing and automated login abuse mitigated?", "High",
    "Test rate limits, backoff, monitoring and account-enumeration responses. Check that protective mechanisms do not create an easy account-lockout denial of service.",
    "Login abuse tests; throttling configuration; alert examples.",
    "Applies to exposed authentication flows; assess local/offline authentication separately.", ENG, ["asvs", "I2d"]);
  add(group, "account-recovery-proof", "Does account recovery verify control before changing credentials?", "High",
    "Exercise reset and recovery links with expired, reused and altered tokens. Check that changing recovery channels requires appropriate verification and that completion reaches the session-revocation path.",
    "Recovery flow tests; token validation tests; recovery notification sample.",
    "Applies when account recovery is offered; document external identity-provider responsibilities.", ENG, ["asvs", "I2d"]);
  add(group, "service-identities-scoped", "Are machine and service identities individually managed and narrowly scoped?", "High",
    "Inventory API keys, workload identities and device certificates. Check ownership, restricted privileges and a tested rotation or revocation procedure.",
    "Service identity register; scope policy; rotation drill.",
    "Applies to machine-to-machine access; distinct from human password and session controls.", ENG, ["asvs", "ssdf", "I2d"]);
  add(group, "federation-validation", "Are federated authentication responses validated against the intended trust configuration?", "High",
    "Test issuer, audience, signature, redirect URI, state and nonce or equivalent protocol bindings. Attempt cross-client and cross-tenant response substitution.",
    "Identity-provider configuration; federation negative tests; trust metadata.",
    "Applies to OAuth/OIDC, SAML or comparable federation; mark not applicable for products without federation.", ENG, ["asvs"]);

  group = "authorization";
  add(group, "server-side-authorization", "Is authorization enforced at the trusted execution boundary?", "Critical",
    "Call protected operations directly while bypassing UI restrictions. Verify server or trusted-device checks on every relevant operation and default denial for unrecognized permissions.",
    "Authorization tests; policy configuration; API denial responses.",
    "Applies to protected operations; browser-side hiding alone is insufficient.", ENG, ["asvs", "I2d"]);
  add(group, "object-level-access", "Are object and record permissions checked for each request?", "High",
    "Swap identifiers across users for reads, writes, downloads and deletion, including nested and batch endpoints. Confirm denied access does not disclose object contents.",
    "Cross-user object-access tests; authorization matrix.",
    "Applies to products with user-owned or access-controlled resources.", ENG, ["asvs", "I2d"]);
  add(group, "role-function-controls", "Are privileged functions restricted to approved roles?", "High",
    "Test a low-privilege identity against administrative endpoints and sensitive workflow transitions. Include indirect invocation through APIs and scheduled jobs.",
    "Role-to-function matrix; privilege-escalation test results.",
    "Applies where roles or privilege levels exist.", ENG, ["asvs", "I2d"]);
  add(group, "tenant-boundary-isolation", "Are tenant boundaries enforced across data and background processing?", "High",
    "Test tenant substitution in queries, caches, files, queues and background jobs. Verify tenant context comes from trusted identity or policy rather than caller-controlled fields alone.",
    "Cross-tenant test suite; tenancy design; queue and cache key review.",
    "Applies to multi-tenant products; single-tenant products should record their deployment boundary.", ENG, ["asvs", "I2d", "I2k"]);
  add(group, "least-privilege-runtime", "Do runtime processes use only the privileges they need?", "High",
    "Inspect process users, operating-system capabilities and cloud permissions. Attempt representative operations beyond each component's assigned purpose.",
    "Runtime identity policy; capability listing; permission review.",
    "Applies to operating-system, cloud and device execution privileges.", ENG, ["ssdf", "I2k"]);
  add(group, "support-access-controlled", "Is maintenance and support access explicitly authorized and traceable?", "High",
    "Test the support-access path, time bounds and approval controls. Verify identity attribution, privilege limits and removal when the support task ends.",
    "Support procedure; access grant record; expiry and audit test.",
    "Applies where remote maintenance, impersonation or support access is provided.", ENG, ["asvs", "I2d"]);
  add(group, "sensitive-field-permissions", "Are sensitive fields protected against unauthorized reading and modification?", "High",
    "Attempt over-posting of roles, ownership and security flags, and inspect response fields for excess disclosure. Validate field permissions independently of object access.",
    "Request binding rules; field authorization tests; response schema review.",
    "Applies to structured APIs, forms and imported records with protected fields.", ENG, ["asvs", "I2d", "I2f"]);
  add(group, "component-isolation", "Are high-risk components isolated from unrelated sensitive resources?", "High",
    "Review trust separation around parsers, plugins and external integrations. Demonstrate that compromise of a lower-trust component has constrained access to other components and data.",
    "Isolation diagram; sandbox policy; containment tests.",
    "Select process, container, hardware or logical isolation according to the product threat model.", ENG, ["I2k", "ssdf"]);

  group = "sessions-tokens";
  add(group, "tokens-unpredictable", "Are session identifiers and bearer tokens generated securely?", "High",
    "Review cryptographic random generation, entropy and token handling. Ensure identifiers are not derived from predictable user attributes or exposed through URLs unnecessarily.",
    "Token-generation review; representative token format; transport inspection.",
    "Applies to sessions, API bearer tokens and recovery tokens; identity-free products may mark not applicable.", ENG, ["asvs", "I2d"]);
  add(group, "tokens-finite-lifetime", "Do access and refresh tokens have finite, enforced lifetimes?", "High",
    "Document lifetime by token type and test requests after expiry. Check signed token expiry, clock handling and any renewal path that could unintentionally grant indefinite access.",
    "Lifetime policy; expired-token replay results; renewal tests.",
    "Applies to bearer tokens including long-lived integration tokens; document risk-based values and managed rotation.", ENG, ["asvs", "I2d"]);
  add(group, "server-idle-expiry", "Does the server enforce session idle expiry?", "High",
    "Leave a session idle, then replay its cookie or token directly after the configured idle limit. Verify background polling and long-lived channels follow the documented idle policy. Browser or app close and crash events may not notify the server; never rely on close handlers instead of server-enforced timeouts.",
    "Idle-timeout policy; server configuration; expired-idle replay test.",
    "Applies to stateful sessions and comparable authenticated activity windows; explain alternative controls for noninteractive identities.", ENG, ["asvs", "sessions", "I2d"]);
  add(group, "server-absolute-expiry", "Does the server enforce an absolute session lifetime?", "High",
    "Maintain activity beyond the configured maximum and verify reauthentication is required. Check that sliding renewal and refresh tokens cannot evade the session's absolute bound.",
    "Absolute-timeout policy; sustained-activity test; refresh-chain tests.",
    "Applies to interactive sessions; evaluate service credentials under the finite-token-lifetime control.", ENG, ["asvs", "I2d"]);
  add(group, "logout-server-revocation", "Does logout revoke server access for the session and its refresh tokens?", "Critical",
    "Capture session cookies, access and refresh tokens before explicit logout or a sign-out/Exit command, then replay them against protected operations and renewal endpoints. Verify server-enforced revocation, including gateways and long-lived connections, and clear client credentials. Local token deletion alone is insufficient.",
    "Post-logout access-token and refresh-token replay results; revocation design.",
    "Applies where logout is offered. Stateless token designs need an effective revocation mechanism if they claim immediate logout termination. Closing a browser or terminating an app is not a reliable explicit logout signal; verify server-side expiry separately.", ENG, ["asvs", "logout", "sessions", "I2d"]);
  add(group, "account-security-events-revoke", "Do account disablement and password recovery terminate existing access?", "Critical",
    "Capture active sessions and tokens, disable the account or complete password recovery, and retry access and refresh. Confirm termination reaches other devices, WebSockets, streams and other long-lived connections.",
    "Account-event revocation tests; connection termination traces; session inventory.",
    "Applies to account systems, including delegated identity providers; define and verify how revocation reaches the product.", ENG, ["asvs", "I2d"]);
  add(group, "privilege-removal-effective", "Does privilege removal promptly end access that depended on the removed privilege?", "Critical",
    "Demote a user or remove tenant membership while sessions and connections remain active. Retry privileged calls, refresh tokens and messages on open channels; verify stale claims do not preserve removed access.",
    "Role-removal replay tests; policy refresh configuration; channel termination results.",
    "Applies when permissions can change; reauthentication or revocation must make the reduced privileges effective.", ENG, ["asvs", "I2d"]);
  add(group, "refresh-rotation-replay", "Are refresh-token reuse and theft contained?", "High",
    "Where refresh tokens are used, test rotation or an equivalent sender-bound design. Replay an already consumed or revoked token and check detection, rejection and affected-session handling.",
    "Refresh-token design; replay test; token-family revocation log.",
    "Applies to refresh-token flows; select a mechanism appropriate to confidential or public clients.", ENG, ["asvs", "I2d"]);
  add(group, "session-rotation-binding", "Are sessions renewed safely when authentication or privilege changes?", "High",
    "Attempt session fixation before login and elevation. Verify new session identifiers or equivalent secure bindings and reject old identifiers after the transition.",
    "Session fixation test; login/elevation traces; identifier rotation evidence.",
    "Applies to session-based authentication and privilege elevation.", ENG, ["asvs", "I2d"]);
  add(group, "browser-session-storage", "Are browser session credentials protected in transit and storage?", "High",
    "Inspect cookies for appropriate Secure, HttpOnly and SameSite settings, scope and lifetime. Review bearer-token storage and browser script exposure against the web threat model.",
    "Cookie inspection; browser storage review; cross-origin session tests.",
    "Applies to browser clients; mark not applicable for products without browser-held credentials.", ENG, ["asvs", "I2e"]);

  group = "data-crypto";
  add(group, "data-in-transit-protection", "Is sensitive data protected in transit across relevant trust boundaries?", "High",
    "Capture representative traffic and inspect protocol configuration. Check encryption and peer verification on external links and internal links crossing an untrusted or shared boundary.",
    "Traffic capture; TLS configuration; service-to-service trust diagram.",
    "Apply confidentiality controls to relevant data and risks; do not assume every internal link has the same exposure.", CRA, ["I2e"]);
  add(group, "data-at-rest-protection", "Is sensitive stored data protected against unauthorized disclosure?", "High",
    "Inspect databases, files, backups, caches and device storage. Demonstrate appropriate encryption or other justified technical protection and restrict the ability to decrypt.",
    "Storage inventory; encryption settings; unauthorized-read tests.",
    "Apply controls according to data sensitivity and risk; encryption is one means of meeting the confidentiality outcome.", CRA, ["I2e"]);
  add(group, "peer-certificate-validation", "Do secure connections reject untrusted or mismatched peers?", "High",
    "Test expired, untrusted and wrong-host certificates and inspect production trust stores. Check that permissive development certificate validation is disabled.",
    "Negative TLS tests; trust-store review; production client configuration.",
    "Applies to certificate-based secure transports; assess equivalent trust validation for other protocols.", ENG, ["asvs", "I2e"]);
  add(group, "crypto-algorithms-reviewed", "Are cryptographic mechanisms and parameters appropriate for the protected data?", "High",
    "Inventory cryptographic uses, libraries, algorithms, modes and key lengths. Review them against current recognized guidance and avoid custom cryptographic constructions.",
    "Cryptographic inventory; configuration review; migration decisions.",
    "Applies where cryptography is used; consider expected data lifetime and product support period.", ENG, ["asvs", "I2e", "I2f"]);
  add(group, "secrets-protected", "Are secrets kept out of shipped code and unauthorized storage locations?", "Critical",
    "Scan source, history, packages, images and client bundles for private credentials. Confirm production secrets are injected through controlled facilities with restricted read access.",
    "Secret-scan findings; artifact inspection; secret-store access policy.",
    "Applies to private keys, passwords and bearer credentials; public identifiers are not automatically secrets.", ENG, ["ssdf", "I2e"]);
  add(group, "keys-lifecycle-managed", "Can cryptographic keys be rotated, revoked and recovered securely?", "High",
    "Review ownership, generation, access, backup and destruction. Rehearse rotation and a compromised-key response without exposing replacement keys.",
    "Key-management plan; rotation drill; restricted key-access records.",
    "Applies to keys the product or supplier controls; document provider-managed responsibilities.", ENG, ["asvs", "ssdf"]);
  add(group, "data-command-integrity", "Are data, commands and configuration protected against unauthorized modification?", "High",
    "Tamper with stored records, commands and configuration at relevant boundaries. Verify suitable integrity checks, authorization and reporting of detected corruption.",
    "Tampering tests; integrity mechanism design; corruption event sample.",
    "Apply mechanisms to the risks of each asset; an unkeyed checksum alone does not authenticate an untrusted sender.", CRA, ["I2f"]);
  add(group, "permanent-data-erasure", "Can users securely and easily remove their data and settings permanently?", "High",
    "Exercise the removal flow and verify treatment of local storage, linked services and documented backup-retention boundaries. Validate deletion or cryptographic erasure against the storage technology.",
    "Erasure test; data-location inventory; retention and backup handling instructions.",
    "Apply to product-held data and settings; distinguish permanent removal from a configuration reset and record constraints for review.", CRA, ["I2m"]);
  add(group, "secure-data-transfer", "Is user data transferred securely when product transfer is offered?", "High",
    "Export and import representative data. Verify caller authorization, destination checks, protected transfer and safe handling of temporary export files.",
    "Transfer flow test; export permissions; transport and temporary-file review.",
    "Conditional: applies where product data can be transferred to another product or system; otherwise record not applicable.", CRA, ["I2m"]);
  add(group, "sensitive-data-client-cache", "Are sensitive client-side caches and temporary files controlled?", "Medium",
    "Inspect browser caches, local databases, crash dumps and temporary files after normal use and sign-out. Test appropriate storage permissions, cache directives and cleanup.",
    "Cache inspection; temporary-file permissions; sign-out cleanup results.",
    "Applies where clients or devices persist sensitive content; account for intended offline functionality.", ENG, ["asvs", "I2e", "I2g"]);

  group = "application-security";
  add(group, "input-schema-validation", "Is untrusted input validated against explicit types and limits?", "High",
    "Test missing, malformed, oversized and unexpected values at APIs, files, device protocols and integration boundaries. Canonicalize deliberately and enforce business constraints.",
    "Input schemas; boundary-value tests; malformed-request results.",
    "Applies to each untrusted input surface; test validation at a trusted boundary.", ENG, ["asvs", "I2j"]);
  add(group, "injection-resistance", "Are database, command and interpreter operations protected from injection?", "Critical",
    "Trace untrusted input into SQL, shell, templates and other interpreters. Test parameterized operations and safe APIs, including less common import and administrative paths.",
    "Code review; injection tests; query and process invocation patterns.",
    "Applies where the product invokes interpreters; mark absent technologies not applicable with a surface inventory.", ENG, ["asvs"]);
  add(group, "browser-output-encoding", "Is browser-rendered content protected from script injection?", "High",
    "Test stored and reflected untrusted values in HTML, attributes, scripts and URLs. Verify context-aware encoding or sanitization and safe DOM handling.",
    "XSS test results; rendering review; sanitizer configuration.",
    "Conditional: applies to browser or embedded web content; otherwise record not applicable.", ENG, ["asvs"]);
  add(group, "csrf-controls", "Are browser requests with ambient credentials protected against cross-site forgery?", "High",
    "Attempt sensitive actions from another origin. Verify anti-CSRF tokens, origin checks or an appropriate equivalent and ensure state changes do not use unsafe GET behavior.",
    "Cross-site request tests; CSRF configuration; affected endpoint list.",
    "Conditional: applies to browser flows using cookies or other automatically attached credentials.", ENG, ["asvs"]);
  add(group, "cross-origin-policy", "Do browser origin and embedding policies match intended trust relationships?", "Medium",
    "Test CORS with attacker-controlled origins and credentials. Review frame restrictions and content security policy appropriate to the application and its integrations.",
    "CORS negative tests; response-header review; embedding test.",
    "Conditional: applies to web clients and browser-accessible APIs; explain intentional public cross-origin APIs.", ENG, ["asvs"]);
  add(group, "ssrf-egress-controls", "Are server-initiated requests constrained to permitted destinations?", "High",
    "Test URL imports, callbacks and webhooks against loopback, internal ranges, cloud metadata and redirect chains. Apply destination validation and egress restrictions appropriate to the feature.",
    "SSRF tests; egress policy; URL-validation review.",
    "Applies when untrusted input influences outbound requests; otherwise record not applicable.", ENG, ["asvs", "I2i"]);
  add(group, "file-path-safety", "Are uploaded files and paths handled within authorized boundaries?", "High",
    "Test path traversal, alternate encodings, archive extraction and unexpected executable content. Restrict storage locations, permissions and serving behavior.",
    "Upload and archive tests; file-storage permissions; traversal test results.",
    "Applies to file upload, import, download, local path or archive features.", ENG, ["asvs"]);
  add(group, "parser-deserialization-safety", "Are untrusted structured inputs parsed with safe settings?", "High",
    "Review deserialization, XML, document and media parsers. Test unsafe object construction, external entities and malformed nested content; disable unnecessary parser features.",
    "Parser configuration; malformed-input tests; dependency review.",
    "Applies to structured or complex input parsers; select cases relevant to supported formats.", ENG, ["asvs", "ssdf"]);
  add(group, "business-workflow-integrity", "Do sensitive workflows enforce valid order and transaction consistency?", "High",
    "Try skipping steps, replaying requests and racing conflicting operations. Verify server-side state transitions, idempotency where needed and authorization at commit time.",
    "Workflow abuse tests; concurrency tests; transaction design.",
    "Applies to multistep operations affecting security, ownership, money or other sensitive state.", ENG, ["asvs", "I2f"]);

  group = "platform-devices";
  add(group, "platform-hardening", "Are deployed operating systems and runtime images hardened for their role?", "High",
    "Inspect supported base images, installed packages, service settings and filesystem permissions. Remove unnecessary tooling and compare deployed configuration with the approved baseline.",
    "Hardening baseline; image inventory; deployed configuration review.",
    "Applies to platforms shipped or managed by the supplier; document requirements for customer-managed platforms.", ENG, ["ssdf", "I2j"]);
  add(group, "memory-exploit-mitigations", "Are applicable memory and exploit mitigations enabled?", "High",
    "Inspect build and runtime settings for platform-supported mitigations and unsafe native code. Use memory-safe implementations or proportionate analysis and mitigations for exposed native components.",
    "Compiler flags; binary inspection; sanitizer or native-code review results.",
    "Conditional on language and platform; explain unavailable or incompatible mitigations and selected alternatives.", ENG, ["ssdf", "I2k"]);
  add(group, "device-boot-integrity", "Does the device verify authorized code before boot or execution?", "High",
    "Attempt to boot or install altered firmware and untrusted images. Review the hardware or software root of trust and authorized recovery behavior.",
    "Boot-chain design; tampered-image tests; trust-anchor provisioning record.",
    "Conditional: applies to devices or managed execution chains where boot integrity addresses identified risk; otherwise record not applicable.", ENG, ["I2f", "I2k", "ssdf"]);
  add(group, "physical-debug-access", "Are physical debug and maintenance interfaces controlled in production devices?", "High",
    "Inspect JTAG, UART, service ports and recovery interfaces on production units. Verify disabling, authenticated unlocking or other risk-appropriate protection against unauthorized access.",
    "Production-unit inspection; debug-port tests; service access procedure.",
    "Conditional: hardware and embedded products with relevant interfaces; software-only products may mark not applicable.", ENG, ["I2j", "I2d"]);
  add(group, "device-local-secret-protection", "Are device identities and local keys protected against relevant extraction threats?", "High",
    "Review provisioning and storage on representative production hardware. Test permitted physical-access scenarios and ensure a single extracted identity does not grant fleet-wide access.",
    "Device identity design; key-storage review; extraction threat assessment.",
    "Conditional: devices storing credentials; choose hardware-backed protection where justified by exposure and risk.", ENG, ["I2e", "I2k"]);
  add(group, "mobile-desktop-platform-controls", "Do installed clients use platform security controls appropriately?", "Medium",
    "Review app permissions, signing, sandbox boundaries, IPC and secure storage. Attempt unauthorized calls through deep links or local interprocess interfaces.",
    "Manifest and entitlement review; IPC tests; signing and storage configuration.",
    "Conditional: mobile or desktop installed clients; browser-only products may mark not applicable.", ENG, ["asvs", "I2j", "I2k"]);
  add(group, "recovery-mode-security", "Do recovery and maintenance modes preserve required security boundaries?", "High",
    "Enter supported recovery paths and check authentication, data exposure, firmware checks and return to secure operation. Include behavior after interrupted updates.",
    "Recovery-mode test; maintenance instructions; interrupted-update results.",
    "Conditional: products offering recovery, rescue or maintenance modes; distinguish from ordinary configuration reset.", ENG, ["I2b", "I2f", "I2h"]);

  group = "resilience";
  add(group, "essential-functions-defined", "Are essential functions and acceptable degradation documented and tested?", "High",
    "Identify essential and basic functions, service limits and recovery targets. Test degraded conditions against those targets rather than assuming uninterrupted operation under every attack.",
    "Essential-function list; resilience targets; degraded-mode test report.",
    "Applies to each product; targets should reflect risk and deployment conditions.", CRA, ["I2h"]);
  add(group, "resource-abuse-limits", "Are resource-intensive operations bounded against foreseeable abuse?", "High",
    "Exercise excessive requests, large payloads, expensive queries and queue growth in a controlled environment. Check quotas, timeouts, concurrency limits and backpressure.",
    "Load and abuse tests; resource-limit configuration; saturation metrics.",
    "Select limits relevant to exposed operations; the objective is mitigation, not immunity to every denial-of-service attack.", ENG, ["I2h", "asvs"]);
  add(group, "dependency-failure-handling", "Does the product handle dependency and connectivity failures safely?", "High",
    "Simulate unavailable identity, storage, network and third-party services. Check bounded retries, safe failure, useful user feedback and avoidance of retry storms.",
    "Fault-injection results; retry policy; fallback behavior.",
    "Applies to product dependencies and networked functions; assess offline or fail-safe behavior according to product risk.", ENG, ["I2h", "I2i"]);
  add(group, "restore-after-incident", "Can essential functions and required data be restored after a disruptive incident?", "High",
    "Rehearse recovery from loss or corruption using documented backups, rebuilds or device recovery. Verify integrity, access controls and agreed recovery targets.",
    "Restore drill; recovery runbook; backup integrity checks.",
    "Apply recovery mechanisms appropriate to the product; products without retained state may rely on verified rebuild or reset.", CRA, ["I2h"]);
  add(group, "network-impact-contained", "Are the product's effects on other networks and devices constrained?", "High",
    "Test excessive outbound traffic, reconnect loops, multicast or broadcast behavior and compromised-device scenarios. Check rate controls and avoid enabling amplification or uncontrolled scanning.",
    "Network-behavior tests; outbound limits; protocol threat review.",
    "Applies to connected products and device fleets; isolated products may record not applicable with the connectivity rationale.", CRA, ["I2i"]);
  add(group, "incident-containment-ready", "Can operators contain a compromised component without unnecessary wider impact?", "High",
    "Rehearse disabling an integration, quarantining a device or revoking an identity. Verify essential functions and unrelated users retain the protection expected by the risk assessment.",
    "Containment runbook; isolation drill; emergency control test.",
    "Select containment methods relevant to hosted, installed or device deployments.", ENG, ["I2k", "ssdf"]);

  group = "logging";
  add(group, "security-event-coverage", "Are relevant security events recorded and monitored?", "High",
    "Exercise authentication failures, access changes, sensitive operations and configuration changes. Confirm events have useful actor, action, target and timing information.",
    "Event catalogue; generated event samples; monitoring configuration.",
    "Apply recording and monitoring to activity relevant to product risks, with the user opt-out mechanism assessed separately.", CRA, ["I2l"]);
  add(group, "unauthorized-access-corruption-reporting", "Are suspected unauthorized access and detected corruption reported appropriately?", "High",
    "Trigger representative access violations and integrity failures. Verify that operators or users receive actionable reports without exposing sensitive details to attackers.",
    "Detection test; access alert; corruption report.",
    "Applies to the access and integrity mechanisms selected for the product; distinguish internal alerts from Article 14 regulatory reporting.", CRA, ["I2d", "I2f"]);
  add(group, "logs-sensitive-data-redacted", "Are sensitive values excluded or protected in logs and telemetry?", "High",
    "Trace passwords, tokens, keys, personal data and sensitive payloads through normal and failure paths. Verify redaction in application, proxy, crash and third-party telemetry logs.",
    "Redaction tests; log-field inventory; sanitized sample logs.",
    "Applies where logging or telemetry exists; include client-side and device diagnostics.", ENG, ["asvs", "I2e", "I2g"]);
  add(group, "log-access-integrity", "Are security logs protected from unauthorized access and alteration?", "High",
    "Review log permissions, administrative separation and protected transport. Attempt modification or deletion with normal product identities and inspect protection of central copies.",
    "Log access policy; tampering tests; collection architecture.",
    "Apply integrity and confidentiality controls appropriate to local or centralized logs and product risk.", ENG, ["asvs", "I2e", "I2f"]);
  add(group, "log-injection-time", "Are log entries structured and attributable enough for investigation?", "Medium",
    "Inject control characters and misleading delimiters into logged values. Check safe structured encoding, reliable timestamps and request correlation without putting secrets in identifiers.",
    "Log injection tests; timestamp configuration; correlated event examples.",
    "Applies where logs support investigation; account for devices with limited or intermittently synchronized clocks.", ENG, ["asvs"]);
  add(group, "security-log-optout", "Does the user have an effective opt-out mechanism for relevant activity logging?", "High",
    "Exercise the documented opt-out and confirm its scope and resulting behavior. Clearly explain effects on monitoring and any separately required records for legal review.",
    "Opt-out walkthrough; before-and-after event results; user instructions.",
    "Evaluate the Part I 2(l) mechanism in product context; do not silently replace opt-out with an administrator-only setting or ignore other applicable law.", CRA, ["I2l"]);
  add(group, "monitoring-response-ownership", "Do actionable security alerts reach an accountable response owner?", "High",
    "Run an alert drill through triage and escalation. Check coverage, secure access, retention appropriate to investigation and handling of collection failures.",
    "Alert routing; drill record; retention settings; response roster.",
    "Applies to supplier-operated monitoring; for customer operation, document configuration and responsibility in the handoff.", ENG, ["ssdf", "I2l"]);

  group = "supply-chain";
  add(group, "component-due-diligence", "Are third-party components reviewed before adoption and release?", "High",
    "Check provenance, maintenance, support status and security history. Evaluate exposure and additional tests proportionate to risk rather than relying on a vulnerability scanner alone.",
    "Dependency review; maintenance assessment; supplier security information.",
    "Includes open-source, commercial, firmware and reused internal components.", CRA, ["manufacturer"]);
  add(group, "sbom-release-specific", "Is a machine-readable SBOM tied to the released product version?", "High",
    "Generate and validate an SBOM against the shipped artifact, covering at least top-level dependencies. Include deeper dependency detail where needed to identify exposure accurately.",
    "Versioned SPDX or CycloneDX SBOM; artifact match; completeness review.",
    "Applies to software components in products; publishing the full SBOM is a separate decision from maintaining it.", CRA, ["II1"]);
  add(group, "known-exploitable-release-gate", "Is release blocked when known exploitable product vulnerabilities remain?", "Critical",
    "Combine component findings, product tests, advisories and exploitability analysis for the actual release. Resolve known exploitable vulnerabilities; keep evidence for findings judged not applicable or not exploitable.",
    "Release vulnerability review; fixes and retests; exploitability rationale.",
    "Applies to market releases on the risk-assessed basis of Part I point 2; a clean SCA scan alone is not proof.", CRA, ["I2a", "II1"]);
  add(group, "regular-security-testing", "Are effective security tests and reviews repeated as the product changes?", "High",
    "Choose code review, static and dynamic analysis, dependency checks, fuzzing or penetration testing according to risk. Define cadence and change triggers; verify findings are remediated and retested.",
    "Security test plan; review reports; remediation and regression records.",
    "Applies across the lifecycle; the CRA does not create a universal requirement for a particular penetration-test format or cadence.", CRA, ["II3"]);
  add(group, "repository-access-protection", "Are source repositories and security-relevant changes protected?", "High",
    "Review access, strong authentication, branch rules and independent review for critical changes. Test removal of departed identities and protection of workflow definitions.",
    "Repository rules; access review; reviewed security change.",
    "Applies to supplier-controlled source and configuration repositories.", ENG, ["ssdf"]);
  add(group, "ci-runner-secret-isolation", "Are CI jobs and runners isolated from unauthorized secrets and production access?", "Critical",
    "Test untrusted pull requests, fork builds and third-party actions against credential boundaries. Use scoped short-lived permissions and clean or isolated runners where appropriate.",
    "CI permission review; untrusted-build test; runner isolation configuration.",
    "Applies to build and release automation, including externally hosted runners.", ENG, ["ssdf"]);
  add(group, "artifact-provenance-release-approval", "Can each release artifact be traced to approved source and build inputs?", "High",
    "Verify artifact identifiers, source revision, build configuration and dependency inputs. Restrict release promotion and signing to authorized identities and preserve reviewable provenance.",
    "Build provenance; artifact digest; release approval and signing records.",
    "Applies to distributed software, firmware and hosted product releases; exact provenance tooling is an engineering choice.", ENG, ["ssdf"]);
  add(group, "pipeline-compromise-response", "Does the response plan assess product impact after a pipeline or signing compromise?", "High",
    "Rehearse a compromised runner, repository or signing key. Assess affected artifacts and users, containment, credential revocation and whether Article 14 actively exploited vulnerability or severe-incident triggers are met.",
    "Supply-chain incident exercise; artifact impact analysis; reporting trigger decision.",
    "Applies to development, production and maintenance infrastructure; a pipeline event needs trigger assessment rather than an automatic assumption of regulatory reportability.", ENG, ["ssdf", "reporting"]);
  add(group, "security-training-role-based", "Do contributors receive security training suited to their responsibilities?", "Medium",
    "Review onboarding and refresher coverage for developers, reviewers, release staff and support. Use relevant product weaknesses or exercises to verify practical understanding.",
    "Training plan; attendance; role-based exercise results.",
    "Applies to internal and contracted contributors; training format and cadence follow risk and responsibilities.", ENG, ["ssdf"]);
  add(group, "secure-sdlc-operational", "Are secure development activities part of the normal delivery process?", "High",
    "Sample recent changes for security requirements, review, testing and release decisions. Assign owners for process gaps and feed incident root causes back into development practices.",
    "SDLC workflow; sampled change records; improvement actions.",
    "Applies across product development and maintenance; adapt the process to team size and product risk.", ENG, ["ssdf"]);

  group = "updates-handoff";
  add(group, "update-authenticity-integrity", "Does the product verify update authenticity and integrity before installation?", "Critical",
    "Attempt modified packages, untrusted signing keys and substituted update metadata. Verify a trusted signature or equivalent authenticated mechanism; a checksum delivered alongside an untrusted download does not prove authenticity.",
    "Update trust design; tampered-package tests; signing-key policy.",
    "Applies to updateable software and devices; evaluate packages, metadata and the trust chain together.", ENG, ["II7", "I2f", "ssdf"]);
  add(group, "update-installation-recovery", "Can security updates be installed and recovered safely?", "High",
    "Test supported-version upgrades, interruption and failure. Confirm useful diagnostics and recovery without allowing unauthorized downgrade to vulnerable code where rollback protection is needed.",
    "Update matrix; interruption tests; recovery and downgrade review.",
    "Applies to updateable products; select rollback controls according to risk and recovery needs.", ENG, ["I2c", "II7", "I2h"]);
  add(group, "automatic-update-controls", "Are applicable automatic security updates enabled with usable user controls?", "High",
    "Check default automation, an appropriate installation window, available-update notifications, temporary postponement and an easy opt-out. Record the product-specific rationale where automatic installation is not applicable.",
    "Default update settings; notification and postponement tests; opt-out walkthrough.",
    "Conditional: automatic installation is required where applicable on the risk-assessed basis; preserve the availability of security updates even when automation is not applicable.", CRA, ["I2c", "II7"]);
  add(group, "separate-security-updates", "Are security fixes delivered separately from feature updates where technically feasible?", "High",
    "Review release packaging and dependency constraints. Document technical reasons for combined delivery and how users receive timely remediation.",
    "Security-only release example; packaging design; feasibility decision.",
    "Conditional on technical feasibility; avoid making feature adoption an unnecessary prerequisite to a fix.", CRA, ["II2"]);
  add(group, "vulnerability-remediation-timely", "Are discovered vulnerabilities triaged and remediated without avoidable delay?", "High",
    "Sample internal, customer and component reports through assessment, fix, testing and delivery. Prioritize according to product risk and verify overdue work is escalated.",
    "Vulnerability tracker; triage timestamps; fix and retest records.",
    "Applies during the relevant product support obligations; contractual targets should support timely handling, not replace it.", CRA, ["II2", "manufacturer"]);
  add(group, "vulnerability-intake-disclosure", "Can reporters reach a maintained vulnerability contact and disclosure process?", "High",
    "Test the public contact route and confirm a human-owned triage path. Publish and apply a coordinated disclosure policy covering receipt, secure communication, coordination and feedback.",
    "Published contact and policy; test report; intake and triage record.",
    "Applies to product and included third-party component reports; a general support address alone needs a working security triage process.", CRA, ["II5", "II6"]);
  add(group, "component-monitoring-owner", "Is an owner monitoring component vulnerabilities for supported product versions?", "High",
    "Connect release SBOMs and inventories to relevant advisories. Rehearse identifying affected versions, assigning remediation and notifying component maintainers when a component flaw is discovered.",
    "Monitoring ownership; advisory-to-product trace; maintainer coordination record.",
    "Applies throughout support, including open-source and vendor components; monitoring must reach an accountable product owner.", CONTRACT, ["II1", "manufacturer", "ssdf"]);
  add(group, "fixed-vulnerability-advisories", "Do security releases provide useful information about fixed vulnerabilities?", "High",
    "Review advisories for affected product identifiers, impact, severity and clear remediation steps. Record a specific security rationale and revisit date for any justified delay in public disclosure.",
    "Security advisory; affected-version list; reviewed disclosure-delay decision.",
    "Applies after a security update is made available; do not present publication delays as an unrestricted default.", CRA, ["II4"]);
  add(group, "updates-accessible-advised", "Are available security fixes delivered promptly with clear user guidance?", "High",
    "Verify users can obtain fixes, identify needed action and understand installation consequences. Review charging arrangements against the narrow tailor-made business-user exception.",
    "Update download or delivery test; advisory messages; applicable contract terms.",
    "Security updates are generally free; any different agreement needs the specified manufacturer/business-user tailor-made-product context.", CRA, ["II8"]);
  add(group, "support-period-owned", "Is the support period justified, communicated and assigned to an owner?", "High",
    "Document expected use, support end date, dependency constraints and delivery responsibility. Check the Article 13 baseline: at least five years unless expected use is shorter, in which case support follows that use time.",
    "Support-period rationale; published end date; maintenance ownership agreement.",
    "Applies to CRA support planning; a contract end date alone does not determine the statutory support period.", CRA, ["manufacturer"]);
  add(group, "security-update-retention", "Will issued security updates remain available for the required retention period?", "Medium",
    "Verify update archives, storage ownership and access continuity against Article 13(9): at least ten years from issue or the remaining support period, whichever is longer.",
    "Update retention policy; archive inventory; continuity and access test.",
    "Applies to security updates issued during the support period; plan beyond supplier handoff or contract expiry.", CRA, ["manufacturer"]);
  add(group, "article14-reporting-ready", "Can the responsible manufacturer assess and meet Article 14 reporting duties?", "High",
    "Rehearse reporting triggers, awareness timestamps, 24-hour warning and 72-hour notification. Verify final-report timing: 14 days after a corrective or mitigating measure becomes available for an actively exploited vulnerability; one month after incident notification for a severe incident. Include affected-user communication and CSIRT/ENISA channels.",
    "Reporting playbook; timed exercise; reporting owner and trigger assessment.",
    "Applies to reportable events under Article 14. Routine findings and pipeline incidents require trigger assessment; final-report timing differs for vulnerabilities and incidents.", CRA, ["reporting"]);
  add(group, "contract-roles-responsibilities", "Are customer, contractor and manufacturer responsibilities explicitly allocated?", "High",
    "Agree ownership of implementation, risk decisions, conformity documentation, support and reporting. Record the statutory-role analysis separately: a contractor's label in a contract does not decide its legal status.",
    "Responsibility matrix; signed scope; statutory-role review.",
    "Applies to outsourced work, integration and handoff; statutory obligations remain determined by applicable law and actual activities.", CONTRACT, ["manufacturer", "reporting"]);
  add(group, "contract-security-deliverables", "Are contractual security requirements and evidence deliverables reviewable?", "High",
    "Link the agreed security requirements to acceptance tests, evidence formats, delivery dates and owners. Clarify access to source, SBOMs and test findings needed after handoff.",
    "Contract security schedule; acceptance checklist; deliverable register.",
    "Applies where a customer or supplier contract governs delivery; contract requirements may extend beyond CRA outcomes.", CONTRACT, ["ssdf", "manufacturer"]);
  add(group, "escalation-service-levels", "Are vulnerability escalation and response service levels agreed and exercised?", "High",
    "Specify secure notification routes, severity triage, response targets, out-of-hours coverage and escalation. Rehearse contractor-to-manufacturer transfer quickly enough for statutory reporting clocks.",
    "Escalation matrix; response targets; contact drill and handoff timestamps.",
    "Applies to supplier/customer response arrangements; an SLA does not extend legal notification deadlines.", CONTRACT, ["reporting", "ssdf"]);
  add(group, "security-evidence-handoff", "Does the handoff provide maintainers with usable security evidence and instructions?", "High",
    "Deliver version-linked architecture, risk decisions, Annex I mapping, SBOM, test results, unresolved findings, secure operation and update procedures. Verify the receiving owner can access and use the material.",
    "Accepted handoff pack; evidence index; maintainer walkthrough.",
    "Applies at supplier transfer and major release milestones; protect confidential findings and retain evidence under applicable obligations.", CONTRACT, ["manufacturer", "ssdf"]);

  window.CRADetailedCatalog = { version: 1, categories, items };
})();
