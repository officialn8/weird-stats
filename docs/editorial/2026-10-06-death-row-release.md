# Death-sentence innocence release

Nate instructed “commit, push and merge” on October 6, 2026 after reviewing the polished discovery. This authorizes the exact reviewed content and its public release through the existing Vercel deployment from main.

- Review packet: `e33b5b27ea9db0d5b36378a5f8dfb7c0690122b46048a338457d0714cb5061b1`.
- Approved content digest: `054f397f9ef02bea6cb4159714c9c6439b18b8eedd059e4f80b1eae998099ae9`.
- The six previous release pins are preserved. The new discovery becomes the newest entry in the scrolling collection and feed.

The discovery presents Gross et al.’s 2014 estimate for U.S. defendants sentenced to death in 1973–2004. It keeps the 95% confidence interval and the model’s limits beside or directly accessible from the claim. It does not estimate innocent people executed or describe today’s death row. [Research notes](research/2026-10-05-death-row-innocence.md) preserve source access and methodological qualifications.

The original Three.js illustration begins with an imagined cell containing a seated anonymous figure, bed and closed barred door. The overview contains 1,000 fixed schematic cells; pale cells illustrate 41 at the estimate or 28/52 at interval endpoints. These are neither identified cases nor actual facilities. Controls are native and keyboard accessible, the scene renders on demand without autoplay, and factual text remains readable without WebGL. [Local design record](../design/death-row-innocence.md) covers the treatment and MIT dependency provenance.

Local validation: all 116 tests passed, content checks passed, and both public and review builds succeeded. Browser inspection covered desktop, narrow mobile, intermediate widths, both views, rate selection, keyboard range endpoints, expanded evidence and dark appearance. The pre-polish independent Impeccable reviewer returned ship; the requested polish received a separate bounded browser check. Forced context loss and JavaScript-disabled browsing were not separately exercised.

Release verification checks the public discovery, newest-first ordering and seven-entry output, then the deployment tied to the merged commit. Production browser checks must start at `?qa=1` under the launch-analytics procedure. A missing scene, broken controls or incorrect public content warrants restoring the prior deployment. Other private research candidates and ideation remain outside this release.
