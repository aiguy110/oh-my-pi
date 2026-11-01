# Tandem fork of oh-my-pi

Tandem installs `@oh-my-pi/pi-coding-agent` (ACP agent id `omp`) from this
branch (`tandem` on https://github.com/aiguy110/oh-my-pi) to carry upstream ACP
PRs that are not merged yet.

- Baseline: `upstream` at `7efd772193` (the 18.14.2 release commit, tag
  `v18.14.2`), so the published 18.14.2 natives addon matches the tree.
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
- `build(tandem): fetch the published pi-natives addon before packing` —
  `scripts/tandem-fetch-natives.ts`, run via `bun run tandem:build` in
  `packages/coding-agent`; downloads the prebuilt addon for the workspace
  version (integrity-checked) since this fork carries no Rust changes.

## Upstream coverage

As of 18.14.2 none of the four PRs is merged and upstream has no equivalent
ACP changes (the existing end-of-prompt `usage_update` predates the fork).
18.14.2's ACP session-handle change (#17517) is adjacent but unrelated; the
carried PRs were adapted to address updates by `record.protocolSessionId`.

## Retiring the fork

Retire once all four PRs (or equivalents) ship in a release:

    tandem acp upstream omp --constraint '^<version>'
