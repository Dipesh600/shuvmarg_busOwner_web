# Bus owner workspace delivery report

Date: 16 September 2026. Status: implemented in the local working trees; release acceptance remains pending.

## Branches and delivery status

| Repository | Active branch | Delivery |
| --- | --- | --- |
| Backend: buss-booking-system-backend | codex/admin-crew-workstation-data | Changes made on this existing branch |
| Frontend: shuvmarg_busowner_web | feature/busowner-web-enhancements | Changes made on this existing branch |

No new branch, commit, deployment or external report submission was performed. Both working trees also contain other work; the full diff must not be treated as this task's exclusive contribution.

## What was built

| Area | Result |
| --- | --- |
| Operating Overview | Nepal service-date selector; departure, ticket and recorded booking-sales totals; distinct booked seats per departure; departures; missing crew alerts; latest bookings; unfinished bus setup links. Existing onboarding remains for owners without an operational bus. |
| Fleet sales | Existing trip responses carry recorded booking statistics. Cards sum all non-cancelled departures for the bus on today's Nepal service date. Missing/failed statistics show unavailable. Demo plate totals, estimated fares and invented route/timetable defaults were removed. |
| Bus detail | Actual owner-scoped detail/readiness reads and the existing bus-specific route, crew, schedule, publication and recovery setup workspace replace the placeholder. Read errors stop operational controls. |
| Trips | Actual date-filtered departures, selected-trip seat configuration reads, bookings/manifest links and the existing scoped live-service change workflow. Fare/seat configuration is read-only in the page; changes continue through passenger-impact preview and domain validation. |
| Bookings | Departure-date/status filters, pagination, ticket details, limited passenger contact information, recorded refund state and a paginated active-booking departure manifest. |
| Finance | Paginated recorded settlements; pending/processing, paid and received net totals; gross/commission/net amounts; completed-departure settlement requests by operator; owner receipt confirmation. Existing platform review and payout evidence rules remain authoritative. |
| Business Profile | Actual owned operator brands and their actual status; corrected Finance link; Business Details replaces the missing Add Operator destination. |
| Request controls | Shared root session, deduplicated reads, one-minute operational caches, five-minute profile/KYC snapshots, mutation invalidation and Retry-After cooldowns are preserved. Date-filtered trips and reporting reads share these caches. Crew and agent polling use a minute interval, focus throttling and cooldown checks. Fleet uses embedded crew names instead of loading two crew directories, and skips protected trip reads until business approval. |

## Reporting rules

- Metric basis: active bookings for departures on the selected service date, including bookings purchased earlier. This is **not** purchases made today.
- Only Booking.status = booked contributes to primary tickets/sales. pending, cancelled and no_show counts remain separate. Boarding is a boolean; confirmed/boarded/completed were not invented as Booking statuses.
- Cancelled departures are excluded from daily headline/card totals, but remain visible in the departures table.
- Tickets count booked seats. Amounts use recorded post-discount totalAmount, rounded and summed in integer paisa. Invalid active booking amounts fail reporting rather than produce sample totals.
- Seats with bookings counts unique seat labels per departure. Reuse across route segments does not double-count a physical seat. This percentage is not peak segment occupancy or current seat availability.
- Asia/Kathmandu determines today's calendar date. Trip.tripDate uses the existing UTC-midnight service-date encoding; real purchase timestamp boundaries are kept distinct.
- Booking sales, collected payments and settlement payouts remain separate. Refund details show the recorded refund state; this release does not invent a payment reconciliation or net-earnings ledger.
- Valid empty reporting results show zero; failed/missing reporting shows an explicit error or unavailable state.

## API organization and contracts

New backend files live in src/modules/bus-owner/reporting/, separated into route/controller registration, workspace service/repository, booking statistics, trip enrichment and date/pagination policy. The frontend uses src/features/owner-workspace/ for shared API types, resource loading and reporting screens. Existing fleet, crew, schedule, KYC and settlement modules continue to own their commands.

| API under /api/busowner | Contract |
| --- | --- |
| GET /overview?date=YYYY-MM-DD | Owner daily summary, departures, fleet totals, attention and latest bookings |
| GET /bookings?from=...&to=...&status=...&tripId=...&page=...&limit=... | Owner-scoped booking list; date range up to 91 days, page limit up to 100 |
| GET /bookings/:bookingId | Owner-scoped ticket, limited passenger data and linked refund |
| GET /trip-manifest/:tripId?page=...&limit=... | Owner-scoped active-booked passenger manifest, paginated |
| GET /finance?page=...&limit=... | Owner recorded settlement rows and all-date status totals |
| GET /getMyTrips?from=...&to=... | Existing array response enriched with ticketsSold, totalRevenue, occupiedPlaces, bookingCounts, salesBasis and currency; optional bounded departure dates |
| POST /raiseSettlement | Existing reviewed settlement request command, now rejects invalid, duplicate and more than 100 trip IDs |
| PATCH /markSettlementReceived | Existing receipt command, now atomic paid→received and retry-safe; cannot overwrite a dispute |

Reports are registered below authentication, current DB account/role checks and approved KYC. Actor ownership comes from the verified session, never an ownerId query parameter. Responses exclude passenger identity-document numbers, payment secrets and private payout evidence/storage keys. Refund references must also belong to the requested booking.

## Request impact

The automated fixture exercises actual frontend auth/dashboard/trip modules with ten approved buses:

- Fifty repeated/concurrent core visits need four cold reads and zero per-bus setup-status requests.
- Fifty visits per minute over fifteen simulated minutes need 36 core reads.
- Fleet sales add no reporting HTTP request: they use the enriched trip list already loaded by Fleet.
- Overview, Bookings and Finance add their own cached page read. Opening a selected ticket, manifest or bus detail intentionally reads that resource.

The web app's common fleet/trip list covers the previous 30 and next 60 service dates. Trips can select another range up to 91 days; settlement requests default to the preceding 90 days and can select another range. Older clients that omit dates retain the historical trip-array behavior. Booking aggregation batches at most 500 trip IDs per query; there is no per-trip HTTP loop.

Image downloads and other business actions are outside the core request-count fixture. Readiness still performs canonical per-bus database work with at most four vehicles in flight. The existing 200-request/15-minute IP limiter was not disabled or raised; these changes reduce unnecessary traffic, not guarantee that a legitimate limiter can never return 429.

## Validation

- Frontend automated tests: 135 passed, zero failures. Includes actual-module multi-bus request counts, cache expiry/invalidation, logout, token refresh/cooldown, monetary daily sales and selection of active departures.
- New backend reporting integration tests: 9 passed against a real temporary MongoDB replica set and local HTTP routes with the actual authentication/DB-role/KYC middleware. Covers ownership, private-field filtering, Nepal dates, multiple departures, seat reuse, booking statuses, cents, pagination, invalid inputs, refund linkage, trip enrichment and concurrent/idempotent receipt confirmation.
- Selected backend regression tests: 31 passed, including owner read contracts, protected route registration, CORS throttling headers, concurrent settlement claims, independent payout review and rollback/refund integrity.
- Final production build passed with TypeScript validation. Focused lint passed with zero errors or warnings for the reporting, trip, fleet, profile, auth and staff integration files checked. Both repositories passed diff whitespace checks.

## Remaining release and product work

1. Authenticated staging acceptance with a multi-bus owner: navigation, schedule/publication recovery, sales fixtures, owner switching, request counts and a controlled 429. No staging session was available for this task.
2. Backend-first rollout followed by frontend deployment. Older per-bus setup APIs remain compatible; the frontend expects enriched fleet/trip responses.
3. Measure large-fleet database latency and deprecate/paginate the undated legacy historical trip list when its other clients can migrate. New web reads use bounded dates.
4. Additional operator-brand creation and reviewed company/bank editing are separate flows; the broken creation link was removed rather than creating an unreviewed legal/payout identity mutation.
5. Automated bank transfer, payment reconciliation, purchase-day sales, peak segment occupancy and a standalone reports/export product are not implemented or claimed here.

## Final build status

Passed: npm run build (Next.js production build, TypeScript validation and generation of all 19 pages). Stale staff-profile references were corrected to the replacement screen components already present in the shared workspace; the profile-screen design/refactor itself belongs to other work.

All selected checks completed successfully: 135 frontend tests, 9 new reporting integration tests and 31 backend regression tests. This establishes local verification, not authenticated staging or production acceptance.
