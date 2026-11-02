# Tandem fork of oh-my-pi

Tandem installs `@oh-my-pi/pi-coding-agent` (ACP agent id `omp`) from this
branch (`tandem` on https://github.com/aiguy110/oh-my-pi) to carry upstream ACP
PRs that are not merged yet.

- Baseline: `upstream` at `650f3a1082` (the 18.16.0 release commit, tag
  `v18.16.0`), so the published 18.16.0 natives addon matches the tree.
- Package name is unchanged (`@oh-my-pi/pi-coding-agent`); the entry point is
  `packages/coding-agent/src/cli.ts`.

## Carried changes

| Upstream PR | What it adds |
| --- | --- |
| [#12716](https://github.com/can1357/oh-my-pi/pull/12716) | ACP `usage_update` after each assistant message and compaction |
| [#14472](https://github.com/can1357/oh-my-pi/pull/14472) | ACP `allow_always` bash grants keyed on the exact command bytes plus cwd |
| [#14797](https://github.com/can1357/oh-my-pi/pull/14797) | Restore MCP tool routes before the first resumed ACP prompt |
| [#15043](https://github.com/can1357/oh-my-pi/pull/15043) | Subagents exposed as ACP subagent sessions (`subagent_update`, `session_message`) |

Tandem-only commits (never upstream):

- `chore(tandem): record carried ACP PRs in Unreleased changelogs`
- `fix(acp): settle the prompt after async follow-ups drain off the event chain`
  and `test(acp): expect per-command allow_always grants with pattern policies`
  — glue needed for the carried PRs to coexist.
- `fix(acp): address subagent sessions by the advertised session handle` —
  glue for #15043 on 18.14.2: upstream #17517 lets the durable session change
  under an ACP handle, so subagent ids key on `protocolSessionId`.
- `feat(acp): add a Yolo session mode that skips permission prompts` — a third
  ACP session mode beside Default and Plan (`AgentSession.setAcpYolo`); not yet
  proposed upstream.
- `build(tandem): fetch the published pi-natives addon before packing` —
  `scripts/tandem-fetch-natives.ts`, run via `bun run tandem:build` in
  `packages/coding-agent`; downloads the prebuilt addon for the workspace
  version (integrity-checked) since this fork carries no Rust changes.

## Upstream coverage

As of 18.16.0 none of the four PRs is merged and upstream has no equivalent
ACP changes (the existing end-of-prompt `usage_update` predates the fork).
18.14.2's ACP session-handle change (#17517) is adjacent but unrelated; the
carried PRs were adapted to address updates by `record.protocolSessionId`.

18.15.0 (#17384, `_omp/compaction/*` notifications) moved the lifetime event
subscription back into session creation, gated by `lifetimeUpdatesReady`, and
made `#handleLifetimeEvent` synchronous. On rebase, #14797's
`resumePromptUnsubscribe` and #15043's `subagents.dispose()` were kept
alongside upstream's new dispose steps; #15043's interim root-IRC branch in
`#handleLifetimeEvent` is dropped by its own later commit, which routes root
IRC through the subagent stream instead.

18.16.0 rewrote the ACP runtime validators in `packages/utils/src/acp/schema.ts`
from hand-written type guards to arktype (`@oh-my-pi/omptype`) schemas. On
rebase, #15043's `subagent_update` / `session_message` checks were re-expressed
as arms of upstream's `SessionUpdate` union (optional `title`, `description`,
`state`, `senderSessionId`, `recipientSessionId`, typed `content`), plus a
`SubagentWorkState` narrow for idle `stopReason`/`error` and a notification-level
narrow rejecting a `subagent_update` that names its own parent session.

18.15.0 and later require Bun >= 1.4.4 at startup (`cli.ts`); run the tests and
the ACP server with Tandem's Bun (`~/.tandem/bun/bun`), not an older system Bun.

## Retiring the fork

Retire once all four PRs (or equivalents) ship in a release:

    tandem acp upstream omp --constraint '^<version>'
