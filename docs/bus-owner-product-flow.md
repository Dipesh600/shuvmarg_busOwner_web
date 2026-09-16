# Bus owner product flow

Status: original flow/design draft. The selected departure-day reporting flow is now implemented; see [the delivery report](bus-owner-delivery-report.md) for the implemented contract, validation and remaining work. Historical proposal text below documents the starting design, not current implementation status.

## Product flow

Account and business details → KYC review → fleet review → operational setup → publication → daily operations.

Fleet drafts and route discovery can be prepared while KYC is pending. Fleet submission requires approved business KYC. Business approval, fleet approval and service publication are separate states; none should stand in for another.

| Owner state | Overview content | Primary action | Transition |
| --- | --- | --- | --- |
| KYC not submitted | Business information and missing verification requirements | Submit business verification | KYC under review |
| KYC pending | Submitted information, review status and saved fleet drafts | Continue preparing a bus | Approval or changes required |
| KYC changes required | Review reason and correction requirements | Correct and resubmit | KYC under review |
| KYC approved, no approved buses | Fleet drafts and review status | Add a bus or finish a saved draft | Fleet review |
| Fleet changes required | Vehicle-specific review reason and required corrections | Correct that vehicle | Fleet review |
| Approved bus, incomplete setup | Readiness checklist for that bus | Resume first incomplete requirement | Ready to publish |
| Publication preparing or failed | Actual publication state and recovery instructions | Wait or retry the supported recovery action | Active or requires attention |
| At least one operational bus | Proposed operating Overview plus unfinished buses needing attention | Manage today's operations | Ongoing operations |

The operating Overview must coexist with onboarding for additional buses. Activating the first bus should not hide remaining fleet work.

## Screen responsibilities

| Existing screen | Responsibility | Data and actions | Empty/error behavior |
| --- | --- | --- | --- |
| Overview | Guide onboarding now; proposed daily operations summary after launch | Shared profile/KYC, fleet readiness; proposed departures, booking totals and attention list | Show actual missing requirements; failed reporting is unavailable, not zero |
| Business Profile | Company identity and business navigation | Company name and KYC from SessionContext; detailed information in Settings | Verification state and link to the relevant action; never infer operational status from company identity |
| Settings → Profile | Read business identity and submitted verification information | Owner/contact details, address, registration/PAN and protected document viewing | Separate absent submissions from failed requests; show review reasons |
| My Buses | Fleet lifecycle and bus-specific actions | Draft, pending, changes required, approved and publication/readiness states | No buses: add bus; saved draft: resume; partial setup: complete requirements |
| Bus detail | Work on one owned vehicle | Route/timings, crew, schedules, publication and supported recovery | Authorization/not found handled explicitly; show blocking reasons before activation |
| Trips | Daily departures and schedules | Owner-scoped trips and supported operational actions | No departures today differs from no schedules; preserve errors |
| Bookings | Tickets and passenger booking records | Authorized booking/manifest information and permitted actions | No bookings versus unavailable data |
| Staff | Crew identity and assignments | Drivers/conductors and their vehicle/trip assignments | Missing crew should point to assignment rather than fabricated names |
| Finance | Financial reporting | Booking sales, discounts, refunds, commissions and settlements as distinct figures | Never label gross booking totals as available payout |

Every mutation must be checked on the backend for actor role, ownership and domain state. Frontend action visibility is guidance, not authorization.

## Operational setup

Use the canonical readiness calculation: route approved → stops and timings configured → driver assigned → conductor assigned → required schedule pair created → service published/activated.

Show actual publication states rather than treating schedule creation as successful publication. Route, crew or schedule changes must follow existing operational-change and recovery rules.

## Sales definitions to settle before implementation

Recommended fleet-card wording: **Today's departures: X tickets · NPR Y booking sales**.

This proposed figure sums qualifying bookings for every trip of that bus departing on the selected Nepal calendar day. It includes bookings purchased earlier for those departures. One selected activeTrip is insufficient when the bus has multiple departures.

A separate metric, **Sales booked today**, counts purchases on the selected Nepal calendar day, including purchases for future departures. The purchase timestamp must be chosen from the actual booking/payment lifecycle; do not silently equate creation with payment completion.

Use Asia/Kathmandu, with an inclusive start and exclusive end. Response metadata should identify the date, timezone and metric basis.

Booking statuses in the current schema: booked, cancelled, pending, no_show. Establish explicitly how no_show and refunds contribute to each metric. Do not introduce confirmed/boarded/completed as Booking statuses. Boarding confirmation is stored separately.

Count seats, not booking documents. Use actual recorded amounts; never multiply seats by a default fare to produce reported revenue. Gross booking sales, collected payments, net earnings and settlements need separate definitions and sources.

Missing/failed reporting: unavailable. Successful aggregation with no qualifying bookings: zero. Remove number-plate demo totals and occupancy-based estimates when wiring real reporting.

## Backend and fetching design

Organize by business capability: routes → controllers → services → repositories → response mappers. Reuse booking reporting between trip enrichment, bus daily summaries and Overview.

Keep getMyTrips for its current consumers. A proposed reporting module can enrich authorized trips in one aggregation without per-trip HTTP calls. Bound date ranges/list sizes before aggregating an owner's entire history; maintain the existing response contract for existing clients.

A proposed owner-scoped Overview summary can return operational totals, departures and issues together. It should not duplicate profile/KYC fetching or contain independent copies of financial rules.

Retain session caching, one-minute shared operational reads, request deduplication, save invalidation and Retry-After cooldowns from the earlier fix. Reporting must not restore the frontend N+1 pattern.

## Known gaps and implementation order

1. Confirm metric basis, no-show/refund treatment and the timestamp used for purchase-day reporting.
2. Correct Business Profile's unfinished Add Operator destination, financial navigation destination and hardcoded Active badge. Decide whether this screen represents the owner business or multiple operator brands before adding creation UI.
3. Align frontend capability flags with supported backend actions and actual fleet readiness. The current deriveCapabilities helper still sets trip, booking, finance and report access to false; approved KYC alone is not sufficient to determine all operations access.
4. Implement shared reporting and test ownership, empty results, multiple trips per bus, Nepal day boundaries, cancellations, pending bookings, no-shows and monetary rules.
5. Wire truthful fleet-card totals and remove sales estimates.
6. Replace operating Overview filler with departures, defined sales/occupancy metrics and actionable readiness/crew/publication issues. Keep onboarding for owners and buses that still need it.
7. Verify request counts, cache invalidation and authenticated staging behavior before promotion.

## Decisions still open

- Fleet-card metric: tickets for today's departures (recommended draft) or purchases made today.
- No-show, cancellation and refund treatment per reported metric.
- Authoritative timestamp for paid/completed sales and monetary source for collected payments.
- Meaning of Add Operator: additional operator brand or another business account.
- Which operational actions are available to each owner state, aligned with backend enforcement.

This draft documents the flow without changing application behavior. Implementation starts after these decisions are resolved.
