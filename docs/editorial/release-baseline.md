# Original release baseline

Verified October 4, 2026 during roadmap implementation. This records an existing release; it is not a new editorial approval or deployment authorization.

- Vercel deployment: `dpl_AoBGxucc2gA6qZfeGf18ikTc7iaF`
- Deployment URL: `https://weird-stats-813b3vzdt-nathaniels-projects-cc0e35b9.vercel.app`
- Production alias reported by Vercel: `https://weird-stats.vercel.app`
- Vercel state: Ready, production; created October 4, 2026 at 20:45:36 America/Chicago.
- Retrieved `/` through the existing authenticated Vercel CLI, following the Vercel CLI skill. The connector lacked project-scope access; the already-authenticated CLI succeeded. The authenticated fetch did not establish anonymous access. The earlier statement that the production alias was protected was incorrect; see the October 5 anonymous check below.
- Retrieved HTML: 16,309 bytes, exactly equal to `git show 0edaeec:public/index.html`.
- SHA-256: `0cc8fc4afb0d5d51602ba5b666e1e0995531e158a8034791dbace8802776fe3a`.

The initial hosting record in [hosting setup](../hosting.md) states that the 15 public files matched the approved visual prototype. The later `d0bd7d6` content records carry the existing hosted edition forward. Together with this exact HTML comparison, these records establish which scene copy was released. This check does not grant fresh approval to later local edits or independently reverify the factual claims and asset rights.

Migration must compare each current scene's editorial content with this baseline. In particular, the current chip question, optional guess UI, and reveal wording postdate the hosted copy. Keep those editorial changes as proposals until an actual human decision. Runtime and layout repairs may carry forward through code review only when their extracted editorial content remains unchanged.


## Anonymous production check, October 5, 2026

A plain unauthenticated HTTP GET to https://weird-stats.vercel.app/ returned HTTP 200 without a login redirect. Its 16,309-byte HTML has the same SHA-256 recorded above, including the old “volume knob” headline and “15 of 20” hero. This verifies that the existing production homepage is public. It does not verify new discovery/share routes that have not been deployed. Treat any production deployment as immediately public, including metadata and share images. Preview protection is a separate setting and must be checked on the exact preview URL.
