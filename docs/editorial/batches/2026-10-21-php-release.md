# PHP release — October 21, 2026

Nate authorized the exact reviewed discovery with “Cool lets get it live.” The approved packet is `ca5d88f6b74272c320361fa74d42a119da91f507e47bfc8df6a5e584964786a1`; its content digest is `5f585c725b94676e676cef43a901796835e15929463b5b0ae7b5d77d87e078f5`.

The release was prepared from current main (`55af86e`), retaining all nine existing release pins and adding PHP as the newest discovery. Its reviewed fragment, CSS, JavaScript and illustration are unchanged. The integration adds the approved assets and registers the main answer disclosure with current analytics; opening the cutaway is excluded from evidence-open events. Approval, release authorization and first-release evidence are stored by the review-packet CLI.

Primary material was checked again on October 21: the [PHP release notice](https://www.php.net/archive/2026.php#2026-10-21-1), [unfinished-state advisory](https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w), [stale-state advisory](https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp), and [addy.io incident account](https://addy.io/blog/addy-io-went-offline-for-the-php2shell-vulnerability/). The page retains the demonstrated Apache/mod_php scope and worker-permission limit. No new security claim was added during release preparation.

Preflight passed: content validation (11 records, 44 assets), all 138 tests, public and review builds, release-pin preservation, and generated public-output checks. The public build contains ten discoveries with PHP first and no review routes. Local browser checks at measured 820×702 and 680×375 confirmed unobscured keyboard focus and readable labels; no horizontal overflow or console errors were observed. These are emulated viewport checks, not physical-device or screen-reader verification.

The Git deployment path will build the merged main commit on Vercel. Production status and marked QA observations are recorded after deployment in the automation memory; this document records preflight, not a claim that deployment already completed. No audience launch window or measured creator-review duration is inferred from this release.
