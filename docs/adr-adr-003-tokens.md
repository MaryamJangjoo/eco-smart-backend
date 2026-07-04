# ADR-003: Token Security Model

## Decision
HttpOnly Secure Cookies only

## Reason
Prevents XSS token theft

## Impact
- No localStorage tokens
- No header-based JWT storage

## Trade-off
Requires CSRF protection