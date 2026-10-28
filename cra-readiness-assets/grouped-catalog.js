/* Experimental evidence bundles. Original controls remain the source of truth. */
(() => {
  "use strict";
  const catalog = window.CRADetailedCatalog;
  if (!catalog) return;
  const groups = [];
  const add = (id, title, guidance, evidence, ids) => groups.push({ id, title, guidance, evidence, ids: ids.split(" ") });
  add("design", "Is the product’s security scope, risk and acceptance plan complete?",
    "Review one current design pack against the actual product and release. It must establish boundaries, scope/category decisions, threats, requirements, applicability and accountable owners.",
    "Versioned architecture and threat model + requirements-to-test matrix; confirm release scope and residual-risk decisions with the owner.",
    "product-boundaries cra-scope-category risk-assessment-current security-requirements-acceptance");
  add("production", "Does the shipped production baseline expose only intended, protected capabilities?",
    "Use the actual production build and configuration to review debug surfaces, test accounts, bypasses, enabled services, environment separation and error disclosure together.",
    "One production artifact/configuration review + clean-install service scan + negative tests for debug, bypass and cross-environment access.",
    "production-debug-disabled production-demo-accounts-removed developer-bypass-absent default-services-minimized production-environment-separation production-error-disclosure");
  add("provisioning", "Are initial access, first-run setup and reset secure?",
    "Walk through the complete provisioning lifecycle: initial credentials, mandatory security setup and return to secure defaults. Configuration reset and permanent erasure are different checks.",
    "A recorded clean-install → setup → modified configuration → reset test, including skipped or interrupted setup and default-credential checks.",
    "default-credentials-safe secure-first-run reset-secure-defaults");
  add("identity", "Do all identity flows resist unauthorized access and account takeover?",
    "Review entry points, stored passwords, privileged authentication, login abuse, recovery and federation as one identity system. Include negative cases and external identity-provider responsibilities.",
    "Identity flow inventory + configuration review + existing authentication/recovery/federation test results; confirm privileged-access enforcement.",
    "authentication-all-entrypoints password-storage-protection privileged-mfa credential-attack-controls account-recovery-proof federation-validation");
  add("permissions", "Are permissions enforced across operations, objects, fields and tenants?",
    "Use one access matrix to test every applicable permission dimension at trusted boundaries. UI restrictions or object checks alone cannot establish complete authorization.",
    "Role/resource/tenant matrix + direct API and background-job denial tests, including field changes and security configuration.",
    "object-level-access role-function-controls tenant-boundary-isolation sensitive-field-permissions");
  add("isolation", "Are service identities, support access and risky components contained?",
    "Review machine permissions, maintenance access and component boundaries together. Confirm ownership, least privilege, revocation and traceability for each identity type present.",
    "Service identity and support-access inventory + permission/isolation policies + denied-operation and credential-revocation results.",
    "least-privilege-runtime support-access-controlled");
  add("sessions", "Does the full session and token lifecycle prevent persistent unauthorized access?",
    "Review issuance, storage, idle and absolute expiry, refresh, logout, security events and privilege removal as one lifecycle. Each termination path must be verified; token expiry alone does not prove revocation.",
    "One session lifecycle test suite with replay/negative cases + token and browser-storage configuration; include real server-side expiry and revocation records.",
    "tokens-unpredictable tokens-finite-lifetime server-idle-expiry server-absolute-expiry logout-server-revocation account-security-events-revoke privilege-removal-effective refresh-rotation-replay browser-session-storage");
  add("crypto", "Are data, commands, secrets and keys protected across trust boundaries?",
    "Trace sensitive information from transport to storage and use. Check peer validation, integrity, cryptographic parameters, secret exposure and the lifecycle of each key purpose.",
    "Data-flow and key inventory + transport/storage configuration + certificate, integrity, secret-scan and key-rotation/recovery test evidence.",
    "data-in-transit-protection data-at-rest-protection peer-certificate-validation crypto-algorithms-reviewed secrets-protected keys-lifecycle-managed data-command-integrity");
  add("data-lifecycle", "Is data limited to its purpose and safely retained, transferred and erased?",
    "Review collection, telemetry, caches, exports and permanent deletion against one data inventory and retention policy. Confirm the actual removal and transfer behavior.",
    "Purpose/retention table + telemetry capture + export, cache-expiry and permanent-erasure test results.",
    "data-purpose-inventory permanent-data-erasure secure-data-transfer sensitive-data-client-cache");
  add("input", "Do input boundaries and sensitive workflows resist malicious data and misuse?",
    "Review typed validation, injection, outbound requests, files, parsers and workflow transitions together. Exercise each input mechanism present, including transaction and ordering attacks.",
    "Entry-point inventory + existing negative security test suite for interpreters, outbound destinations, uploads/paths, parsers and transaction workflows.",
    "input-schema-validation injection-resistance ssrf-egress-controls file-path-safety parser-deserialization-safety business-workflow-integrity");
  add("browser", "Are browser content, cross-site requests and trust policies protected?",
    "Review output encoding, ambient-credential request protection, permitted origins and embedding together. Confirm browser behavior using the deployed policy.",
    "Browser security regression results + cookie/header/origin configuration + cross-site and content-injection negative tests.",
    "browser-output-encoding csrf-controls cross-origin-policy");
  add("platform", "Do installed platforms, boot and recovery preserve the product’s security boundary?",
    "Assess the platform features that exist: exploit mitigations, boot/code integrity, local IPC/deep links and recovery/maintenance modes. Hardware and installed-client checks remain distinct within this bundle.",
    "Production binary/build settings + device or installed-client test results for boot tampering, local callers and recovery access, where relevant.",
    "memory-exploit-mitigations device-boot-integrity mobile-desktop-platform-controls recovery-mode-security");
  add("resilience", "Can essential functions withstand abuse, dependency failure and incidents?",
    "Review bounded resource use, safe degradation, network impact, containment and restoration against documented essential functions. A backup configuration alone does not prove recovery.",
    "One resilience exercise pack: abuse/load limits, dependency outages, containment and tested restoration with expected degradation and recovery targets.",
    "essential-functions-defined resource-abuse-limits dependency-failure-handling restore-after-incident network-impact-contained incident-containment-ready");
  add("observability", "Do security events lead to protected, useful detection and response?",
    "Follow representative events from generation through logging, attribution and actionable notification. Check redaction, access/integrity and the relevant user logging opt-out.",
    "Event/alert matrix + end-to-end detection exercise + log samples and storage/access/redaction configuration; verify user controls.",
    "security-event-coverage unauthorized-access-corruption-reporting logs-sensitive-data-redacted log-access-integrity log-injection-time security-log-optout");
  add("release", "Does every release have complete dependency evidence and enforced security acceptance?",
    "Review component approval, automated release SBOM completeness, recurring CI security checks and the known-exploitable-vulnerability gate together. Check actual release results and exception approvals.",
    "One release evidence pack: artifact-linked SBOM, dependency due diligence, scan/test outputs and enforced gate/exception records; validate coverage and freshness.",
    "component-due-diligence sbom-release-specific known-exploitable-release-gate regular-security-testing");
  add("pipeline", "Is the source-to-release chain controlled, traceable and prepared for compromise?",
    "Trace a release through reviewed source, isolated builds and authenticated provenance. Include contributor training and a practiced pipeline/signing compromise response.",
    "Repository and CI enforcement settings + runner/secret boundaries + one authenticated provenance/approval chain + training and compromise-exercise records.",
    "repository-access-protection ci-runner-secret-isolation artifact-provenance-release-approval pipeline-compromise-response security-training-role-based");
  add("updates", "Can users receive authentic security fixes safely throughout support?",
    "Review authenticity, interrupted-install recovery, automatic-update controls, separate fixes, access terms, support ownership and update retention as one supported delivery lifecycle.",
    "Signed-update and interrupted-install tests + user update controls/instructions + published support/access policy and retained-update arrangements.",
    "update-authenticity-integrity update-installation-recovery automatic-update-controls separate-security-updates updates-accessible-advised support-period-owned security-update-retention");
  add("response", "Are vulnerability response, reporting and handoff owned and demonstrably workable?",
    "Trace a report through intake, component monitoring, triage/remediation, advisory and applicable reporting. Confirm measured response targets, responsibility boundaries and release-linked maintainer evidence.",
    "One response/handoff evidence pack: intake and monitoring ownership, timed exercise or case records, advisories, reporting runbook, responsibility matrix and delivery acknowledgement.",
    "vulnerability-remediation-timely vulnerability-intake-disclosure component-monitoring-owner fixed-vulnerability-advisories article14-reporting-ready contract-roles-responsibilities escalation-service-levels security-evidence-handoff");
  const ids = groups.flatMap(group => group.ids);
  if (new Set(ids).size !== ids.length || ids.length !== catalog.items.length || ids.some(id => !catalog.items.some(item => item.id === id))) throw new Error("Experimental groups must cover every current control exactly once.");
  const groupFor = id => groups.find(group => group.ids.includes(id));
  const answerFor = (state, id) => Object.prototype.hasOwnProperty.call(state.answers || {}, id) ? state.answers[id] : ({ Yes: "Yes", "Not applicable": "Not applicable" }[state.groupAnswers?.[groupFor(id).id]] || null);
  const statusFor = (state, group) => {
    const answers = group.ids.map(id => answerFor(state, id));
    if (state.groupAnswers?.[group.id] === "No" || answers.includes("No")) return "No";
    if (answers.some(answer => !answer)) return "Unanswered";
    return answers.every(answer => answer === "Not applicable") ? "Not applicable" : "Yes";
  };
  window.CRAGroupedCatalog = Object.freeze({ revision: 1, groups, groupFor, answerFor, statusFor });
})();
