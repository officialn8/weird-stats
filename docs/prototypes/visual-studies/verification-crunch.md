# Chip-entry verification

Checked October 4, 2026 against the local workspace server at port 63013.

## Browser checks

- Desktop 1280 × 900, mobile 390 × 844, and narrow 320 × 740 inspected. The narrow result had matching 320px document and scroll widths, with no horizontal overflow.
- Light/system and dark layouts checked. Temporary viewport overrides reset; appearance restored to System.
- Initial audio state was paused, with no source assigned, and the answer hidden.
- A and B loaded their separate local files after clicks. Playback state, analyser-driven waveform bars, and nonzero chip energy were observed.
- Same-button stop, sequential A/B switching, keyboard volume change, mute, and blocked playback while muted checked.
- Reveal activated with Enter while muted. The result received keyboard focus; reset hid it and restored focus to the reveal control.
- Motion-off left chip energy at zero during playback. Playback was paused after leaving the player; scrolling away did not reveal the chip answer.
- Copper remained hidden until a deliberate choice; choosing the penny displayed its corresponding acknowledgment and copper comparison.
- Painting retained three static panels with motion off, and its direct one-pixel control remained usable.
- Final Listen/Stop labels verified through browser controls; no captured browser warnings or errors.

## Automated checks

- JavaScript syntax and CSS parsing passed.
- Lighthouse mobile simulation: performance 94, accessibility 100, best practices 100, SEO 100.
- LCP 3.1 s; CLS 0; total blocking time 0 ms.
- The initially flagged accessible-name mismatch was corrected by using the visible audio-button labels as their accessible names. Final label-content-name-mismatch score: 1.
- Full report: [lighthouse-crunch.json](lighthouse-crunch.json). Local Python server caching is not a production configuration.

## Limits

This verifies implementation in the in-app browser and a Lighthouse Chromium run, not every device or headphone setup. Background-tab and network-error handlers were inspected but not separately fault-injected. Native OS reduced-motion settings were not changed; the page’s manual reduced-motion path was exercised. No calibrated listening comparison or replication of the original study was conducted.

The generated chip and CC0 audio are documented in [asset provenance](assets/chip-audio.md). The opening position is a visual test. No independent reader session has occurred; see [the prepared protocol](../../editorial/2026-10-04-chip-visual-check.md).
