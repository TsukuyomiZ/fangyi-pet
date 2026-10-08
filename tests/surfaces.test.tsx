import { expect, mock, test } from 'claude-code/testing'

const PLUGIN = 'fangyi-pet'

const reply = (isFirstOfReply: boolean) =>
  ({ component: 'AssistantMessage', props: { text: '好的，這是回覆。', isFirstOfReply } }) as const

const band = (maxRows: number) =>
  ({
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: true, maxRows, bodyColumns: 100 },
  }) as const

test('the terminal draws her headshot beside the reply', async ($, on) => {
  mock.env(on, { TERM: 'xterm-256color' })
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...reply(true) })
  expect(await ui.find({ key: 'avatar' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /莊芳宜/ })).toBeDefined()
  await ui.unmount()
})

test('a later block of the reply keeps the bubble without the headshot', async ($, on) => {
  mock.env(on, { TERM: 'xterm-256color' })
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...reply(false) })
  expect(await ui.find({ key: 'avatar' })).toBeUndefined()
  await ui.unmount()
})

test('the terminal band shows her headshot and the status', async ($, on) => {
  mock.env(on, { TERM: 'xterm-256color' })
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...band(20) })
  expect(await ui.find({ key: 'fangyi-thinking' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /思考中/ })).toBeDefined()
  await ui.unmount()
})

test('a short terminal band keeps the status and drops the headshot', async ($, on) => {
  mock.env(on, { TERM: 'xterm-256color' })
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...band(4) })
  expect(await ui.find({ key: 'fangyi-thinking' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /思考中/ })).toBeDefined()
  await ui.unmount()
})

test('the desktop still draws the reply and the band as pictures', async $ => {
  for (const target of [reply(true), band(20)]) {
    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', ...target })
    expect(await ui.find({ type: 'Svg' })).toBeDefined()
    await ui.unmount()
  }
})

test('a kitty terminal gets the PNG headshot instead of cells', async ($, on) => {
  mock.env(on, { TERM: 'xterm-kitty' })
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...reply(true) })
  expect(await ui.find({ type: 'Image', key: 'avatar' })).toBeDefined()
  await ui.unmount()
})

test('with no environment to read, the terminal still draws cells', async $ => {
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...reply(true) })
  expect(await ui.find({ type: 'Raster', key: 'avatar' })).toBeDefined()
  await ui.unmount()
})

test('a background command keeps the band up after the turn', async ($, on) => {
  mock.env(on, { TERM: 'xterm-256color' })
  mock.clock(on)
  // Beneath the plugin, the command starts and returns at once.
  on('tool.call', () => ({ result: 'Command running in background with ID: b1' }))
  await $.tool.call({ tool: 'Bash', input: { command: 'sleep 60', run_in_background: true } })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({
      plugin: PLUGIN,
      surface,
      component: 'AbovePrompt',
      props: { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 100 },
    })
    if (surface === 'terminal') {
      expect(await ui.find({ type: 'Text', text: /背景執行中/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /背景指令 ×1/ })).toBeDefined()
    } else {
      expect(await ui.find({ type: 'Svg' })).toBeDefined()
    }
    await ui.unmount()
  }
})
