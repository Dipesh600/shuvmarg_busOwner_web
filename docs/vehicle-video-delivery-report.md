# Vehicle video delivery report

## Delivered

- Optional MP4/MOV upload in fleet registration with a 20,000,000-byte limit. Server validation also enforces a maximum two-minute duration and checks the actual media rather than trusting the filename.
- Existing owners and admins can upload or replace the vehicle video from their fleet workstation Documents tab, view its processing state/poster, play it, and download it.
- Playback downloads only after Play. Account/API/version-scoped IndexedDB caching reuses fresh video files across tab switches and full page refreshes for thirty minutes. Logout/account changes clear access; expiry or storage eviction allows a new fetch. Processing-only polling stops on unmount/completion and uses bounded backoff.
- A separate durable backend worker scans the original, validates it, converts to bounded MP4/H.264/AAC output, creates a poster, scans the outputs, and publishes private S3 assets atomically. Failed replacement leaves the current video available. Leases, immutable attempt objects, source hashes, retries, abandoned-upload repair, and cleanup protect recovery and concurrent execution.
- Closed the fleet scanning gap: current and legacy fleet image/document upload paths now invoke ClamAV before processing/storage and scan changed outputs. Production scanner failure blocks upload/publication. Stored image/document records retain hidden scan evidence and SHA-256. Historical files are not retroactively scanned by this release.

## Branches and scope

Work remains on the existing branches; no new branch, commit, push, or deployment was made:

| Repository | Branch |
| --- | --- |
| `buss-booking-system-backend` | `codex/admin-crew-workstation-data` |
| `shuvmarg_busowner_web` | `feature/busowner-web-enhancements` |
| `shuvmarg_super_admin` | `codex/admin-manage-service-workspace` |

These checkouts contain other ongoing changes. This report covers the video feature, its caching/UI, fleet file security scanning, and deployment support, rather than attributing every working-tree change to this feature.

Main backend additions live in `src/modules/fleet/video/`, `models/fleetVideoJobModel.js`, shared fleet scanner/ClamAV streaming support, and the fleet storage/document lifecycle integration. Frontend additions live in `src/features/vehicle-documents/`, their owner/admin adapters, and the owner registration file/draft/review flow. No new third-party package dependency was added.

## Verification

- Backend: 160 policy/regression/protocol tests and 12 integration tests passed. Integration used a MongoDB replica set, real FFmpeg/FFprobe, a synthetic private-object store, and injected scanner outcomes. It covers conversion, successful publication/cleanup, infected replacements, scanner outages/retry limits, exact retries/busy slots, stale worker leases, transaction rollback, abandoned uploads, HTTP authorization/multipart/ranges/version checks, source tampering, and crash reconciliation.
- Owner: 148 operator-dashboard tests passed, including the new video size/type and persistent-cache tests. Production build and focused lint passed.
- Admin: 32 operator tests passed, including the new video size/type and persistent-cache tests. Production build and focused lint passed. The existing large-bundle build warning remains.
- Browser: actual Documents video/cache components played a generated MP4 successfully with native controls. Local fixture file downloads went from one poster request to two after Play; a full refresh, replay, and tab switch kept that count at two. Temporary verification fixtures were removed afterward.
- Existing KYC scanner tests remain passing after sharing streamed ClamAV transport. Additional transport tests cover bounded frames and a daemon disconnect without a result.

The integration scanner outcomes and object store were injected: these tests do not claim the production ClamAV daemon, S3 policies, or Linux sandbox have been verified.

## Production enablement

The feature is implemented but **not deployed**. `FLEET_VIDEO_ENABLED` is opt-in. Apply the private scanner's full-size limits/signature, install the isolated Linux worker, confirm MongoDB transactions and private bucket/IAM access, then run readiness and real deployment smoke checks before enabling uploads. Production image/document scanning is mandatory and needs a working scanner during rollout, even if video is disabled.

The backend runbook is `docs/fleet-video-operations.md`; deployment templates and the harmless capacity signature are under `deploy/fleet-media/`. The runbook documents commands, environments, proxy limits, IAM/lifecycle requirements, monitoring, rollback-safe behavior, and the separate historical-file scan migration.
