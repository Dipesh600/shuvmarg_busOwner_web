# Bus owner implementation inventory — pre-build audit

This records the starting state before this implementation. See [the delivery report](bus-owner-delivery-report.md) for what was built and tested.

This is a source-code audit of the current working trees, not an authenticated live acceptance test. "Wired" means the frontend calls real backend code; it does not imply every business scenario is complete or verified in production.

Frontend branch: feature/busowner-web-enhancements. Backend branch: codex/admin-crew-workstation-data. Working trees contain uncommitted changes.

## Implemented or wired

| Area | Frontend evidence | Backend evidence | Assessment |
| --- | --- | --- | --- |
| Business verification | BusinessSetupModal submits KYC; FirstLoginOverview handles not-submitted, pending, rejected and approved states | KYC submission, protected document reads, admin review and effective status modules | Real onboarding flow exists; validate review/correction lifecycle in staging |
| Profile/settings | Settings profile shows identity, company/address, submitted documents and timestamps; payout tab displays recorded bank data | Owner-scoped profile read joins User and BusOwner; KYC status exposes sanitized descriptors | Read/display exists; not a complete company/bank editing flow |
| Authentication | Login/registration, account activation/reset/security screens; authenticated fetch and logout helpers | Modular bus-owner login, registration, session and password-reset code | Existing implementation; separate from reporting work |
| Fleet lifecycle | FleetRegistrationFlow and fleet APIs create/save drafts, upload documents, submit, correct rejected fleets and preview submissions | Fleet command/read modules and document-lifecycle routes; submission gated by approved KYC | Core preparation/review flow wired |
| Fleet readiness | My Buses and Overview use readiness/setup state and resume launch work | Owner fleet list embeds canonical setupStatus; individual detail/setup routes retained | Backend enrichment implemented; canonical per-bus database work remains, bounded to four vehicles in flight |
| Routes and timings | Setup and live-change components use route configuration/schedule APIs | Draft-safe route discovery, route configuration and operational-change routes | Wired; existing state/ownership rules must remain authoritative |
| Crew | Staff has crew/agents tabs; crew list/search/status/invitation/removal APIs; setup can assign current vehicle crew | Crew lookup, connection, driver/conductor invitation, vehicle crew and conductor-trip routes | Wired, not merely a placeholder |
| Schedule/publication | FirstFleetOperationsSetup and schedule-plan API handle paired schedules, recovery and publication | Schedule-plan draft/recovery/publish controller delegates to service-plan rules | Real launch workflow exists; bus detail itself does not host it yet |
| Trip operations | Trips loads trips and seat control; LiveServiceChangeModal previews/applies scoped changes | getMyTrips, seat-layout operational reads, live-change preview/apply/history | Wired but Trips is still locked in sidebar by current capability helper |
| Reusable seat layouts | Seat-layout studio has library, builder, revision submission and fleet assignment | Seat-layout-v3 routes and persistence modules | Existing feature, not a new build from scratch |
| Shared request controls | SessionContext, one/five-minute shared reads, deduplication, invalidation and 429 cooldown | Fleet enrichment and CORS exposure of Retry-After; existing IP limiter retained | Implemented for selected shared reads; not universal caching of all owner APIs |

## Partial or missing

| Area | What exists | What remains |
| --- | --- | --- |
| Operating Overview | Greeting, verification, setup progress, fleet readiness/resume actions and static/coming-up content | Owner-scoped daily summary, today's departures, defined sales/occupancy metrics, actionable operational issues and recent activity |
| Business Profile operator management | Company-based operator card and verify-business link; backend can list owned brands | Card does not load brands; Active is hardcoded; Add Operator points to a missing /dashboard/operators/new page; Financials points to /dashboard/financials instead of /dashboard/finance |
| Bus detail workspace | /dashboard/fleet/[fleetId] displays a fleet ID and placeholder message | Fetch actual bus details/readiness and provide bus-specific route, crew, schedule, publication and recovery workspace |
| Fleet sales | Card renders tickets/revenue; resolver reads optional trip fields but also hardcodes plate totals and estimates occupancy/fare | Authoritative reporting aggregation, defined day basis, all relevant trips per bus, unavailable/error handling, and removal of fabricated fallbacks |
| Trip reporting | getTripsByOwnerId currently queries/populates Trip only and returns the owner's unbounded historical list | Booking enrichment, date/list bounds and compatibility plan; no ticketsSold/totalRevenue aggregation is currently implemented there |
| Bookings workspace | Frontend is a static Locked/no-live-bookings screen; booking storage and other booking/manifest capabilities exist elsewhere | Owner-scoped list/detail/manifest contract, filters/pagination and real frontend wiring; do not expose an admin endpoint directly |
| Finance workspace | Frontend is a static Locked/no-settlement-activity screen | Wire existing settlement list/request/receipt capabilities after review; add defined sales/refund/commission/net/settlement summaries and transaction history |
| Settlement correctness/automation | Backend raiseSettlement/getMySettlements/markSettlementReceived code exists; raising checks completed owned trips and brand ownership and uses booked seats/recorded amounts | Full lifecycle/refund/idempotency review before promotion; no evidence here establishes automated bank payouts as complete |
| Access/navigation | Backend enforces role/ownership and approved KYC on operational routes | deriveCapabilities hardcodes trip, booking, finance and report access false; align enabled actions with actual supported functionality and fleet states |
| Truthful bus context | Resolver uses real route/timing when present | Still falls back to Kathmandu → Janakpur and 17:30–06:20 Daily; remove those defaults when displaying actual operating buses |
| Polling consistency | Root refresh skips hidden tabs and cooldowns and respects a minute gap | Crew list has separate 30-second polling plus focus refresh; consolidate throttling/deduplication across staff/agent queries as appropriate |
| Production acceptance | Earlier selected tests/build/type checks passed; local unauthenticated smoke check passed | Authenticated staging owner flow, multi-bus request counts, real reporting fixtures, and coordinated backend-first rollout |

## Build order

1. Correct trust and access gaps: fabricated sales/route/time values, wrong links, placeholder bus destination and capability mismatch. Preserve implemented setup flows.
2. Resolve reporting definitions: departure-day versus purchase-day, Asia/Kathmandu boundaries, no-show/cancellation/refund treatment, authoritative payment timestamp and gross-versus-net amounts.
3. Build reusable owner-scoped reporting (service/repository/response contract) and enrich existing trip responses without per-bus network calls. Wire fleet card totals across the relevant trips.
4. Build the bus detail workspace using existing detail/readiness/route/crew/schedule/publication APIs.
5. Build the operating Overview using one owner summary request, retaining onboarding for unfinished buses.
6. Build the real owner Bookings page and wire the Finance page to reviewed reporting/settlement APIs.
7. Consolidate polling and run authenticated staging acceptance before release.

The existing onboarding and launch foundation should be extended. The main missing product is the day-to-day owner workspace, not the entire backend.

## Evidence entry points

- Frontend pages: ../src/app/dashboard/
- Capability helper: ../src/features/operator-dashboard/operator-dashboard-contract.ts
- Fleet display fallbacks: ../src/features/operator-dashboard/fleet-operational-context.ts
- Staff polling: ../src/components/dashboard/staff/CrewMembersList.tsx
- Owner route registration: ../../buss-booking-system-backend/routes/busOwner/busOwner.js
- Trip read: ../../buss-booking-system-backend/services/tripService.js
- Owner fleet readiness read: ../../buss-booking-system-backend/src/modules/read-contracts/fleet/fleet-read.service.js
- Existing settlements: ../../buss-booking-system-backend/controllers/busOwnerController/settlementController.js
