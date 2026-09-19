# Fleet media controls, replacement and reminders

## Changes

- Fixed the owner/admin Upload video control: it now opens the file picker without requiring a file to be selected first. After selecting a valid video, Save video uploads it. Existing videos expose Replace video. Processing/uploading still prevents a competing upload.
- Video descriptors remain in the existing Documents response. READY video playback/posters and the registration photos appear together in Documents. Video download remains deferred until Play, with the existing account/version-scoped persistent cache.
- Added individual Replace image controls and a Replace all photos editor in both workstations. The four-photo editor handles old/incomplete records. New mutation descriptors update the gallery immediately, and changed image IDs/version paths invalidate the displayed asset without downloading unchanged media again. Owner-side replacement of the front photo also invalidates the thumbnail and updates the workstation hero.
- Added dedicated, authorized photo replacement routes. These permit photo changes on approved/pending fleets while preserving fleet approval and recorded registration/legal review state. Scanning, transformation, size/signature validation, audit history, optimistic concurrency, failure cleanup, and preservation of unchanged asset/scan metadata remain enforced. Approved legal-document replacement retains its existing restrictions.
- Added durable video-introduction reminder jobs, grouped and deduplicated per operator. The enabled worker finds registered fleets without a video/active upload, rechecks account and fleet state before sending, creates one in-app notice with an Open Documents link, and sends device push through the existing FCM integration. Successful devices are excluded from retries; invalid tokens are removed; failures retry at most five times. Drafts, uploaded/processing media, inactive/deleted accounts and revoked owner roles are skipped.
- The Documents link now opens the owner Documents tab and also works for a fleet awaiting approval or operational setup.

## Branches

Existing branches were retained: backend `codex/admin-crew-workstation-data`, owner `feature/busowner-web-enhancements`, admin `codex/admin-manage-service-workspace`. No commit, push, or deployment was performed. Other ongoing workspace changes were preserved.

## Validation

- Owner: 152 tests passed, including control rendering before file selection, processing locks, photo selection limits, notification destination validation and existing account/cache tests.
- Admin: 35 tests passed, including the same video-control and photo-policy checks.
- Backend: 164 policy/regression/notification/protocol checks plus 23 integration tests passed. New integration checks exercise real MongoDB photo updates, retained legal/registration approval, retained other photo metadata and scan proofs, owner/admin authorization, infected uploads, concurrent update cleanup, legacy photo migration, reminder enrollment grouping, delivery deduplication, upload-before-delivery cancellation, revoked-role filtering, partial push retries, invalid-token cleanup and bounded outage retries. FCM outcomes and object storage are injected; no real recipient was contacted by tests.
- Both production frontend builds and focused lint checks passed. Existing admin bundle-size warning remains.
- Browser automation could not initialize because its browser request-header policy was unavailable. This follow-up verifies rendered button enabled/disabled states and backend flows; it does not claim a new interactive browser/file-picker test.

## Live delivery and release requirements

At the time of the original follow-up, the local backend environment had video uploads disabled and lacked ClamAV/FCM configuration. Accordingly, **no live operator reminder was sent during that follow-up**. Deploy/configure the scanner, private media worker and Firebase credentials, pass the existing readiness checks, then enable `FLEET_VIDEO_ENABLED=true`. The worker enrolls existing eligible operators on startup and delivers reminders; hourly enrollment recovers missed candidates without repeating the campaign for each bus.

Device push requires an existing registered FCM token. The owner website receives the in-app notice; browser OS push subscription/permission was not added. Provider sends can repeat after an acceptance/progress-persistence crash; the stable notification ID supports deduplication. See backend `docs/fleet-video-operations.md` for routes, worker deployment, capacities, privacy and monitoring requirements.


## Video preview and upload follow-up

- Latest size instruction is implemented as a **20 MB maximum (20,000,000 bytes)**. Registration, owner/admin selection validation, backend streamed multipart parsing, storage/output bounds and new reminder text agree. Empty files and files one byte above the limit are rejected. MP4/MOV and the two-minute restriction remain.
- Owner/admin Documents now show a local selected-file preview marked Not saved yet, followed by Save video, Change video and Cancel. Selection makes no upload request. A failed save preserves the selection for retry; successful save/cancel/replacement/unmount releases the preview URL. Registration also previews the selected video before the wizard is submitted.
- Fixed the screenshot's local playback failure by adding `media-src 'self' blob:` to the owner security response headers and admin deployment policy. Earlier browser verification with a generated H.264 MP4 showed the frame and three-second duration, no unsupported-format message, and zero submitted uploads before Save. The temporary verification pages/media were removed before production builds. The original browser limitation recorded above applied to the preceding follow-up.
- Video upload/status responses now tolerate non-JSON error pages and report actionable HTTP/server errors instead of JSON parsing exceptions. Successful envelopes must contain a valid video descriptor; empty/HTML/malformed success bodies cannot clear the user's selection or silently mark a video as saved. Registration's video upload uses the same response handling. Tests cover proxy size/rate-limit/outage responses, disabled-upload messages and valid HTTP 202 responses. The specific user-reported failing HTTP response was not captured, so these checks do not identify its upstream HTTP status.
- Reduced the conversion ceiling to 1 Mbps video plus 96 kbps audio. A real two-minute synthetic video passed FFmpeg conversion, retained its duration and fit within 20 MB; the test scanner was injected. Existing persistent playback cache still allows historical videos up to 50 MB to avoid repeated downloads of media accepted under the former policy.
- Validation: **157 owner tests, 39 admin tests and 10 focused backend policy/parser/transcoder tests passed**. Both production builds, focused frontend lint and tracked diff checks passed. Admin retains its existing bundle-size warning.
- Existing branches were retained; nothing was committed, pushed or deployed. At the time of that preview/upload validation, local video uploads remained disabled and the scanner was unconfigured; the subsequent local setup below resolves those two items. Configure the scanner and worker, run deployment readiness checks, then enable uploads. This change does not bypass scanning or claim a successful upload to the live bucket.


## Local services enabled and verified

- Completed the requested local setup: real ClamAV scanner runs privately on `127.0.0.1:3311`, with production scan capacities and the full-file capacity-test signature. The existing scanner on port 3310 was left unchanged. Its definitions are linked from the installed ClamAV database and should continue to be maintained with freshclam.
- Verified a full 20 MB inspection, real FFmpeg conversion/output scans, MongoDB replica-set support, and an encrypted S3 put/get/delete round trip. Unsigned access to the test object was denied. No scanning was bypassed.
- Set the ignored local backend environment to `FLEET_MALWARE_SCAN_MODE=required`, configured the loopback scanner and 120-second scan deadline, and set `FLEET_VIDEO_ENABLED=true` only after readiness passed. Started the durable worker and restarted the local API on port 7012. Protected runtime logs/PID files/environment backup are under the backend's ignored `tmp/fleet-media/` directory.
- Verified the real HTTP owner upload returned 202, reached READY with a real clean ClamAV scan proof, and served playable MP4, JPEG poster and byte-range requests. A real HTTP admin replacement also reached READY, changed the version, rejected the old version with 409 and retained APPROVED fleet status. Unauthenticated media reads returned 401. Only synthetic test identities/bus/media were used; successful test records and object keys were removed afterward.
- Added repeatable backend commands: `npm run setup:fleet-media:local`, `npm run preflight:fleet-media -- --local`, and `npm run smoke:fleet-video:local`. Local setup/readiness refuse production mode or a remote MongoDB target. Local setup reuses the dedicated scanner/worker and recognizes the repository's API before restarting it.
- Twelve focused backend tests passed, including loopback/production-mode guards, exact 20 MB parsing, oversized/chunked requests, and real two-minute compression. Script syntax checks passed.
- This enables **local development**, not production deployment. macOS conversion uses the existing development runner; production continues to require Linux/Bubblewrap isolation and managed services. Background local processes need the setup command again after machine restart. The enabled worker also schedules local in-app campaign reminders; Firebase is not initialized in this local environment, so no successful external device push is claimed.
- Existing branches are retained. No commit, push or remote deployment was performed.
