# Session timeout policy

Sessions currently expire after 30 minutes of inactivity. This document proposes
moving to a sliding window with a hard ceiling.

## Proposed limits

| Setting          | Today  | Proposed |
| ---------------- | ------ | -------- |
| Idle timeout     | 30 min | 20 min   |
| Absolute ceiling | none   | 12 hours |
| Refresh grace    | none   | 60 s     |

<!-- annotation
id=c1 author="anchit.rao" created="2026-08-27T16:52:00Z" line=7
exact="12 hours" prefix="dle timeout 30 min 20 min Absolute ceiling none " suffix=" Refresh grace none 60 s Implementation sketch c"

Is 12h defensible? SOC2 reviewers asked about this last time.
-->

## Implementation sketch

```ts
const IDLE_TIMEOUT = 20 * 60 * 1000;

function isExpired(session: Session, now: number): boolean {
  return now - session.lastSeen > IDLE_TIMEOUT;
}
```

<!-- annotation
id=c2 author="anchit.rao" created="2026-08-27T16:52:00Z" line=22
exact="IDLE_TIMEOUT" prefix="esh grace none 60 s Implementation sketch const " suffix=" = 20 * 60 * 1000; function isExpired(session: S"

Pull this from config rather than hard-coding it.
-->

## Open questions

- Should the ceiling apply to service accounts?
- What happens to a websocket that outlives its session?
- Do we need a grace period for in-flight requests?

<!-- annotation
id=c3 author="anchit.rao" created="2026-08-27T16:52:00Z" line=39
exact="service accounts" prefix="T; } Open questions Should the ceiling apply to " suffix="? What happens to a websocket that outlives its "

They should be exempt — they have no interactive session.
-->

<!-- annotation
id=c4 author="claude" created="2026-08-27T12:40:00Z" reply-to=c3

Agreed. Concretely:

1. Exempt anything with `grant_type=client_credentials`
2. Keep the **idle** timeout for interactive sessions only
3. Log an audit event either way

```ts
if (session.isServiceAccount) return false;
```

> Matches how [the platform docs](https://example.com) describe it.
-->

> Rollout is gated on the audit log work landing first.

