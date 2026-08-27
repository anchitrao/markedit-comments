# Session timeout policy

Sessions currently expire after 30 minutes of inactivity. This document proposes
moving to a sliding window with a hard ceiling.

## Proposed limits

| Setting          | Today  | Proposed |
| ---------------- | ------ | -------- |
| Idle timeout     | 30 min | 20 min   |
| Absolute ceiling | none   | 12 hours |
| Refresh grace    | none   | 60 s     |

## Implementation sketch

```ts
const IDLE_TIMEOUT = 20 * 60 * 1000;

function isExpired(session: Session, now: number): boolean {
  return now - session.lastSeen > IDLE_TIMEOUT;
}
```

## Open questions

- Should the ceiling apply to service accounts?
- What happens to a websocket that outlives its session?
- Do we need a grace period for in-flight requests?

> Rollout is gated on the audit log work landing first.
