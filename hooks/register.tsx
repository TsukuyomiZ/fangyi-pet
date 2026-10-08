import type { EngineInterface, Register } from 'claude-code'

import type { Mood } from '../types'
import { fangyiSvg } from './fangyi-svg'

const NAME = '莊芳宜'
const LIME = '#c8d400'

// The spinner's mode, as one of her poses.
const SPINNER_MOOD: Record<string, Mood> = {
  requesting: 'idle',
  thinking: 'thinking',
  responding: 'speaking',
  'tool-input': 'working',
  'tool-use': 'working',
}

// What this session is doing, written to ~/.claude/desktop-pet/sessions/<id>.json
// for the desktop pet (~/.claude/desktop-pet/pet.ps1) to read. One file per
// session; written only when the state changes.
type PetState = 'idle' | 'thinking' | 'working' | 'answering' | 'waiting' | 'done' | 'ended'

const PROMPT_CHARS = 18

let file = ''
let folder = ''
let prompt = ''
let id = ''
let last: PetState | '' = ''
let isReported = false

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
  try {
    await locate($)
    const updatedAt = await $.clock.now()
    await $.fs.write(file, JSON.stringify({ id, state, folder, prompt, updatedAt }))
  } catch (error) {
    // The pet is a nicety: a failed write never disturbs the session, but
    // says why once.
    if (!isReported) {
      isReported = true
      $.ui.toast(`桌寵狀態寫入失敗：${error instanceof Error ? error.message : String(error)} (${file})`)
    }
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await setState($, 'idle')

    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    prompt = e.text.trim().split('\n')[0].slice(0, PROMPT_CHARS)
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
    await setState($, e.tool === 'AskUserQuestion' ? 'waiting' : 'working')
    const ran = await next(e)
    await setState($, 'thinking')

    return ran
  })

  // A permission dialog is about to be shown: the session waits on the person.
  on('classic.PermissionRequest', async ($, e, next) => {
    await setState($, 'waiting')

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId === undefined) {
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

  // The row that runs while a turn works: her thinking or working pose.
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    if (e.surface === 'terminal') {
      return next(e)
    }
    const { Box, Text, Svg } = $.ui.resolve(e)
    const mood = SPINNER_MOOD[e.props.mode] ?? 'thinking'
    const words = e.props.message ?? e.props.word

    return (
      <Box flexDirection="row" alignItems="center" gap={1}>
        <Svg source={fangyiSvg(mood, 'bust-wide')} alt={`${NAME}, ${mood}`} width={88} />
        <Text italic dimColor>
          {words}
          {e.props.suffix}
        </Text>
      </Box>
    )
  })
}
