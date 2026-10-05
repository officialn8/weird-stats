# Private candidate ledger

JSON candidate records are created by `node scripts/candidates.mjs record`, not by a public build. No research candidates were invented to initialize this directory.

Each record keeps its stable ID, claim fingerprint, exact source locators and reachability, evidence gaps, treatment gaps, duplicate links, disposition and reason, optimistic revision, and contributing run IDs. The nested `input` preserves the last proposed payload for idempotent retries. Rephrased discoveries still need editorial comparison; URL normalization is not a novelty detector.

Use `node scripts/candidates.mjs report` for the shared creator/agent report and command revision tokens. See `docs/editorial/daily-workflow.md` for operation and retry rules.
