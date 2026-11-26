# Tandem fork of oh-my-pi

Tandem installs `@oh-my-pi/pi-coding-agent` (ACP agent id `omp`) from this
branch (`tandem` on https://github.com/aiguy110/oh-my-pi) to carry upstream ACP
PRs that are not merged yet.

- Baseline: `upstream` at `b55cd1bb66` (the 19.2.1 release commit, tag
  `v19.2.1`), so the published 19.2.1 natives addon matches the tree.
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

As of 19.2.1 none of the four PRs is merged and upstream has no equivalent
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

18.17.0 moved `unwrapHashlineHeaderPath` into `tools/hashline-header-path.ts`
(no longer exported from `plan-mode-guard.ts`); #15043's ACP write-target
normalization now imports it from there. 18.17.0's worker-thread subagents and
ACP changes otherwise rebased cleanly.

18.18.0 rebased cleanly with no conflicts; its ACP-adjacent changes
(`display.shellVisualization` trace omission, subagent MCP grant routing) do
not overlap the carried PRs.

18.18.1 rebased cleanly with no conflicts; it has no ACP changes.

18.18.2 added `deferAgentInitiatedTurns` to the ACP client bridge, which
conflicted with #15043's subagent stream setup; both were kept. 18.18.2 also
(#18400) holds a frozen tool-roster change out of a prefix-bound prompt, so
`refreshBaseSystemPrompt()` re-renders the held roster and kept #14797's
resumed session without MCP routes. #14797 now passes
`refreshBaseSystemPrompt(undefined, { absorbHeldRoster: true })` (a new
`SessionTools`/`AgentSession` option, folded into its commit) while no provider
turn has run since resume.
18.18.2's new ACP follow-up test (`agent-session-async-delivery.test.ts`)
expected a follow-up chunk while an earlier `sessionUpdate` was still held;
#12716 delivers prompt updates in arrival order, so the glue commit
`fix(acp): settle the prompt after async follow-ups drain off the event chain`
moves that assertion after the held update is released.

18.18.3 rebased cleanly with no conflicts; its changes (html form elicitation
for `ask`, zsh/shell perf, todo phase defaults) do not overlap the carried PRs.

18.18.4 and 18.18.5 rebased cleanly with no conflicts; neither touches the ACP
mode or ACP schema code.

18.18.6 rebased cleanly with no conflicts; its only ACP change records the
plan-approval mode change in the session log and does not overlap the carried
PRs.

18.18.7 rebased cleanly with no conflicts; it has no ACP changes (saved-reset
auto-redeem settings, LiteLLM usage budgets, Windows shell fixes, catalog rows).

18.18.8 rebased cleanly with no conflicts; it has no ACP changes (Claude
usage-block healing, browser/natives fixes, a reverted publish tool, catalog
rows).

18.18.9 rebased cleanly with no conflicts; it has no ACP changes outside
an `acp-builtins` test (OAuth account selection, catalog rows, misc fixes).

18.19.0 rebased cleanly with no conflicts; its only ACP change drops the
`blocked` todo status from the ACP plan mapper, and its task-tool rework
(`task.steps`, removed `task.file`) does not overlap #15043's subagent sessions.

18.20.0 rebased cleanly with no conflicts; its ACP changes (`ask` form "Other"
box placement, surfacing client errors from a failed `ask` form) do not overlap
the carried PRs.

18.20.2 (18.20.1 had no ACP-relevant changes) conflicted twice in
`acp-agent.ts`. Upstream fd497cbddd/1e20decfee now bill the end-of-turn
`usage_update` with the session's subagent-tree cost (`#sessionTreeCost`);
#12716's `#emitUsageUpdate` keeps upstream's helpers and uses that tree cost
for its mid-prompt sends too. Upstream 623e1fac34 passes `promptTurn` to
`#waitForAcpPromptIdle` and returns early once a follow-up turn's `agent_end`
settled the prompt; the glue commit's `#finishPromptAfterIdle` now does the
same, both after the idle wait and after the event chain drains. #15043's
test import of `MAIN_AGENT_ID` was merged into upstream's new `AgentRegistry`
import.

18.20.3 rebased cleanly with no conflicts; its ACP changes (form elicitation
message no longer repeats field questions, `mcp.startupTimeoutMs` honored for
client-declared MCP servers) do not overlap the carried PRs.

18.21.0 rebased cleanly with no conflicts; its only ACP-adjacent change
(b44ae71d27, rescoping project-discovered capabilities on `/move`) does not
overlap the carried PRs.

19.0.0 (867 commits since 18.21.0, including 18.22.x) rebased cleanly with no
conflicts. Its ACP-adjacent changes (`tools/acp-bridge.ts`, intent tracing off by
default in ACP sessions) do not overlap the carried PRs. Its
`executeBash` zsh-PTY-prompt test (#17210) fails locally on plain `v19.0.0` too,
so it is environmental, not fork-caused.

19.1.0 rebased with no conflicts but broke #14797's regression test twice.
Upstream de21c0ac45 renamed the prompt section `## MCP Tool Routes` to
`## MCP Tool Commands`, and 19.1.0's MCP host caches discovery per upstream
across managers in one process, so the resumed ACP session reused the first
session's tool list and never hit the late-tools path. The test (folded into
#14797's commit) now matches the new heading and resumes against a distinct
server URL path so discovery runs afresh; with the fork's
`absorbHeldRoster` refresh disabled both cases still fail, so #14797 remains
needed.

19.1.1 (575 commits) rebased with no conflicts and no ACP-mode changes, but
`McpServer` now types badly through an object spread of a union member, so
#14797's regression test (folded into its commit) spells out the resumed
HTTP server literal instead of spreading `servers[0]`. Its browser-relay
(`browser-background-input`, `browser-relay-tab-isolation`) and
`transcript-presenter` test failures reproduce on plain `v19.1.1` locally, so
they are environmental, not fork-caused.

19.2.0 moved the TUI-facing modules that 19.x had relocated into `@oh-my-pi/pi-tui`
back into coding-agent (`modes/view-model/*`, `session/transcript/*`,
`tools/html-form/*`, `task/session-observer-registry`). The carried commits'
imports were re-pointed at the new paths (#12716: `ContextUsage` from
`modes/view-model/status-line/types`, in `acp-agent.ts` and its test; #15043:
`EventBus` beside upstream's local `canonicalizeMessage`, and
`unwrapHashlineHeaderPath` beside upstream's local `TodoStatus`). #15043 also
returns `subagentEventBus` from upstream's reshaped ACP session factory in
`main.ts` (now with scoped-model refresh), and the Yolo mode is pushed after
upstream's new `--no-tools` Plan-mode gate. On 2026-11-25 upstream's stale bot
closed #12716 and #14797 unmerged (branches kept); they would need reopening for
the fork to retire.

19.2.1 (117 commits) rebased cleanly with no conflicts. Its only ACP change
(saved Copilot 1M models surviving session load/resume during a background
catalog refresh) does not overlap the carried PRs. #14472 and #15043 remain
open; #12716 and #14797 remain closed unmerged.

18.15.0 and later require Bun >= 1.4.4 at startup (`cli.ts`); run the tests and
the ACP server with Tandem's Bun (`~/.tandem/bun/bun`), not an older system Bun.

## Retiring the fork

Retire once all four PRs (or equivalents) ship in a release:

    tandem acp upstream omp --constraint '^<version>'
