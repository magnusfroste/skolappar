# Architecture rules

- Reuse a shared app-thumbnail component across card variants so screenshot and fallback behavior stays consistent.
- Keep password recovery on a public dedicated route and retain PASSWORD_RECOVERY state in the auth provider so lazy loading cannot lose the recovery event.
- Profile reads must allow owners/admins and public contributors, not enumerate inactive accounts; retain recipient access to notification senders.
