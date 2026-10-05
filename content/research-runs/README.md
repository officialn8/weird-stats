# Private research checkpoints

Use one stable run ID for a scheduled run and all its retries. Checkpoints retain investigated candidate IDs, reserved/written promotions and their candidate revision, timestamps, events, and truthful outcome reports. No actual runs have been performed by initializing the ledger.

A promotion reservation consumes its slot before the entry is created. Retry the same promotion to recover after interruption. Commands never overwrite an existing entry that differs from the reserved revision. An active `content/.editorial.lock` blocks command writers; after a process crash, confirm its recorded PID is no longer running before manually removing that lock. Do not remove a live writer's lock.

Seven recorded real runs are evidence for a workload discussion, not automatic permission to raise limits. Test fixtures and rehearsal data never belong here.
