# Vehicle documents in fleet workstations

Implemented locally on 17 September 2026. These changes have not been deployed.

## Delivered behaviour

The admin Fleet Workstation and owner Bus Workstation Documents tabs now show the registration uploads: front, side, rear and interior vehicle photos; fitness certificate; insurance; bluebook; and route permit. Uploaded images have thumbnails and a larger preview. PDFs have a preview dialog. Downloads reuse the same authenticated file blob. Unsupported browser image formats remain downloadable. Missing uploads, individual loading failures, retry actions, review status, rejection reasons, policy number and recorded expiry dates are handled separately for each file.

The owner operational workstation uses its existing live-bus entry conditions. Drafts and review corrections continue through the registration flow.

## Request and cache flow

1. Document descriptors arrive with the existing owner fleet-detail response or admin workstation overview response. Opening Documents adds no separate metadata request.
2. Files are fetched through the existing authenticated document-view routes only when Documents is opened. On a cold cache, each uploaded file needs its own stream request: a complete registration typically has four photo requests and four legal-document requests.
3. Versioned blobs are stored in memory and IndexedDB with a 30-minute reuse window. Reopening Documents and refreshing the browser reuse those files while the records are valid and present. Concurrent requests for the same file share one download.
4. Refresh details rechecks existing workstation metadata. Unchanged uploads retain their cached files, including when review labels change. A replacement changes the file version and downloads only that changed file.
5. Logout, session invalidation and account changes clear the file cache. Cache keys include the application, API origin, account, active role, fleet/file path and upload version. Same-origin tabs receive cache-clear broadcasts. Late downloads and pending disk writes cannot restore a signed-out session's files.

A hard refresh can still request authenticated session/workstation metadata. The change prevents repeatedly downloading the document files; it does not disable authorization or eliminate all API traffic.

Memory and persisted caches each have a 128 MiB budget; files over 20 MiB are not retained by the blob cache. Expiry, eviction, unavailable browser storage, or files without a trustworthy upload version can require another download. Storage failures fall back to memory. Existing uploadedAt values version older private legal uploads; undated legacy files remain uncached. Existing public-URL legacy records remain subject to the backend's existing migration restrictions.

## Backend changes

- Added a server-generated UUID version to every legal-document upload/replacement in both current lifecycle and legacy secure upload services. Existing image upload UUIDs identify photo versions.
- Exposed safe versions and corrected photo IDs in the shared descriptor mapper without exposing private storage keys or public download URLs.
- Validated requested versions after existing actor/ownership checks. Mismatches return HTTP 409 before accessing storage, preventing a replacement from being cached under an older version.
- Consolidated admin streaming with the existing shared response helper. Verified versioned streams use private 30-minute HTTP caching and vary by authorization/cookie while preserving existing Origin variation. Unversioned streams retain no-store behaviour. Safe media restrictions and existing response security headers remain in place.

No new routes, dependencies, global rate-limit changes, or database backfill are required.

## Source locations

Both frontend repositories contain `src/features/vehicle-documents/blob-cache.ts` and `DocumentGallery.tsx`. The owner adapter is `OwnerDocumentGallery.tsx`; the admin adapter is `src/pages/admin/fleets/workstation/DocumentsTab.tsx`. Existing auth/logout handlers clear the shared file cache. Backend code stays within the fleet document lifecycle, storage service, schema and shared read-contract mapper.

## Branches

| Repository | Existing active branch |
| --- | --- |
| shuvmarg_busowner_web | feature/busowner-web-enhancements |
| shuvmarg_super_admin | codex/admin-manage-service-workspace |
| buss-booking-system-backend | codex/admin-crew-workstation-data |

No new branch was created for this implementation. The working trees already contain other work; this report covers the Documents feature only.

## Validation

- Owner: 143 tests passed, including eight new cache tests; production build passed; focused lint passed.
- Admin: 30 tests passed, including eight new cache tests; production build passed; focused lint passed. The build retains its existing large bundle warning.
- Backend: 141 fleet document, fleet management, workstation and fleet read tests passed, including six new version/cache tests.
- A temporary local browser fixture exercised the actual gallery and IndexedDB with synthetic image/PDF blobs: initial file loader count 2; tab close/reopen 2; full browser reload 2; review-status update 2; insurance replacement 3; cache clear followed by second account 5. Photo preview and keyboard dismissal were checked; the PDF preview dialog opened. The fixture and browser tab were removed afterward.
- Live authenticated uploads and actual storage-backed PDF rendering were not exercised against staging/production in this task. Deployment validation should open an existing registration in both apps and confirm its files render and the protected streams retain owner/admin authorization.
