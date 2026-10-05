# Release contract

A release manifest pins exact approved revision digests independently of editorial approval. The verified original hosted edition is pinned in `current.json`; approval and release commands live in `scripts/review-packets.mjs`. Snapshots retain their original carry-forward provenance; later copy remains private proposals.

```json
{
  "version": 1,
  "releasedAt": "2020-01-01T00:00:00Z",
  "authorizedBy": "Actual human release decision",
  "entries": [{ "id": "example", "digest": "sha256 editorial digest" }],
  "withdrawals": []
}
```

Injected revisions have `{id, digest, entry, fragment?, assetDigests?}`. `entry.approval.digest` must match the manifest pin and the recomputed editorial digest. A custom working fragment holds the latest approved copy. A build verifies it against that approval, emits the pinned snapshot if a newer approved revision is awaiting release, and checks the actual pinned asset bytes. Unapproved working edits fail. Unapproved replacement records do not replace a pin. A withdrawal has `{id, reason, at, authorizedBy}` and requires a previously released revision with explicit `release: {at, authorizedBy}` evidence; a never-public retired entry is simply absent. Withdrawal copy is a safe public notice and must not repeat the withdrawn claim.

Production builds require this disk manifest. Fixture builds with explicitly injected records may omit it for isolated status-selection tests. See `docs/content-system.md` for the human-input contract, separate release command, interruption recovery, and pending share-presentation rollout gates.
