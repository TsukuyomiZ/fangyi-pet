import type { EngineInterface, Register } from 'claude-code'

import type { Mood } from '../types'
import { fangyiStatusSvg, fangyiSvg } from './fangyi-svg'

const NAME = '莊芳宜'
const LIME = '#c8d400'

// What this session is doing, written to ~/.claude/desktop-pet/sessions/<id>.json
// for the desktop pet (~/.claude/desktop-pet/pet.ps1) to read, and drawn in the
// band above the prompt while a turn runs. One file per session; written only
// when the state changes.
type PetState = 'idle' | 'thinking' | 'working' | 'answering' | 'waiting' | 'done' | 'ended'

// The session's state, as her pose in the band.
const BAND_MOOD: Record<PetState, Mood> = {
  idle: 'thinking',
  thinking: 'thinking',
  working: 'working',
  answering: 'speaking',
  waiting: 'waiting',
  done: 'done',
  ended: 'idle',
}

const PROMPT_CHARS = 18

// Where a prompt the person typed comes from: the terminal, a remote
// surface, or a host app such as the desktop.
const PERSON_ORIGINS = new Set(['composer', 'bridge', 'sdk'])

// The band's drawing is laid out at 160px tall; this scales it on screen.
const BAND_SCALE = 0.5

let file = ''
let folder = ''
let prompt = ''
let id = ''
let tool = ''
let last: PetState = 'idle'
let isReported = false
// The sub-agents running now, by agent id; while any run, the companions show.
const agents = new Set<string>()

// The mod lives under ~/.claude, so its own folder names ~/.claude; the
// environment is the fallback.
async function claudeDir($: EngineInterface): Promise<string> {
  const own = $.plugin.root.replaceAll('\\', '/')
  const at = own.lastIndexOf('/.claude/')
  if (at >= 0) {
    return own.slice(0, at + '/.claude'.length)
  }
  const home = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME')) ?? ''
  return `${home.replaceAll('\\', '/')}/.claude`
}

async function locate($: EngineInterface): Promise<void> {
  if (file) {
    return
  }
  id = await $.session.id()
  file = `${await claudeDir($)}/desktop-pet/sessions/${id}.json`
  const name = (await $.session.root()).replaceAll('\\', '/').split('/').filter(Boolean).at(-1) ?? ''
  // The app's scratch folders have no meaningful name; the prompt labels those.
  folder = name.startsWith('scratch-') ? '' : name
}

async function setState($: EngineInterface, state: PetState, force = false): Promise<void> {
  if (state === last && !force) {
    return
  }
  last = state
  $.ui.invalidate('ui.render')
  try {
    await locate($)
    const updatedAt = await $.clock.now()
    await $.fs.write(file, JSON.stringify({ id, state, folder, prompt, agents: agents.size, updatedAt }))
  } catch (error) {
    // The pet is a nicety: a failed write never disturbs the session, but
    // says why once.
    if (!isReported) {
      isReported = true
      $.ui.toast(`桌寵狀態寫入失敗：${error instanceof Error ? error.message : String(error)} (${file})`)
    }
  }
}

// Applies a change to the running sub-agents and rewrites the state if the
// count moved.
async function changeAgents($: EngineInterface, change: () => void): Promise<void> {
  const before = agents.size
  change()
  if (agents.size !== before) {
    await setState($, last, true)
  }
}

// Drops any counted sub-agent the engine no longer lists as running, in case
// its end was missed.
async function reconcileAgents($: EngineInterface): Promise<void> {
  try {
    const running = new Set((await $.agent.list()).filter(agent => agent.status === 'running').map(agent => agent.id))
    await changeAgents($, () => {
      for (const agentId of agents) {
        if (!running.has(agentId)) {
          agents.delete(agentId)
        }
      }
    })
  } catch {
    // The count is a nicety; a failed listing leaves it as it was.
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await setState($, 'idle')

    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    // Only what the person typed labels the session; a sub-agent's report, a
    // notification or a schedule starts a turn but keeps the label.
    if (PERSON_ORIGINS.has(e.origin.kind)) {
      prompt = e.text.trim().split('\n')[0].slice(0, PROMPT_CHARS)
    }
    await setState($, 'thinking', true)

    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const stream = next(e)
    if (e.agentId !== undefined) {
      return yield* stream
    }
    for await (const chunk of stream) {
      if (chunk.kind === 'text') {
        await setState($, 'answering')
      } else if (chunk.kind === 'thinking') {
        await setState($, 'thinking')
      }
      yield chunk
    }

    return await stream.result
  })

  on('tool.call', async ($, e, next) => {
    // A sub-agent's own tool calls are its business, not the session's state.
    if (e.agentId !== undefined) {
      return next(e)
    }
    tool = e.tool
    await setState($, e.tool === 'AskUserQuestion' ? 'waiting' : 'working', true)
    const ran = await next(e)
    if (e.tool === 'Agent') {
      await reconcileAgents($)
    }
    await setState($, 'thinking')

    return ran
  })

  // A sub-agent starting: counted until its own turn completes.
  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    const agentId = started.agentId
    if (agentId !== undefined) {
      await changeAgents($, () => agents.add(agentId))
    }

    return started
  })

  // A permission dialog is about to be shown: the session waits on the person.
  on('classic.PermissionRequest', async ($, e, next) => {
    await setState($, 'waiting')

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    const agentId = e.agentId
    if (agentId !== undefined) {
      await changeAgents($, () => agents.delete(agentId))
    } else {
      await reconcileAgents($)
      await setState($, 'done', true)
    }

    return done
  })

  on('session.end', async ($, e, next) => {
    await setState($, 'ended')

    return next(e)
  })

  // Each block of a reply: her avatar, speaking, beside a speech bubble.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.surface === 'terminal') {
      return next(e)
    }
    const { Box, Text, Markdown, Svg } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" alignItems="flex-start" gap={1}>
        <Svg source={fangyiSvg('speaking', 'bust')} alt={`${NAME}, speaking`} width={64} />
        <Box
          flexDirection="column"
          flexGrow={1}
          flexShrink={1}
          borderStyle="round"
          borderColor={LIME}
          paddingX={1}
        >
          {e.props.isFirstOfReply && (
            <Text bold color="#6c8a26">
              {NAME}
            </Text>
          )}
          <Markdown text={e.props.text} />
        </Box>
      </Box>
    )
  })

  // While a turn runs, the band above the prompt shows her pose and a large
  // status label (the spinner row is too short to show either legibly).
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // While answering, the reply itself is on screen: nothing to add.
    if (e.surface === 'terminal' || !e.props.isWorking || e.props.hasSurvey || last === 'answering') {
      return next(e)
    }
    const { Box, Svg } = $.ui.resolve(e)
    const mood = BAND_MOOD[last]
    const withCompanions = agents.size > 0
    const detail = withCompanions ? `sub-agent ×${agents.size}` : last === 'working' ? tool : ''
    const status = fangyiStatusSvg(mood, detail, withCompanions)

    return (
      <Box flexDirection="row" alignItems="center">
        <Svg
          source={status.source}
          alt={withCompanions ? `${NAME}、熊貓、弭弗, ${mood}` : `${NAME}, ${mood}`}
          width={Math.round(status.width * BAND_SCALE)}
          height={Math.round(status.height * BAND_SCALE)}
        />
      </Box>
    )
  })
}
