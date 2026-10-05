# Release contract

A release manifest pins exact approved revision digests independently of editorial approval. U1 implements and tests this contract with fictional records; it does not infer a production baseline or create any approval. U7 owns baseline migration and authoring commands.

```json
{
  "version": 1,
  "releasedAt": "2020-01-01T00:00:00Z",
  "authorizedBy": "Actual human release decision",
  "entries": [{ "id": "example", "digest": "sha256 editorial digest" }],
  "withdrawals": []
}
```

Injected revisions have `{id, digest, entry, fragment?, assetDigests?}`. `entry.approval.digest` must match the manifest pin and the recomputed editorial digest. Custom fragments retain their released copy; a build recomputes working fragment and asset digests and fails on mismatch. Unapproved replacement records do not replace a pin. A withdrawal has `{id, reason, at, authorizedBy}` and requires a previously released revision with explicit `release: {at, authorizedBy}` evidence; a never-public retired entry is simply absent. Withdrawal copy is a safe public notice and must not repeat the withdrawn claim.

Until U7 installs a verified manifest, the existing build retains its clearly marked legacy selection path. Do not treat U1's fixture coverage as production revision protection.
