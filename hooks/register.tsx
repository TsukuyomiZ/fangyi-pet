import type { ElementTable, EngineInterface, Register } from 'claude-code'

import type { Mood } from '../types'
import { STATUS_LABEL, fangyiStatusSvg, fangyiSvg } from './fangyi-svg'
import { sprite } from './pixel-sprites'

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

// What the band says while only background work runs.
const BACKGROUND_LABEL = '背景執行中'

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
// Background commands still running, by the tool_use_id that started them,
// with when they started; each ends with a task-notification naming that id.
const background = new Map<string, number>()
// A background command whose notification never came is forgotten after this.
const BACKGROUND_MAX_MS = 3 * 60 * 60 * 1000

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
    for (const [toolUseId, startedAt] of background) {
      if (updatedAt - startedAt > BACKGROUND_MAX_MS) {
        background.delete(toolUseId)
      }
    }
    await $.fs.write(
      file,
      JSON.stringify({ id, state, folder, prompt, agents: agents.size, background: background.size, updatedAt }),
    )
  } catch (error) {
    // The pet is a nicety: a failed write never disturbs the session, but
    // says why once.
    if (!isReported) {
      isReported = true
      $.ui.toast(`桌寵狀態寫入失敗：${error instanceof Error ? error.message : String(error)} (${file})`)
    }
  }
}

// Whether the terminal draws pictures (the kitty graphics protocol: kitty,
// Ghostty); every other terminal gets coloured half-block cells.
let drawsPictures: boolean | undefined

async function terminalDrawsPictures($: EngineInterface): Promise<boolean> {
  if (drawsPictures === undefined) {
    try {
      const term = (await $.env.get('TERM')) ?? ''
      const program = ((await $.env.get('TERM_PROGRAM')) ?? '').toLowerCase()
      const kitty = await $.env.get('KITTY_WINDOW_ID')
      drawsPictures = term === 'xterm-kitty' || kitty !== undefined || program === 'ghostty'
    } catch {
      // Unknown: half-block cells draw in any true-colour terminal.
      drawsPictures = false
    }
  }

  return drawsPictures
}

// One headshot in the terminal: its PNG where pictures are drawn, its
// hand-drawn pixel sprite otherwise, both in the sprite's box of cells.
function headshot(t: ElementTable<'terminal'>, name: string, root: string, pictures: boolean) {
  const art = sprite(name)
  if (pictures) {
    const png = name === 'avatar' ? 'fangyi-speaking.png' : `${name}.png`
    return (
      <t.Image
        key={name}
        source={{ file: `${root}/terminal-art/${png}`, format: 'png' }}
        columns={art.columns}
        rows={art.rows}
        alt=" "
      />
    )
  }

  return <t.Raster key={name} columns={art.columns} rows={art.rows} cells={art.cells} />
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
    // A background task's notification ends the commands it names.
    if (e.origin.kind === 'task-notification') {
      for (const match of e.text.matchAll(/<tool-use-id>([^<]+)<\/tool-use-id>/g)) {
        background.delete(match[1].trim())
      }
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
    } else if ((e.input as { run_in_background?: boolean }).run_in_background === true) {
      // A background sub-agent is counted by agent.spawn; anything else here.
      background.set(e.tool_use_id, await $.clock.now())
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

  // A turn stopping lists the background work still in flight: a count of
  // commands it no longer lists was missed and is dropped.
  on('classic.Stop', async ($, e, next) => {
    const stopped = await next(e)
    if (Array.isArray(e.background_tasks) && !e.background_tasks.some(task => task.type === 'shell')) {
      background.clear()
      await setState($, last, true)
    }

    return stopped
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
  on('ui.render', { component: 'AssistantMessage' }, async ($, e) => {
    if (e.surface === 'terminal') {
      const t = $.ui.resolve(e)
      const isFirst = e.props.isFirstOfReply
      const pictures = await terminalDrawsPictures($)

      // The avatar opens a reply; its later blocks keep the bubble in line.
      return (
        <t.Box flexDirection="row" alignItems="flex-start" gap={1}>
          {isFirst ? headshot(t, 'avatar', $.plugin.root, pictures) : <t.Box width={sprite('avatar').columns} />}
          <t.Box flexDirection="column" flexGrow={1} flexShrink={1} borderStyle="round" borderColor={LIME} paddingX={1}>
            {isFirst && (
              <t.Text bold color={LIME}>
                {NAME}
              </t.Text>
            )}
            <t.Markdown text={e.props.text} />
          </t.Box>
        </t.Box>
      )
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
    // After the turn, background work keeps the band up: she works on.
    const inBackground = !e.props.isWorking && (background.size > 0 || agents.size > 0)
    if ((!e.props.isWorking && !inBackground) || e.props.hasSurvey || last === 'answering') {
      return next(e)
    }
    const mood = inBackground ? 'working' : BAND_MOOD[last]
    const label = inBackground ? BACKGROUND_LABEL : STATUS_LABEL[mood]
    const withCompanions = agents.size > 0
    const counts = [
      background.size > 0 ? `背景指令 ×${background.size}` : '',
      agents.size > 0 ? `sub-agent ×${agents.size}` : '',
    ].filter(Boolean)
    const detail = counts.length > 0 ? counts.join(' · ') : last === 'working' ? tool : ''

    if (e.surface === 'terminal') {
      const t = $.ui.resolve(e)
      const pictures = await terminalDrawsPictures($)
      // The headshots only where the band has the rows for them.
      const fits = e.props.maxRows >= sprite(`fangyi-${mood}`).rows
      const root = $.plugin.root

      return (
        <t.Box flexDirection="row" alignItems="flex-end" gap={1}>
          {fits && withCompanions && headshot(t, 'panda', root, pictures)}
          {fits && headshot(t, `fangyi-${mood}`, root, pictures)}
          {fits && withCompanions && headshot(t, 'mifu', root, pictures)}
          <t.Box flexDirection="column" borderStyle="round" borderColor={LIME} paddingX={1} alignSelf="center">
            <t.Text bold color={LIME}>
              {label}…
            </t.Text>
            {detail !== '' && <t.Text dimColor>{detail}</t.Text>}
          </t.Box>
        </t.Box>
      )
    }

    const { Box, Svg } = $.ui.resolve(e)
    const status = fangyiStatusSvg(mood, detail, withCompanions, label)

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
