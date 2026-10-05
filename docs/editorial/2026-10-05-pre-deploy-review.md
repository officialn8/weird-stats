# Pre-deploy review follow-up

## Public access and release status

On October 5, a plain anonymous GET to https://weird-stats.vercel.app/ returned HTTP 200 with no authentication redirect. The 16,309-byte response exactly matches the original release HTML: SHA-256 `0cc8fc4afb0d5d51602ba5b666e1e0995531e158a8034791dbace8802776fe3a`. The production homepage is public. Corrected the hosting, baseline and roadmap evidence notes; future production deployments must be treated as immediately public.

No new content approval, release or deployment is recorded by this follow-up. Four pending proposals remain: the chip headline/guess/reveal; the mail share headline; the painting share headline; and the new Senate comparison. Copper's existing editorial copy is already in the pinned baseline. A chat response accepting the exact proposals will be recorded through the existing decision command; elapsed time and this implementation are not approval.

## Changes

- Share images now use the official static Outfit Bold font, with true weight 700 and no outline to simulate thickness. Existing chip, penny/nickel, mule and painting imagery is converted in memory and embedded. Generic discoveries retain a type-based question card until they have appropriate owned artwork. Image selection never reads from a different entry's proposal.
- Each exact local review preview now has its own share PNG. The review desk leads with those images, the proposed headline, a short change summary and the exact preview link. Raw diffs and revision identifiers are collapsed. No hosted admin system or approval shortcut was added.
- Copper follows the same pattern as chips and generic guesses: choose without revealing, then use the reveal action. Selected state and a live announcement make that distinction clear. Direct reveal and reset remain available.
- Sharp is a pinned-lockfile build dependency, not a browser script. Static Outfit Bold is a build asset; the website's variable font is unchanged.

Design-taste was applied as a preservation pass on the share graphics: a playful discovery site for curious readers, using the existing orange and bold object-led composition. DESIGN_VARIANCE 7, MOTION_INTENSITY 1 (PNG artwork is static), VISUAL_DENSITY 3. Existing artwork and routes were preserved; generic circles and outlined typography were removed. Existing approved copy was not rewritten to satisfy unrelated style rules.

## Verification

All 71 tests pass, including static-font table inspection, scene-owned share imagery, bounded long-question layout, collapsed private review diffs, and guess-without-reveal behavior. Both public and review builds pass. Approval A versus unreleased B remains covered across HTML, metadata, PNG and CSV.

Visually inspected all four custom share PNGs. Browser checks covered desktop review cards, 390-pixel mobile review and copper, keyboard reveal, selected feedback, and console output. Both mobile pages fit their viewport and console warnings/errors were empty. The local check does not establish new hosted routes or actual social-network preview behavior. No Lighthouse run was needed for the static PNG composition; browser-level performance on a deployed release remains unmeasured.

Keep the pending proposals separate from any deployment. Daily drafts still require review, and the next production release still needs explicit direction.
