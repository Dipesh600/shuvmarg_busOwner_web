# Bus owner request caching and rollout

## Behavior

- The persistent dashboard layout owns SessionContext. Settings, business profile and the dashboard shell read the shared session.
- Profile and KYC responses are shared for five minutes, so external KYC reviews become visible without requiring logout. Fleet and trip lists are shared for one minute.
- Concurrent consumers share requests and receive independent response bodies. Errors are not cached as successful data.
- Successful writes invalidate shared reads. Explicit refresh bypasses snapshots and publishes fresh data to the root session. Concurrent explicit refreshes share one request; late responses use the latest dashboard state.
- Logout and token changes invalidate caches. Late responses cannot repopulate invalidated snapshots.
- The fleet list embeds canonical setupStatus for approved vehicles. Readiness calculations run with at most four vehicles in flight, preserving list order and ownership authorization. This removes per-vehicle HTTP calls; canonical database reads still run per vehicle.
- Fleet cards receive front-image metadata in the list, removing the extra detail request to discover each image. Actual image downloads are separate HTTP requests and use the existing persistent thumbnail cache.
- Visible dashboards refresh no more than once a minute. Focus events respect that interval. Hidden tabs and active rate-limit cooldowns skip background refreshes.
- A 429 starts a cooldown using Retry-After (seconds or HTTP date); absent headers use a one-minute fallback. No writes are queued or replayed. A throttled token refresh preserves the login session.
- CORS exposes Retry-After and rate-limit headers. The global 200-request / 15-minute IP limiter and authentication limiters retain their existing policies.

## Verification

Automated request-count fixture exercises the actual frontend dashboard and auth modules:

- 10 approved buses, 50 simultaneous/repeated visits: four core HTTP requests, zero setup-status HTTP requests.
- 50 visits per minute across 15 simulated minutes: 36 core HTTP requests. Image downloads and other dashboard endpoints are outside this count.
- Explicit refresh sees a changed KYC approval. An older ordinary refresh cannot replace the newer result.
- 130 frontend tests pass, including auth refresh, logout, invalidation, expiry, cooldown and request-count coverage.
- 97 backend read-contract, CORS and auth-limiter tests pass, including real local HTTP integration.
- Production build passes with TypeScript validation. Lint covers the files changed for this fix.
- Local production-server browser smoke check: protected Fleet redirects to the rendered login page without console errors.

The reporting/workspace extension and its latest checks are documented in [the delivery report](bus-owner-delivery-report.md). Core request counts exclude selected-resource reads, image downloads and business actions.

## Rollout

Deploy backend first, then frontend. Existing per-bus setup endpoints remain available to older clients. The new frontend expects embedded readiness and thumbnail metadata from the backend.

Before promotion, use an authenticated staging operator with multiple approved buses:

1. Open Overview, My Buses and Trips repeatedly within one minute. Check that Profile/KYC do not repeat and My Buses issues no per-bus setup-status or image-metadata detail requests.
2. Save a fleet/route/crew change and verify updated readiness after refresh, including the shared dashboard header.
3. Change KYC in staging and verify explicit refresh immediately and background refresh within the five-minute session window.
4. Logout, sign in as another operator, and verify no previous operator data is shown.
5. Exercise a controlled staging 429. Verify Retry-After is readable, background requests pause, token refresh does not log the operator out, and requests resume after cooldown.
6. Confirm server logs and response latency for an operator with a large fleet. Readiness database work is bounded, but still grows with fleet size.

Live authenticated staging verification is pending a staging URL and session. These changes have not been deployed or committed automatically.
