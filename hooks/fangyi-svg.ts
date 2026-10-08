import type { Mood } from '../types'

// A chibi drawing after Zhuang Fangyi: red antlers, long black hair with a red
// streak, green eyes, pointed ears, white top with an olive chest band, black
// gloves, wide olive trousers, a green tassel. Arms, eyes and mouth change per
// mood; a thought cloud, a holo panel or a speech bubble is added beside her.

const HAIR = '#1c1b24'
const SKIN = '#f8dfcf'
const OLIVE = '#93b13c'
const OLIVE_DARK = '#6c8a26'
const GLOVE = '#1b1c21'
const RED = '#c4262e'

type Pt = [number, number]

// Upper arm in a white sleeve, forearm and hand in a black glove.
function arm(shoulder: Pt, elbow: Pt, hand: Pt): string {
  const [sx, sy] = shoulder
  const [ex, ey] = elbow
  const [hx, hy] = hand
  return `<path d="M${sx} ${sy} L${ex} ${ey}" stroke="#cfcfc6" stroke-width="15" stroke-linecap="round"/>
  <path d="M${sx} ${sy} L${ex} ${ey}" stroke="#f5f5f0" stroke-width="12" stroke-linecap="round"/>
  <path d="M${ex} ${ey} L${hx} ${hy}" stroke="${GLOVE}" stroke-width="11" stroke-linecap="round"/>
  <circle cx="${hx}" cy="${hy}" r="7" fill="${GLOVE}"/>`
}

function eye(x: number, y: number, mood: Mood): string {
  if (mood === 'done') {
    return `<path d="M${x - 6} ${y + 1} Q${x} ${y - 7} ${x + 6} ${y + 1}" stroke="${HAIR}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`
  }
  const look = mood === 'thinking' ? [1.6, -1.8] : [0, 0]
  const ry = mood === 'working' ? 4.2 : 7
  const top = mood === 'working' ? y - 3 : y - 5
  return `<ellipse cx="${x}" cy="${y}" rx="6" ry="${ry}" fill="#fff"/>
  <ellipse cx="${x + look[0]}" cy="${y + look[1]}" rx="4.6" ry="${ry - 1}" fill="#2f9a62"/>
  <ellipse cx="${x + look[0]}" cy="${y + look[1] + 0.5}" rx="2" ry="${Math.min(3, ry - 2)}" fill="#11402a"/>
  <circle cx="${x + look[0] - 1.6}" cy="${y + look[1] - 2}" r="1.6" fill="#fff"/>
  <path d="M${x - 7} ${top} Q${x} ${top - (mood === 'working' ? 1 : 4)} ${x + 7} ${top}" stroke="${HAIR}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
}

function mouth(mood: Mood): string {
  switch (mood) {
    case 'speaking':
      return `<path d="M109 116 Q115 126 121 116 Z" fill="#a8434a"/>`
    case 'done':
      return `<path d="M107 115 Q115 127 123 115 Z" fill="#a8434a"/>`
    case 'waiting':
      return `<ellipse cx="115" cy="118" rx="3" ry="3.6" fill="#a8434a"/>`
    case 'thinking':
      return `<path d="M112 119 q4 -1 8 1" stroke="#8a4a46" stroke-width="2" fill="none" stroke-linecap="round"/>`
    case 'working':
      return `<path d="M111 118 h8" stroke="#8a4a46" stroke-width="2" stroke-linecap="round"/>`
    default:
      return `<path d="M110 117 Q115 121 120 117" stroke="#8a4a46" stroke-width="2" fill="none" stroke-linecap="round"/>`
  }
}

function arms(mood: Mood): string {
  const left: Pt = [86, 148]
  const right: Pt = [144, 148]
  switch (mood) {
    case 'thinking': // right hand at the chin, left arm folded beneath
      return arm(left, [82, 182], [140, 184]) + arm(right, [152, 180], [126, 126])
    case 'working': // right arm out to the holo panel
      return arm(left, [78, 182], [78, 214]) + arm(right, [166, 170], [184, 154])
    case 'speaking': // left hand raised, open
      return arm(left, [66, 172], [60, 142]) + arm(right, [152, 182], [152, 214])
    case 'done': // both hands up, cheering
      return arm(left, [66, 168], [62, 136]) + arm(right, [164, 168], [168, 136])
    case 'waiting': // right hand up beside the head, asking for attention
      return arm(left, [78, 182], [78, 214]) + arm(right, [162, 160], [166, 128])
    default:
      return arm(left, [78, 182], [78, 214]) + arm(right, [152, 182], [152, 214])
  }
}

function extra(mood: Mood): string {
  switch (mood) {
    case 'thinking':
      return `<circle cx="168" cy="70" r="4" fill="#e3e8d0"/><circle cx="178" cy="54" r="6" fill="#e3e8d0"/>
      <ellipse cx="200" cy="32" rx="24" ry="16" fill="#e3e8d0" stroke="#c8d400" stroke-width="1.5"/>
      <text x="200" y="37" font-size="16" text-anchor="middle" fill="#4a5a1c" font-family="sans-serif">…</text>`
    case 'working':
      return `<rect x="166" y="104" width="58" height="42" rx="5" fill="#d9e021" fill-opacity="0.22" stroke="#c8d400" stroke-width="1.6"/>
      <path d="M174 114 h26 M174 122 h34 M174 130 h20" stroke="#9fb000" stroke-width="2" stroke-linecap="round"/>
      <g transform="translate(212 135)"><circle r="6.5" fill="none" stroke="#c8d400" stroke-width="3.5" stroke-dasharray="3.4 2.2"/><circle r="2.2" fill="#c8d400"/></g>`
    case 'speaking':
      return `<path d="M168 22 h46 a8 8 0 0 1 8 8 v20 a8 8 0 0 1 -8 8 h-28 l-12 10 v-10 h-6 a8 8 0 0 1 -8 -8 v-20 a8 8 0 0 1 8 -8 z" fill="#fff" stroke="#c8d400" stroke-width="1.6"/>
      <circle cx="180" cy="40" r="2.8" fill="#4a5a1c"/><circle cx="191" cy="40" r="2.8" fill="#4a5a1c"/><circle cx="202" cy="40" r="2.8" fill="#4a5a1c"/>`
    case 'done':
      return [[188, 40, 9], [210, 72, 6], [40, 56, 7], [176, 92, 5]].map(star).join('')
    case 'waiting':
      return `<circle cx="198" cy="40" r="17" fill="#d9363e"/>
      <text x="198" y="48" font-size="24" font-weight="bold" text-anchor="middle" fill="#fff" font-family="sans-serif">!</text>`
    default:
      return ''
  }
}

// A four-pointed gold sparkle centred on (x, y).
function star([x, y, r]: number[]): string {
  const k = r / 3.5
  return `<path d="M${x} ${y - r} Q${x + k} ${y - k} ${x + r} ${y} Q${x + k} ${y + k} ${x} ${y + r} Q${x - k} ${y + k} ${x - r} ${y} Q${x - k} ${y - k} ${x} ${y - r} Z" fill="#e8b923"/>`
}

// One antler, drawn on the left; the right is its mirror.
const ANTLER = `<g stroke="url(#antler)" stroke-width="5" fill="none" stroke-linecap="round">
  <path d="M98 66 Q92 46 80 30"/><path d="M90 48 Q80 46 71 38"/><path d="M84 36 Q87 25 83 14"/></g>`

// `full` is the whole figure; `bust` crops to head and chest for a chat
// avatar; `bust-wide` keeps room on the right for the cloud, panel or bubble.
export type View = 'full' | 'bust' | 'bust-wide'

const VIEWBOX: Record<View, [number, number, number, number]> = {
  full: [0, 0, 230, 320],
  bust: [50, 8, 130, 160],
  'bust-wide': [50, 8, 180, 160],
}

export function fangyiSvg(mood: Mood, view: View = 'full'): string {
  const [x, y, w, h] = VIEWBOX[view]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}">
  <defs><linearGradient id="antler" gradientUnits="userSpaceOnUse" x1="0" y1="66" x2="0" y2="14">
    <stop offset="0" stop-color="#3b1016"/><stop offset="0.45" stop-color="#b3202a"/><stop offset="1" stop-color="#e2404a"/></linearGradient></defs>
  <ellipse cx="115" cy="308" rx="72" ry="7" fill="#000" opacity="0.12"/>
  <path d="M80 80 Q68 150 58 256 Q86 268 115 262 Q144 268 172 256 Q162 150 150 80 Z" fill="${HAIR}"/>
  <path d="M66 180 Q62 220 60 252" stroke="${RED}" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M64 110 L94 80 M68 120 L96 90" stroke="#2c2b33" stroke-width="3" stroke-linecap="round"/>
  <circle cx="64" cy="110" r="2.6" fill="#d4af37"/><circle cx="68" cy="120" r="2.6" fill="#d4af37"/>
  <ellipse cx="94" cy="302" rx="13" ry="5" fill="#0e0e12"/><ellipse cx="138" cy="302" rx="13" ry="5" fill="#0e0e12"/>
  <path d="M82 194 Q66 250 60 300 L170 300 Q164 250 148 194 Z" fill="${OLIVE}"/>
  <path d="M100 200 Q95 250 90 300 M130 200 Q134 250 140 300" stroke="${OLIVE_DARK}" stroke-width="2" fill="none"/>
  <path d="M115 236 L115 300" stroke="${OLIVE_DARK}" stroke-width="2.4"/>
  <g fill="#2a2e22" stroke="#c9d39a" stroke-width="0.8"><rect x="139" y="210" width="6" height="6"/><rect x="141" y="226" width="6" height="6"/><rect x="143" y="242" width="6" height="6"/></g>
  <path d="M86 142 Q115 134 144 142 L148 196 Q115 202 82 196 Z" fill="#f4f4ef" stroke="#d6d6cf" stroke-width="1"/>
  <path d="M86 152 Q115 146 144 152 L145 170 Q115 164 85 170 Z" fill="#4c5530"/>
  <path d="M115 153 l4 5 l-4 5 l-4 -5 z" fill="#d9e021"/>
  <rect x="104" y="132" width="22" height="9" rx="2" fill="#22232a"/>
  <path d="M141 145 L92 196" stroke="${GLOVE}" stroke-width="4.5"/>
  <rect x="82" y="190" width="66" height="8" fill="${GLOVE}"/><rect x="110" y="189" width="10" height="10" rx="1.5" fill="#b8bcc4"/>
  <circle cx="106" cy="204" r="3" fill="#3ab0a0"/><path d="M106 206 L104 252" stroke="#4fd18a" stroke-width="2.4"/>
  <path d="M90 150 Q96 176 88 196 Q84 210 92 224" stroke="${RED}" stroke-width="3" fill="none" stroke-linecap="round"/>
  ${arms(mood)}
  <rect x="108" y="124" width="14" height="12" fill="#efcdb9"/>
  <path d="M84 98 L62 88 L84 110 Z" fill="${SKIN}" stroke="#e7bfa8" stroke-width="1"/>
  <path d="M146 98 L168 88 L146 110 Z" fill="${SKIN}" stroke="#e7bfa8" stroke-width="1"/>
  <ellipse cx="115" cy="98" rx="33" ry="34" fill="${SKIN}"/>
  <ellipse cx="96" cy="112" rx="5" ry="3" fill="#f2a7a7" opacity="0.55"/><ellipse cx="134" cy="112" rx="5" ry="3" fill="#f2a7a7" opacity="0.55"/>
  ${eye(102, 102, mood)}
  ${eye(128, 102, mood)}
  <path d="M115 108 l-1 3" stroke="#deb29c" stroke-width="1.6" stroke-linecap="round"/>
  ${mouth(mood)}
  <path d="M81 96 Q78 58 115 58 Q152 58 149 96 L144 88 L139 94 L133 87 L127 93 L121 87 L115 93 L109 87 L103 93 L97 87 L91 94 L86 88 Z" fill="${HAIR}"/>
  <path d="M84 84 Q77 122 80 166 L90 164 Q88 122 92 92 Z" fill="${HAIR}"/>
  <path d="M146 84 Q153 122 150 166 L140 164 Q142 122 138 92 Z" fill="${HAIR}"/>
  <path d="M83 100 Q81 130 83 160" stroke="${RED}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M100 66 Q115 60 132 66" stroke="#3a3946" stroke-width="2" fill="none" stroke-linecap="round"/>
  ${ANTLER}
  <g transform="translate(230 0) scale(-1 1)">${ANTLER}</g>
  ${view === 'bust' ? '' : extra(mood)}
</svg>`
}

const STATUS_LABEL: Record<Mood, string> = {
  idle: '準備中',
  thinking: '思考中',
  working: '工作中',
  speaking: '回答中',
  done: '完成',
  waiting: '等你確認',
}

const FONT = `'Microsoft JhengHei','PingFang TC','Noto Sans TC',sans-serif`
const DETAIL_CHARS = 40

function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`)
}

// Rough rendered width: CJK characters are about one em, the rest about half.
function textWidth(text: string, size: number): number {
  let width = 0
  for (const ch of text) {
    width += ((ch.codePointAt(0) ?? 0) > 0x2e80 ? 1 : 0.58) * size
  }
  return width
}

// The status band above the prompt: her bust in the mood's pose beside a large
// status label, with a detail (the running tool's name) beneath.
export function fangyiStatusSvg(mood: Mood, detail: string): { source: string; width: number; height: number } {
  const label = `${STATUS_LABEL[mood]}…`
  const shown = detail.length > DETAIL_CHARS ? `${detail.slice(0, DETAIL_CHARS - 1)}…` : detail
  const pillWidth = Math.ceil(Math.max(textWidth(label, 30), textWidth(shown, 17)) + 36)
  const figureWidth = 180
  const height = 160
  const width = figureWidth + 12 + pillWidth + 4
  const labelY = shown ? 84 : 93
  const source = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${fangyiSvg(mood, 'bust-wide')}
  <g transform="translate(${figureWidth + 12} 0)">
    <rect x="0" y="42" width="${pillWidth}" height="78" rx="16" fill="#f6f9e3" stroke="#c8d400" stroke-width="2"/>
    <text x="18" y="${labelY}" font-size="30" font-weight="bold" fill="#3f4d17" font-family="${FONT}">${escapeXml(label)}</text>
    ${shown ? `<text x="18" y="108" font-size="17" fill="#66733a" font-family="${FONT}">${escapeXml(shown)}</text>` : ''}
  </g>
</svg>`

  return { source, width, height }
}
