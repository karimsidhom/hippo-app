# Hippo — Privacy & Procurement Pack

This folder is the institutional-procurement bundle for any residency
program, hospital, or university that wants to deploy Hippo as their
case-logging + CBD platform. The documents here are written so they
can be handed unchanged to:

- **University IT / privacy office** (PIA, PHIA attestation)
- **Hospital legal counsel** (DPA template, security overview)
- **Royal College accreditation reviewers** (CBD compliance summary)
- **Programme directors** (acceptable-use, training-data position)

## Index

| File | Audience | What it answers |
|---|---|---|
| [`privacy-impact-assessment.md`](./privacy-impact-assessment.md) | University privacy officers | "Does Hippo handle my residents' data lawfully and proportionately?" |
| [`phia-attestation.md`](./phia-attestation.md) | Manitoba health-records counsel | "Does Hippo meet the Personal Health Information Act (PHIA) standards?" |
| [`security-overview.md`](./security-overview.md) | Hospital infosec | "What's your security posture — encryption, key management, RLS, audit, incident response?" |
| [`data-processing-addendum.md`](./data-processing-addendum.md) | Institutional legal | A ready-to-sign DPA template (PIPEDA + provincial-equivalent compliant) |
| [`cbd-compliance-summary.md`](./cbd-compliance-summary.md) | RCPSC accreditation reviewers | "Does this tool support the CBD assessment infrastructure your programme is accredited against?" |
| [`acceptable-use.md`](./acceptable-use.md) | Programme directors | What residents and faculty must agree to when using Hippo |

## How to use this pack

Most procurement offices want a single PDF or shared folder. Easiest:

```bash
# Build a single PDF bundle from this folder
pandoc README.md privacy-impact-assessment.md phia-attestation.md \
       security-overview.md data-processing-addendum.md \
       cbd-compliance-summary.md acceptable-use.md \
       -o hippo-procurement-pack.pdf \
       --toc --pdf-engine=xelatex
```

Or zip the markdown directly — most modern legal teams accept Markdown.

## Versioning

Every file at the top carries a YAML front-matter `version` and
`effectiveDate`. When a material change happens (e.g. a new sub-
processor, a new data flow), bump the version, update `effectiveDate`,
and re-deliver.

The privacy team will treat **any change to the data-flow diagram or
sub-processor list as material** — re-circulate before deploying.

## Status

These documents reflect the **as-built state** of Hippo as of the
`effectiveDate` listed at the top of each file. They are reviewed by
the team quarterly and any time a sub-processor changes.

If you find a mismatch between what these docs claim and what the
running system does, that's a bug — please open an issue at
github.com/karimsidhom/hippo-app or email security@hippomedicine.com.
