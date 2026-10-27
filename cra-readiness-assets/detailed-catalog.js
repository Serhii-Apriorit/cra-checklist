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
    keys: { label: "OWASP Key Management — key purpose, lifecycle and recovery", url: "https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html" },
    rest: { label: "OWASP REST Security — bearer-token integrity and claim validation", url: "https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html" },
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
  add(group, "risk-assessment-current", "Is the product security risk assessment current, documented and reviewed?", "High",
    "Use one reviewed assessment to describe entry points, data flows, trust boundaries and credible abuse scenarios, including physical threats where relevant. Exercise relevant abuse cases or link their verification results. Record chosen protections, design rationale, compensating controls and residual-risk owners. Cover development through support and update the review when the product or threat landscape changes.",
    "Versioned risk assessment with threat model, design decisions, residual-risk register and review history.",
    "Applies throughout the product lifecycle. Scale analysis to product risk; residual-risk acceptance cannot waive an applicable statutory obligation.", CRA, ["risk", "I1", "asvs", "ssdf"]);
  add(group, "security-requirements-acceptance", "Is every security requirement linked to a test or other evidence and a responsible owner?", "High",
    "Maintain one requirements matrix linking every applicable Annex I Part I and Part II outcome and additional agreed security requirements to implementation, acceptance tests, evidence and responsible owners. Record the reviewer and reasons for inapplicable requirements, and track pre-release decisions for unresolved requirements. For contracted work, include evidence formats, delivery dates and continued access to the source, SBOM and findings needed after handoff.",
    "Requirements and applicability matrix with acceptance criteria, test/evidence links, reviewed exceptions and contractual delivery commitments where applicable.",
    "Applies to product security requirements and changes. Contractual delivery columns apply only where work is contracted; the Annex I mapping applies to CRA readiness. A completed matrix alone does not establish conformity.", ENG, ["I1", "manufacturer", "ssdf"]);
  add(group, "data-purpose-inventory", "Is each collected or processed data field justified by product purpose?", "High",
    "Inspect forms, telemetry, storage, caches and third-party calls. Remove unnecessary fields and define retention appropriate to the intended purpose.",
    "Data inventory; purpose and retention table; telemetry capture.",
    "Includes personal and other data. Record a rationale if the product processes no user or operational data.", CRA, ["I2g"]);

  group = "production-defaults";
  add(group, "production-debug-disabled", "Are production debug and diagnostic interfaces disabled or protected against unauthorized access?", "Critical",
    "Inspect actual production packages, runtime configuration and, where present, hardware units for debug servers, interactive consoles, diagnostic switches, JTAG, UART and service/recovery ports. Disable unsafe capabilities or verify authenticated unlocking, limited privileges and operational justification for supported diagnostics. Test remote and local re-enablement attempts relevant to the product. Debug symbols alone are not an unsafe debug interface.",
    "Production build/configuration review; diagnostic endpoint and port tests; hardware inspection and authenticated-unlock tests where relevant.",
    "Applies to production releases. Test each network, local or hardware diagnostic surface that exists. Supported maintenance capabilities must have approved authorization; products without hardware ports assess only their applicable software surfaces.", ENG, ["I2b", "I2j", "I2d", "asvs"]);
  add(group, "production-demo-accounts-removed", "Are development/test identities and unintended demo accounts excluded from production?", "Critical",
    "Remove development, test and unintended demonstration identities from production seed data, installers, images and hosted provisioning. Inspect the resulting account inventory and attempt known development logins. If a demo or guest experience is an intentional product feature, verify its approved permissions and isolation from real customer data; it must not provide a test bypass or shared privileged login.",
    "Account inventory; seed-data review; clean-install login results.",
    "Applies where accounts exist; mark not applicable with an explanation for account-free products.", ENG, ["I2b", "I2d", "asvs"]);
  add(group, "developer-bypass-absent", "Are developer authentication bypasses and hidden backdoors excluded from production?", "Critical",
    "Review feature flags, special headers, magic passwords, maintenance URLs and alternate entry points. Verify that build-time and runtime switches cannot bypass normal authorization in the shipped artifact.",
    "Code review; release-artifact inspection; bypass regression results.",
    "Applies to production releases; legitimate maintenance access must use documented, controlled authorization.", ENG, ["I2d", "ssdf", "asvs"]);
  add(group, "default-services-minimized", "Does the production deployment enable only the services, ports and components the product actually needs?", "High",
    "Compare a clean production deployment with the approved baseline for both the product and supplier-managed platform. Review supported base images, installed packages and tooling, network listeners, APIs, plugins, local services, service settings and filesystem permissions. Remove unnecessary components and exposure; document platform requirements for customer-managed deployments.",
    "Approved product/platform baseline; package and feature inventory; service/network scan; deployed configuration and permissions review.",
    "Applies to shipped or supplier-managed software and platforms. For customer-managed platforms, verify the documented requirements; do not imply control over infrastructure the supplier cannot manage.", CRA, ["I2b", "I2j", "ssdf"]);
  add(group, "secure-first-run", "Does a new installation block normal use until required security setup (such as setting a password) is complete?", "High",
    "Start a clean installation and try to skip, interrupt or replay mandatory security setup. Verify that protected functions stay inaccessible until setup completes. Assess the enabled feature set under default interfaces and credential provisioning under initial credentials.",
    "First-run walkthrough; installer test; default configuration snapshot.",
    "Applies to first-run or provisioning flows. Document any permitted tailor-made business-user configuration agreement.", CRA, ["I2b"]);
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
  add(group, "authentication-all-entrypoints", "Does every non-public interface (APIs, admin tools, device protocols) require authentication, not only the main UI?", "High",
    "Test APIs, administrative tools, device protocols and alternate routes without credentials and with invalid credentials. Confirm the same protection applies beyond the main user interface.",
    "Endpoint inventory; unauthenticated request results; protocol tests.",
    "Applies to functions requiring identity; document deliberately public functionality.", ENG, ["I2d", "asvs"]);
  add(group, "password-storage-protection", "Are passwords stored using suitable salted password hashing?", "High",
    "Review the configured password-hashing algorithm and work factor. Inspect a test account record and verify migration away from weak or reversible storage.",
    "Hashing configuration; sanitized database sample; migration plan.",
    "Applies when the product stores passwords; federated-only or passwordless systems can record not applicable.", ENG, ["asvs", "I2e"]);
  add(group, "privileged-mfa", "Is multi-factor authentication (MFA) required for administrator, support and other privileged access?", "High",
    "List administrative, support and release identities and the interfaces they use. Verify that MFA is enforced for every privileged login, including remote, API and console access, and cannot be skipped through alternate login paths, legacy protocols or account recovery. Check that MFA enrollment and reset require existing strong verification. Where MFA is technically impossible (for example, a local device console), document the compensating control.",
    "Privileged-account inventory; MFA enforcement configuration; login and bypass test results; MFA recovery procedure.",
    "Applies wherever privileged access exists, including through an identity provider. The CRA does not name MFA; it is the expected engineering measure for privileged access under Annex I Part I 2(d). Record any compensating control and its rationale.", ENG, ["asvs", "I2d"]);
  add(group, "credential-attack-controls", "Are credential guessing and automated login abuse mitigated?", "High",
    "Test rate limits, backoff, monitoring and account-enumeration responses. Check that protective mechanisms do not create an easy account-lockout denial of service.",
    "Login abuse tests; throttling configuration; alert examples.",
    "Applies to exposed authentication flows; assess local/offline authentication separately.", ENG, ["asvs", "I2d"]);
  add(group, "account-recovery-proof", "Does account recovery verify control before changing credentials?", "High",
    "Exercise reset and recovery links with expired, reused and altered tokens. Check that changing recovery channels requires appropriate verification and that completion reaches the session-revocation path.",
    "Recovery flow tests; token validation tests; recovery notification sample.",
    "Applies when account recovery is offered; document external identity-provider responsibilities.", ENG, ["asvs", "I2d"]);
  add(group, "federation-validation", "If users sign in through an external identity provider (SSO), are its responses fully validated?", "High",
    "Applies to sign-in through providers such as Microsoft Entra ID, Google or Okta using OAuth/OpenID Connect or SAML. Test issuer, audience, signature, redirect URI, state and nonce or equivalent protocol bindings. Attempt cross-client and cross-tenant response substitution.",
    "Identity-provider configuration; federation negative tests; trust metadata.",
    "Applies to OAuth/OIDC, SAML or comparable federation; mark not applicable for products without federation.", ENG, ["asvs"]);

  group = "authorization";
  add(group, "object-level-access", "Can users access only the records they are permitted to, even if they change an ID in the request?", "High",
    "Swap identifiers across users for reads, writes, downloads and deletion, including nested and batch endpoints. Confirm denied access does not disclose object contents.",
    "Cross-user object-access tests; authorization matrix.",
    "Applies to products with user-owned or access-controlled resources.", ENG, ["asvs", "I2d"]);
  add(group, "role-function-controls", "Does the server check the caller’s permissions for every protected action, rather than relying on hidden UI elements?", "Critical",
    "Invoke protected and administrative functions directly through APIs, scheduled jobs, tools and every configuration channel, bypassing UI restrictions. Verify trusted server or device enforcement, default denial and rejection of unauthorized operations. Include authorization, invalid-setting rejection and traceable changes for security-sensitive configuration. Object, field and tenant permissions remain separate checks.",
    "Role-to-operation matrix; direct-invocation and privilege-escalation tests; security-configuration validation and change records.",
    "Applies wherever operations require authorization, including security-setting changes. Browser-side hiding alone does not satisfy the control; object-only or tenant-only permissions do not replace function checks.", ENG, ["asvs", "I2d", "I2f"]);
  add(group, "tenant-boundary-isolation", "Are tenant boundaries enforced across data and background processing?", "High",
    "A tenant is a separate customer organization, account or workspace that shares the same deployment, database or infrastructure with other customers but must see only its own data and users. Test tenant substitution in queries, caches, files, queues and background jobs. Verify tenant context comes from trusted identity or policy rather than caller-controlled fields alone.",
    "Cross-tenant test suite; tenancy design; queue and cache key review.",
    "Applies to multi-tenant products; single-tenant products should record their deployment boundary.", ENG, ["asvs", "I2d", "I2k"]);
  add(group, "least-privilege-runtime", "Are runtime components and service identities limited to the privileges and resources they need?", "High",
    "Inventory process users, workload identities, external service callers, API keys and device identities. Check operating-system capabilities, app/cloud permissions and narrow credential scopes. Test denied operations and credential rotation or revocation. Review isolation around high-risk components such as parsers, plugins, installed-app sandboxes and external integrations, and confirm that compromise of a lower-trust component has constrained access to other components and data. Apply cryptographic-key lifecycle controls to relevant keys as well.",
    "Runtime/service identity inventory; permission and isolation policies; denied-operation, containment and rotation/revocation results.",
    "Applies to process, cloud, device and machine-to-machine identities and to components handling untrusted input. Select process, container, hardware or logical isolation according to the threat model; human login strength is covered separately.", ENG, ["ssdf", "asvs", "I2d", "I2k"]);
  add(group, "support-access-controlled", "Is maintenance and support access explicitly authorized and traceable?", "High",
    "Test the support-access path, time bounds and approval controls. Verify identity attribution, privilege limits and removal when the support task ends.",
    "Support procedure; access grant record; expiry and audit test.",
    "Applies where remote maintenance, impersonation or support access is provided.", ENG, ["asvs", "I2d"]);
  add(group, "sensitive-field-permissions", "Are sensitive fields protected against unauthorized reading and modification?", "High",
    "Attempt over-posting of roles, ownership and security flags, and inspect response fields for excess disclosure. Validate field permissions independently of object access.",
    "Request binding rules; field authorization tests; response schema review.",
    "Applies to structured APIs, forms and imported records with protected fields.", ENG, ["asvs", "I2d", "I2f"]);

  group = "sessions-tokens";
  add(group, "tokens-unpredictable", "Are session identifiers and tokens resistant to guessing, forgery and fixation?", "High",
    "For opaque identifiers and bearer secrets, verify cryptographically secure randomness and sufficient entropy. For signed or MAC-protected tokens, verify the authenticator, allowed algorithms, trusted issuer and intended audience. Where a session exists before login, verify its identifier is replaced on login and privilege elevation so a pre-login or lower-privilege session cannot inherit the new access. Readable claims in a signed token are not themselves a failure; assess expiry and browser storage under their separate controls.",
    "Token-generation review; representative token format; transport inspection; session-fixation test.",
    "Applies to sessions, API bearer tokens and recovery tokens; identity-free products may mark not applicable.", ENG, ["asvs", "rest", "I2d"]);
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
  add(group, "account-security-events-revoke", "Are a user’s existing sessions ended when the account is disabled, its password is reset or it is reported compromised?", "Critical",
    "Define which account events require revocation, including disablement, completed password recovery and a confirmed compromise where supported. Exercise each applicable event separately and retry captured sessions, access tokens and refresh tokens on other devices and open connections. Assess ordinary logout and privilege removal under their separate controls.",
    "Account-event revocation tests; connection termination traces; session inventory.",
    "Applies where account-security events can invalidate existing access, including through an identity provider. An unsupported recovery flow is not a failed test by itself. Use Not applicable only if no relevant event applies; a required but missing revocation path is No.", ENG, ["asvs", "I2d"]);
  add(group, "privilege-removal-effective", "When a user’s role or access is reduced, does the change apply promptly to already signed-in sessions?", "Critical",
    "Remove a role or tenant membership from a user with an active session and open connections. Retry privileged calls, token refresh and messages on open channels. Verify that permissions are rechecked on each request, or that cached claims in tokens expire or are revoked within a documented short interval.",
    "Role-removal replay tests; permission-check or claim-refresh configuration; channel termination results.",
    "Applies when permissions can change. Document the maximum delay before reduced privileges take effect (for example, the access-token lifetime) and justify it against the risk assessment.", ENG, ["asvs", "I2d"]);
  add(group, "refresh-rotation-replay", "Are refresh-token reuse and theft contained?", "High",
    "Where refresh tokens are used, test rotation or an equivalent sender-bound design. Replay an already consumed or revoked token and check detection, rejection and affected-session handling.",
    "Refresh-token design; replay test; token-family revocation log.",
    "Applies to refresh-token flows; select a mechanism appropriate to confidential or public clients.", ENG, ["asvs", "I2d"]);
  add(group, "browser-session-storage", "Are browser-held session credentials protected against unintended disclosure?", "High",
    "Inspect credential-specific browser controls: cookie Secure, HttpOnly and SameSite settings, cookie scope, exposure to scripts and placement in URLs or browser storage. Assess encrypted transport and server-enforced lifetime separately. Choose settings appropriate to the actual authentication flow.",
    "Cookie inspection; browser storage review; cross-origin session tests.",
    "Applies to browser clients; mark not applicable for products without browser-held credentials.", ENG, ["asvs", "I2e"]);

  group = "data-crypto";
  add(group, "data-in-transit-protection", "Is data encrypted in transit (for example, with TLS) wherever it crosses a network or untrusted boundary?", "High",
    "Capture representative traffic and verify that required data exchanges use encrypted transports with approved protocol settings. Include internal links that cross an untrusted or shared boundary. Peer-identity and certificate rejection tests belong to the separate peer-validation control.",
    "Traffic capture; TLS configuration; service-to-service trust diagram.",
    "Apply confidentiality controls to relevant data and risks; do not assume every internal link has the same exposure.", CRA, ["I2e"]);
  add(group, "data-at-rest-protection", "Is sensitive stored data, including keys and credentials, encrypted or otherwise protected from unauthorized reading?", "High",
    "Inspect databases, files, backups, caches and device storage, including provisioned identities and private keys. Demonstrate risk-appropriate encryption or other technical protection, restricted decryption access and secure storage permissions. For production hardware, exercise the physical extraction scenarios in the threat model and assess hardware-backed key storage where justified. Verify that an extracted device identity does not unlock other devices or expose fleet-wide data.",
    "Storage and credential-location inventory; encryption/access settings; unauthorized-read tests; hardware extraction and key-store review where applicable.",
    "Applies to sensitive stored data and secrets, with physical tests conditional on deployment exposure. Not every product needs the same storage mechanism; use the documented threat model and provider responsibility boundaries.", CRA, ["I2e", "I2k", "asvs"]);
  add(group, "peer-certificate-validation", "Do secure connections reject untrusted or mismatched peers?", "High",
    "Test expired, untrusted and wrong-host certificates and inspect production trust stores. Check that permissive development certificate validation is disabled.",
    "Negative TLS tests; trust-store review; production client configuration.",
    "Applies to certificate-based secure transports; assess equivalent trust validation for other protocols.", ENG, ["asvs", "I2e"]);
  add(group, "crypto-algorithms-reviewed", "Does the product use only standard, current cryptographic algorithms, libraries and key sizes?", "High",
    "Inventory cryptographic uses, libraries, algorithms, modes and key lengths. Review them against current recognized guidance and avoid custom cryptographic constructions.",
    "Cryptographic inventory; configuration review; migration decisions.",
    "Applies where cryptography is used; consider expected data lifetime and product support period.", ENG, ["asvs", "I2e", "I2f"]);
  add(group, "secrets-protected", "Are secrets kept out of shipped code and unauthorized storage locations?", "Critical",
    "Scan source, history, packages, images and client bundles for private credentials. Confirm production secrets are injected through controlled facilities with restricted read access.",
    "Secret-scan findings; artifact inspection; secret-store access policy.",
    "Applies to private keys, passwords and bearer credentials; public identifiers are not automatically secrets.", ENG, ["ssdf", "I2e"]);
  add(group, "keys-lifecycle-managed", "Does each cryptographic key have a tested lifecycle for its intended use?", "High",
    "Review generation, ownership, rotation, revocation and destruction for each key purpose. Rehearse replacement after compromise. Test backup and recovery only for keys that must preserve access to retained data; do not require escrow or recovery of ephemeral or signing keys when the design deliberately excludes it.",
    "Key-management plan; rotation drill; restricted key-access records.",
    "Applies to keys the product or supplier controls; document provider-managed responsibilities and which lifecycle operations apply to each key purpose.", ENG, ["asvs", "ssdf", "keys"]);
  add(group, "data-command-integrity", "Are data, commands and configuration protected against unauthorized modification?", "High",
    "Tamper with stored records, commands and configuration at relevant boundaries and verify rejection or detection of unauthorized modification. Check the integrity mechanism itself here; assess notification of detected corruption under the separate access-and-corruption reporting control.",
    "Tampering tests; integrity mechanism design; corruption event sample.",
    "Apply mechanisms to the risks of each asset; an unkeyed checksum alone does not authenticate an untrusted sender.", CRA, ["I2f"]);
  add(group, "permanent-data-erasure", "Can users securely and easily remove their data and settings permanently?", "High",
    "Exercise the removal flow and verify treatment of local storage, linked services and documented backup-retention boundaries. Validate deletion or cryptographic erasure against the storage technology.",
    "Erasure test; data-location inventory; retention and backup handling instructions.",
    "Apply to product-held data and settings; distinguish permanent removal from a configuration reset and record constraints for review.", CRA, ["I2m"]);
  add(group, "secure-data-transfer", "Is user data transferred securely when export or transfer is offered?", "High",
    "Export and import representative data. Verify caller authorization, destination checks, protected transfer and safe handling of temporary export files.",
    "Transfer flow test; export permissions; transport and temporary-file review.",
    "Conditional: applies where product data can be transferred to another product or system; otherwise record not applicable.", CRA, ["I2m"]);
  add(group, "sensitive-data-client-cache", "Are sensitive caches and temporary files removed or expired according to policy?", "Medium",
    "Inspect residual browser caches, local databases, crash dumps and temporary files after expiry, sign-out and normal cleanup. Verify the documented retention and cleanup behavior, including intended offline use. Assess encryption and storage access under data-at-rest protection, and user-requested permanent deletion under erasure.",
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
  add(group, "memory-exploit-mitigations", "Are applicable memory and exploit mitigations enabled?", "High",
    "Inspect build and runtime settings for platform-supported mitigations and unsafe native code. Use memory-safe implementations or proportionate analysis and mitigations for exposed native components.",
    "Compiler flags; binary inspection; sanitizer or native-code review results.",
    "Conditional on language and platform; explain unavailable or incompatible mitigations and selected alternatives.", ENG, ["ssdf", "I2k"]);
  add(group, "device-boot-integrity", "Does the device verify authorized code before boot or execution?", "High",
    "Attempt to boot or install altered firmware and untrusted images. Review the hardware or software root of trust and authorized recovery behavior.",
    "Boot-chain design; tampered-image tests; trust-anchor provisioning record.",
    "Conditional: applies to devices or managed execution chains where boot integrity addresses identified risk; otherwise record not applicable.", ENG, ["I2f", "I2k", "ssdf"]);
  add(group, "mobile-desktop-platform-controls", "Do installed clients reject unauthorized local IPC and deep-link operations?", "Medium",
    "Attempt sensitive local operations through interprocess communication (IPC), exported app components, URL handlers and deep links using an unauthorized local caller. Verify caller identity, operation permissions and parameter validation. Assess runtime privileges, component isolation and stored-data protection under their separate controls.",
    "Exported-component and URL-handler inventory; local caller authorization tests; IPC policy.",
    "Conditional: installed clients exposing local IPC, exported components or deep-link handlers. Products without these interfaces can mark Not applicable.", ENG, ["asvs", "I2j", "I2k"]);
  add(group, "recovery-mode-security", "Do recovery and maintenance modes prevent unauthorized access or modification?", "High",
    "Enter supported rescue and maintenance paths and attempt access to protected data, configuration and privileged commands without authorization. Check security boundaries while in those modes. Assess update-package verification and successful recovery from installation failure under their separate update controls.",
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
  add(group, "security-event-coverage", "Are the required security event types recorded?", "High",
    "Compare actual emitted events with the event catalogue derived from the risk assessment. Exercise authentication failures, access changes, sensitive operations and configuration changes. Check coverage here; assess entry structure and timestamps, alert delivery, and log protection under their separate controls.",
    "Event catalogue; generated event samples; monitoring configuration.",
    "Apply recording and monitoring to activity relevant to product risks, with the user opt-out mechanism assessed separately.", CRA, ["I2l"]);
  add(group, "unauthorized-access-corruption-reporting", "Do security detections produce actionable reports that reach the responsible user or operator?", "High",
    "Trigger suspected unauthorized access, integrity failures and other configured detections. Verify useful reports, delivery to an accountable owner, acknowledgement and triage without exposing sensitive details to attackers. Simulate collection or routing failure and confirm it is noticed. For customer-operated monitoring, verify configuration and response responsibilities in the handoff; supplier notification deadlines are assessed separately.",
    "End-to-end alert drill; access/corruption report samples; routing and collection-failure tests; response roster and customer-operation instructions.",
    "Applies to the detection/reporting mechanisms selected for product risks. Cover supplier or customer operation as appropriate. Operational reports are distinct from Article 14 notifications to authorities.", CRA, ["I2d", "I2f", "I2l", "ssdf"]);
  add(group, "logs-sensitive-data-redacted", "Are sensitive values excluded or protected in logs and telemetry?", "High",
    "Trace passwords, tokens, keys, personal data and sensitive payloads through normal and failure paths. Verify redaction in application, proxy, crash and third-party telemetry logs.",
    "Redaction tests; log-field inventory; sanitized sample logs.",
    "Applies where logging or telemetry exists; include client-side and device diagnostics.", ENG, ["asvs", "I2e", "I2g"]);
  add(group, "log-access-integrity", "Are security logs protected from unauthorized access and alteration?", "High",
    "Review log permissions, administrative separation and protected transport. Attempt modification or deletion with normal product identities and inspect protection of central copies.",
    "Log access policy; tampering tests; collection architecture.",
    "Apply integrity and confidentiality controls appropriate to local or centralized logs and product risk.", ENG, ["asvs", "I2e", "I2f"]);
  add(group, "log-injection-time", "Are log entries structured and attributable enough for investigation?", "Medium",
    "Inject control characters and misleading delimiters into logged values. Check safe structured encoding, actor/action attribution, reliable timestamps and request correlation without putting secrets in identifiers. Define an investigation retention period and verify records remain usable for that period, then expire under the retention policy.",
    "Log injection tests; timestamp configuration; correlated event examples; retention and expiry tests.",
    "Applies where logs support investigation; account for devices with limited or intermittently synchronized clocks.", ENG, ["asvs"]);
  add(group, "security-log-optout", "Does the user have an effective opt-out mechanism for relevant activity logging?", "High",
    "Exercise the documented opt-out and confirm its scope and resulting behavior. Clearly explain effects on monitoring and any separately required records for legal review.",
    "Opt-out walkthrough; before-and-after event results; user instructions.",
    "Evaluate the Part I 2(l) mechanism in product context; do not silently replace opt-out with an administrator-only setting or ignore other applicable law.", CRA, ["I2l"]);

  group = "supply-chain";
  add(group, "component-due-diligence", "Are third-party components approved for use based on security due diligence?", "High",
    "Before adoption or a material component change, review provenance, maintenance, support status and security history against component-selection criteria. Assess ongoing vulnerability advisories under component monitoring and known exploitability of the assembled release under the release gate.",
    "Dependency review; maintenance assessment; supplier security information.",
    "Includes open-source, commercial, firmware and reused internal components.", CRA, ["manufacturer"]);
  add(group, "sbom-release-specific", "Is a machine-readable SBOM generated automatically for each released artifact and checked for completeness?", "High",
    "Verify that the CI or release workflow automatically generates a versioned SBOM for every released artifact and links it to the release tag and artifact digest. Reconcile the inventory with the shipped artifact, covering direct and transitive dependencies, OS packages and libraries, and base-container images or layers where applicable. Investigate missing components rather than treating a generated file as proof of completeness.",
    "SPDX or CycloneDX SBOM; CI/release generation log; release tag and artifact digest; dependency, OS-package and container completeness review.",
    "Applies to software components in products. The CRA inventory baseline covers at least top-level dependencies; automation and broader inventory coverage are supporting engineering practices. Assess OS and container coverage only where those components are shipped. Publishing the full SBOM is a separate decision from maintaining it.", CRA, ["II1", "ssdf"]);
  add(group, "known-exploitable-release-gate", "Is release blocked when known exploitable product vulnerabilities remain?", "Critical",
    "Combine component findings, product tests, advisories and exploitability analysis for the actual release. Resolve known exploitable vulnerabilities; keep evidence for findings judged not applicable or not exploitable.",
    "Release vulnerability review; fixes and retests; exploitability rationale.",
    "Applies to market releases on the risk-assessed basis of Part I point 2; a clean SCA scan alone is not proof.", CRA, ["I2a", "II1"]);
  add(group, "regular-security-testing", "Are security tests and reviews embedded in normal delivery and repeated at defined triggers?", "High",
    "Sample normal product changes to verify that the risk-based review and test plan runs at its defined cadence and change triggers. Verify that required software composition analysis (SCA), static application security testing (SAST) and other automatable checks actually run in CI against the relevant source, dependencies and artifacts. Exercise failed, skipped and disabled mandatory scans and confirm they cannot appear successful. Retain coverage and results, assign process-gap owners and use incident root causes to improve regression tests. Merge enforcement is assessed under repository protection; individual remediation is assessed under vulnerability handling.",
    "Approved security test plan; CI scan definitions and execution logs; source/artifact identifiers; scanner configuration; failed/skipped-scan tests; review reports and process-gap owners.",
    "Applies across development and maintenance. Select testing methods according to product risk and the agreed project plan; explain inapplicable tools and alternative verification. The CRA does not universally prescribe named scanners, SAST, SCA or a particular penetration-test format or cadence.", CRA, ["II3", "ssdf"]);
  add(group, "repository-access-protection", "Are source changes protected by access controls, review and mandatory security gates?", "High",
    "Review access, strong authentication, branch rules, workflow protection and independent review for critical changes. Test removal of departed identities. Verify that mandatory security checks prevent merge or promotion when the project's configured thresholds are not met, including missing or failed checks. Review administrator and service-account bypass paths. Require any permitted exception to identify its scope, justification, approving owner and expiry date. An internal exception cannot authorize a market release with a known exploitable vulnerability; assess that outcome under the release gate.",
    "Repository/branch rules; required security-check configuration and thresholds; rejected-merge/promotion tests; access and bypass reviews; scoped exception records with owners and expiry dates.",
    "Applies to supplier-controlled source and configuration repositories and their merge/promotion controls. Thresholds are project engineering policy rather than a universal CRA severity cutoff. Direct commits and non-PR workflows need equivalent enforced checks; a missing required gate is No, not Not applicable.", ENG, ["ssdf"]);
  add(group, "ci-runner-secret-isolation", "Are CI jobs and runners isolated from unauthorized secrets and production access?", "Critical",
    "Test untrusted pull requests, fork builds and third-party actions against credential boundaries. Use scoped short-lived permissions and clean or isolated runners where appropriate.",
    "CI permission review; untrusted-build test; runner isolation configuration.",
    "Applies to build and release automation, including externally hosted runners.", ENG, ["ssdf"]);
  add(group, "artifact-provenance-release-approval", "Can each release artifact be traced to approved source and build inputs?", "High",
    "Verify source revision, build configuration, dependency inputs and approval for the exact distributed artifact. Record cryptographic digests for released packages, binaries and images, and bind those digests to authenticated provenance or signed manifests. Verify the signature or equivalent authentication and test that artifact substitution, changed contents or altered provenance is rejected. Restrict promotion and signing to authorized identities. For installed apps, test package signing and platform trust checks during installation; assess device boot-chain and update-installation checks separately.",
    "Artifact digests; authenticated provenance or signed release manifest; source/build identifiers; release approvals; signature-verification and tampering/substitution tests.",
    "Applies to distributed software, firmware and hosted product releases. Select suitable digest and authentication mechanisms for the release channel; an unauthenticated checksum alone is insufficient. The CRA does not mandate one particular digest algorithm or provenance tool.", ENG, ["ssdf"]);
  add(group, "pipeline-compromise-response", "Does the response plan assess product impact after a pipeline or signing compromise?", "High",
    "Rehearse a compromised runner, repository or signing key. Assess affected artifacts and users, containment, credential revocation and whether Article 14 actively exploited vulnerability or severe-incident triggers are met.",
    "Supply-chain incident exercise; artifact impact analysis; reporting trigger decision.",
    "Applies to development, production and maintenance infrastructure; a pipeline event needs trigger assessment rather than an automatic assumption of regulatory reportability.", ENG, ["ssdf", "reporting"]);
  add(group, "security-training-role-based", "Do contributors receive security training suited to their responsibilities?", "Medium",
    "Review onboarding and refresher coverage for developers, reviewers, release staff and support. Use relevant product weaknesses or exercises to verify practical understanding.",
    "Training plan; attendance; role-based exercise results.",
    "Applies to internal and contracted contributors; training format and cadence follow risk and responsibilities.", ENG, ["ssdf"]);

  group = "updates-handoff";
  add(group, "update-authenticity-integrity", "Does the product verify update authenticity and integrity before installation?", "Critical",
    "Attempt modified packages, untrusted signing keys and substituted update metadata. Verify a trusted signature or equivalent authenticated mechanism; a checksum delivered alongside an untrusted download does not prove authenticity.",
    "Update trust design; tampered-package tests; signing-key policy.",
    "Applies to updateable software and devices; evaluate packages, metadata and the trust chain together.", ENG, ["II7", "I2f", "ssdf"]);
  add(group, "update-installation-recovery", "Can an interrupted or failed security update return the product to a supported working state?", "High",
    "Test upgrades from supported versions and interrupt installation at defined stages. Verify completion or recovery to a supported working state without data loss beyond the documented recovery policy. Reject wrong-product packages, replayed packages and unauthorized downgrades according to the update policy. Assess package authenticity before installation and authorization inside recovery mode separately.",
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
    "Define separate, severity- and product-risk-based targets for triage, mitigation, patch availability and fix verification, with an accountable owner and a clear start event for each clock. Sample internal, customer and component reports and compare actual timestamps against those targets. Verify overdue work is escalated and fixes are retested before closure. Use customer notification and escalation commitments agreed under the service-level control; assess engineering execution here.",
    "Severity-based response targets and clock definitions; vulnerability records with owners; triage, mitigation, patch and verification timestamps; overdue escalations and retest results.",
    "Applies during the relevant product support obligations. Response targets should support remediation without avoidable delay. The Article 14 24/72-hour reporting deadlines are not universal patch deadlines, and an internal SLA cannot extend a statutory notification deadline.", CRA, ["II2", "manufacturer", "reporting"]);
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
  add(group, "updates-accessible-advised", "Can affected users obtain security fixes promptly under the applicable access and charging terms?", "High",
    "Test that supported users can obtain the correct fix and installation instructions through the release channel without avoidable delivery barriers. Review charging arrangements against the narrow tailor-made business-user exception. Assess advisory contents, automatic installation controls and long-term availability under their separate controls.",
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
  add(group, "escalation-service-levels", "Are vulnerability escalation and response service levels agreed and exercised?", "High",
    "Specify secure notification routes, severity triage, response targets, out-of-hours coverage and escalation. Rehearse contractor-to-manufacturer transfer quickly enough for statutory reporting clocks.",
    "Escalation matrix; response targets; contact drill and handoff timestamps.",
    "Applies to supplier/customer response arrangements; an SLA does not extend legal notification deadlines.", CONTRACT, ["reporting", "ssdf"]);
  add(group, "security-evidence-handoff", "Does the handoff provide maintainers with usable security evidence and instructions?", "High",
    "Deliver release-linked architecture, risk decisions, Annex I mapping, SBOM, unresolved findings, operating instructions and the secure-update mechanism specification and procedures. Include the SCA/SAST and other scan reports required by the test plan, applicable penetration-test findings and remediation/retest results. Identify the source/build or artifact, execution date, tool/version and relevant configuration for each report so reviewers can judge coverage and freshness. Verify that the receiving owner can access, interpret and use the package.",
    "Accepted handoff pack and evidence index; release-bound scan/review and applicable penetration-test reports; remediation and retest records; secure-update design/specification; maintainer walkthrough.",
    "Applies at supplier transfer and major release milestones. Required reports follow the product risk assessment and agreed test plan; do not invent a universal penetration-test obligation. Protect confidential findings and retain evidence under applicable obligations.", CONTRACT, ["manufacturer", "ssdf"]);

  const answerGuidance = "Answer Yes only after every applicable check for the control is verified. Answer No if any applicable check fails or a required control is missing. Use Not applicable only when no part of the control applies. Leave an unreviewed control unanswered; optional notes can record mixed results, evidence and applicability decisions.";

  const mergedControls = {
    "risk-assessment-current": [{"id": "trust-boundaries-threats", "label": "Are trust boundaries and credible abuse cases reviewed?"}, {"id": "security-design-decisions", "label": "Are security design decisions and residual risks reviewed?"}],
    "security-requirements-acceptance": [{"id": "annex-requirement-mapping", "label": "Is each applicable Annex I requirement linked to evidence?"}, {"id": "contract-security-deliverables", "label": "Are contractual security requirements and evidence deliverables reviewable?"}],
    "role-function-controls": [{"id": "server-side-authorization", "label": "Is authorization enforced at the trusted execution boundary?"}, {"id": "configuration-change-controls", "label": "Are security-sensitive configuration changes restricted and validated?"}],
    "least-privilege-runtime": [{"id": "service-identities-scoped", "label": "Are machine and service identities individually managed and narrowly scoped?"}, {"id": "component-isolation", "label": "Are high-risk components isolated from unrelated sensitive resources?", "revision": 4}],
    "tokens-unpredictable": [{"id": "session-rotation-binding", "label": "Does login or privilege elevation prevent session fixation?", "revision": 4}],
    "default-services-minimized": [{"id": "platform-hardening", "label": "Are deployed operating systems and runtime images hardened for their role?"}],
    "production-debug-disabled": [{"id": "physical-debug-access", "label": "Are physical debug and maintenance interfaces controlled in production devices?"}],
    "data-at-rest-protection": [{"id": "device-local-secret-protection", "label": "Are device identities and local keys protected against relevant extraction threats?"}],
    "unauthorized-access-corruption-reporting": [{"id": "monitoring-response-ownership", "label": "Do actionable security alerts reach an accountable response owner?"}],
    "regular-security-testing": [{"id": "secure-sdlc-operational", "label": "Are secure development activities part of the normal delivery process?"}],
  };
  for (const item of items) item.mergedFrom = mergedControls[item.id] || [];

  const expandedControls = new Set([
    "sbom-release-specific", "regular-security-testing", "repository-access-protection",
    "artifact-provenance-release-approval", "vulnerability-remediation-timely", "security-evidence-handoff"
  ]);
  for (const item of items) if (expandedControls.has(item.id)) item.reviewRevision = 3;
  // Revision 4 requires MFA specifically, so earlier passes need review.
  for (const item of items) if (item.id === "privileged-mfa") item.reviewRevision = 4;

  window.CRADetailedCatalog = { version: 1, revision: 4, answerGuidance, categories, items };
})();
