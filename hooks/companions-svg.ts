// The two companions who appear beside her while sub-agents run: the panda
// (a gentle heavyweight in a leather jacket, logo tee and teal glasses) on her
// left and 弭弗 (cold-eyed, a shoulder-length silver-to-pink bob over one eye, blue crystal horns,
// red top with gold plates, big gold gauntlets) on her right. One pose each.

export type CompanionView = 'full' | 'bust'

type Box = [number, number, number, number]

function frame(box: Box, body: string, defs = ''): string {
  const [x, y, w, h] = box
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}">${defs}${body}</svg>`
}

const FULL: Box = [0, 0, 230, 320]

// A star of `rays` points between radii `inner` and `outer`, as polygon points.
function burst(cx: number, cy: number, inner: number, outer: number, rays: number): string {
  const points: string[] = []
  for (let i = 0; i < rays * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (Math.PI * i) / rays - Math.PI / 2
    points.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return points.join(' ')
}

// Black jacket sleeve ending in a round black paw.
function pawArm(shoulder: number[], elbow: number[], paw: number[]): string {
  const [sx, sy] = shoulder
  const [ex, ey] = elbow
  const [px, py] = paw
  return `<path d="M${sx} ${sy} Q${ex} ${ey} ${px} ${py}" stroke="#1f2026" stroke-width="25" fill="none" stroke-linecap="round"/>
  <path d="M${sx - 4} ${sy + 2} Q${ex - 5} ${ey - 2} ${px - 4} ${py - 6}" stroke="#3b3d46" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <circle cx="${px}" cy="${py}" r="14" fill="#141418"/>
  <path d="M${px - 7} ${py - 4} h14 M${px - 7} ${py + 1.5} h14" stroke="#3d3e45" stroke-width="1.6" stroke-linecap="round"/>`
}

const PANDA_BODY = `
  <ellipse cx="115" cy="305" rx="88" ry="8" fill="#000" opacity="0.12"/>
  <path d="M80 236 Q76 264 78 292 L110 292 L113 244 Z M150 236 Q154 264 152 292 L120 292 L117 244 Z" fill="#18191d"/>
  <path d="M78 283 h32 v8 h-32 z M120 283 h32 v8 h-32 z" fill="#2b2c32"/>
  <ellipse cx="93" cy="298" rx="21" ry="8" fill="#0b0b0d"/><ellipse cx="137" cy="298" rx="21" ry="8" fill="#0b0b0d"/>
  <ellipse cx="115" cy="196" rx="60" ry="56" fill="#f4f4f0" stroke="#d6d6cf" stroke-width="1.2"/>
  <path d="M74 216 Q115 238 156 216" stroke="#e3e3dc" stroke-width="2" fill="none"/>
  <polygon points="${burst(115, 176, 9, 16, 12)}" fill="#f2c230"/>
  <circle cx="115" cy="176" r="8" fill="#f8d95e"/>
  <rect x="92" y="189" width="46" height="15" rx="3" fill="#d8302f" stroke="#f2c230" stroke-width="1.3"/>
  <g fill="#fff" opacity="0.94"><rect x="96" y="192.5" width="8" height="8" rx="1"/><rect x="107" y="192.5" width="8" height="8" rx="1"/><rect x="118" y="192.5" width="8" height="8" rx="1"/><rect x="129" y="194.5" width="5" height="5" rx="1"/></g>
  <path d="M64 138 Q46 196 60 248 L92 246 Q86 196 96 146 Z" fill="#1f2026"/>
  <path d="M166 138 Q184 196 170 248 L138 246 Q144 196 134 146 Z" fill="#1f2026"/>
  <path d="M64 138 Q115 116 166 138 L156 150 Q115 132 74 150 Z" fill="#1f2026"/>
  <path d="M96 146 L80 138 L90 178 Z" fill="#34363e"/><path d="M134 146 L150 138 L140 178 Z" fill="#34363e"/>
  <path d="M58 170 Q54 202 62 238 M172 170 Q176 202 168 238" stroke="#3b3d46" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M92 162 L90 240 M138 162 L140 240" stroke="#a7adb5" stroke-width="1.4" stroke-dasharray="2 2"/>
  <path d="M66 220 L84 218 M146 218 L164 220" stroke="#40424b" stroke-width="2.2" stroke-linecap="round"/>
  <g fill="#c4cad2"><circle cx="84" cy="142" r="1.7"/><circle cx="92" cy="139" r="1.7"/><circle cx="138" cy="139" r="1.7"/><circle cx="146" cy="142" r="1.7"/></g>
  <rect x="58" y="228" width="114" height="10" fill="#1b1b1f"/>
  <rect x="107" y="226" width="16" height="14" rx="2" fill="#c3c7cf" stroke="#8d939c" stroke-width="1"/>
  <rect x="112" y="230" width="6" height="6" fill="#1b1b1f"/>
  ${pawArm([66, 150], [42, 194], [60, 230])}
  ${pawArm([164, 150], [206, 178], [196, 130])}
  <circle cx="76" cy="56" r="15" fill="#18191d"/><circle cx="154" cy="56" r="15" fill="#18191d"/>
  <circle cx="76" cy="56" r="6.5" fill="#3a3b41"/><circle cx="154" cy="56" r="6.5" fill="#3a3b41"/>
  <ellipse cx="115" cy="90" rx="47" ry="41" fill="#f7f7f3" stroke="#dcdcd6" stroke-width="1.2"/>
  <path d="M69 98 q-5 7 2 12 M161 98 q5 7 -2 12 M107 51 q4 -6 8 0 q3 -5 7 1" stroke="#d6d6cf" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <ellipse cx="97" cy="94" rx="13" ry="11" fill="#18191d" transform="rotate(-22 97 94)"/>
  <ellipse cx="133" cy="94" rx="13" ry="11" fill="#18191d" transform="rotate(22 133 94)"/>
  <circle cx="98" cy="95" r="4.4" fill="#fff"/><circle cx="132" cy="95" r="4.4" fill="#fff"/>
  <circle cx="98.4" cy="95.8" r="2.7" fill="#000"/><circle cx="131.6" cy="95.8" r="2.7" fill="#000"/>
  <circle cx="97" cy="94" r="1.3" fill="#fff"/><circle cx="130.6" cy="94" r="1.3" fill="#fff"/>
  <circle cx="98" cy="96" r="9.5" fill="#43c6cf" fill-opacity="0.38" stroke="#b9c2c9" stroke-width="1.6"/>
  <circle cx="132" cy="96" r="9.5" fill="#43c6cf" fill-opacity="0.38" stroke="#b9c2c9" stroke-width="1.6"/>
  <path d="M107.5 96 Q115 92 122.5 96" stroke="#b9c2c9" stroke-width="1.6" fill="none"/>
  <ellipse cx="84" cy="111" rx="6.5" ry="3.6" fill="#f4a6b0" opacity="0.5"/><ellipse cx="146" cy="111" rx="6.5" ry="3.6" fill="#f4a6b0" opacity="0.5"/>
  <ellipse cx="115" cy="112" rx="16" ry="11" fill="#fdfdfa"/>
  <path d="M109 105 Q115 101 121 105 Q118 111 115 111 Q112 111 109 105 Z" fill="#18191d"/>
  <ellipse cx="113" cy="104.6" rx="1.7" ry="0.9" fill="#5a5a60"/>
  <path d="M108 116 Q111.5 120.5 115 116 Q118.5 120.5 122 116" stroke="#18191d" stroke-width="1.9" fill="none" stroke-linecap="round"/>`

// Bust: head, jacket and the raised paw.
const PANDA_BUST: Box = [34, 36, 182, 172]

export function pandaSvg(view: CompanionView = 'full'): string {
  return frame(view === 'full' ? FULL : PANDA_BUST, PANDA_BODY)
}

const PINK_LIGHT = '#fdf1f4'
const PINK_DEEP = '#c4688a'
const SKIN = '#f9e3da'
const GOLD = '#d4ac4c'
const GOLD_DARK = '#7f6020'

// Upper arm bare with a cloth wrap at the elbow, forearm in a big gold
// gauntlet: segmented plates, a knuckled fist and a green glow.
function gauntletArm(shoulder: number[], elbow: number[], fist: number[]): string {
  const [sx, sy] = shoulder
  const [ex, ey] = elbow
  const [fx, fy] = fist
  const angle = ((Math.atan2(fy - ey, fx - ex) * 180) / Math.PI).toFixed(1)
  const len = Math.hypot(fx - ex, fy - ey)
  return `<path d="M${sx} ${sy} L${ex} ${ey}" stroke="#e8c4b4" stroke-width="12.5" stroke-linecap="round"/>
  <path d="M${sx} ${sy} L${ex} ${ey}" stroke="${SKIN}" stroke-width="10" stroke-linecap="round"/>
  <g transform="translate(${ex} ${ey}) rotate(${angle})">
    <path d="M-3 -8 L${len - 7} -11 L${len - 7} 11 L-3 8 Z" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="1.2"/>
    <path d="M${(len * 0.32).toFixed(1)} -9.5 V9.5 M${(len * 0.6).toFixed(1)} -10.3 V10.3" stroke="${GOLD_DARK}" stroke-width="1.3"/>
    <path d="M0 -5.5 L${len - 9} -7.5" stroke="#f5e09a" stroke-width="1.6" stroke-linecap="round"/>
    <rect x="${len - 9}" y="-12.5" width="19" height="25" rx="5" fill="#c49c40" stroke="${GOLD_DARK}" stroke-width="1.2"/>
    <path d="M${len + 5} -8.5 V8.5 M${len + 1} -10 V10" stroke="${GOLD_DARK}" stroke-width="1.2"/>
    <circle cx="${len - 1}" cy="0" r="6" fill="#7dff9a" opacity="0.25"/>
    <circle cx="${len - 1}" cy="0" r="2.6" fill="#7dff9a"/>
  </g>
  <circle cx="${ex}" cy="${ey}" r="7" fill="#efe9e4" stroke="#c9c1ba" stroke-width="1"/>
  <path d="M${ex - 6} ${ey + 1} L${ex + 6} ${ey - 1}" stroke="#c8263b" stroke-width="2.2"/>`
}

// A red-rimmed eye with a pale aqua centre under a heavy lid, a stern brow angled down toward the nose.
function sternEye(x: number, side: 1 | -1): string {
  return `<ellipse cx="${x}" cy="102" rx="6.2" ry="5.2" fill="#fff"/>
  <ellipse cx="${x + side}" cy="102.4" rx="4.3" ry="4.9" fill="#c24a4a"/>
  <ellipse cx="${x + side}" cy="103" rx="2.8" ry="3.1" fill="#a9dcdc"/>
  <circle cx="${x + side}" cy="103" r="1.3" fill="#2a1a1a"/>
  <circle cx="${x + side - 1.7}" cy="100.6" r="1.2" fill="#fff"/>
  <path d="M${x - 8 * side} ${100.2} Q${x - side} ${95.6} ${x + 8 * side} ${99.4}" stroke="#3a1e1a" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M${x - 5 * side} ${107.2} Q${x} ${108.2} ${x + 5 * side} ${106.8}" stroke="#c49a8a" stroke-width="1" fill="none"/>
  <path d="M${x - 9 * side} ${91} L${x + 7 * side} ${95.6}" stroke="#b9708a" stroke-width="2.4" stroke-linecap="round"/>`
}

// One crystal horn, deep blue and jagged; the other is its mirror.
const HORN = `<path d="M99 66 L90 54 L80 56 L85 47 L74 36 L83 37 L77 20 L89 34 L93 29 L96 43 L107 59 Z" fill="url(#mifuHorn)" stroke="#0e2440" stroke-width="1"/>
  <path d="M94 52 L84 40 M90 45 L81 29" stroke="#9cd0f5" stroke-width="1.2" opacity="0.8"/>`

const MIFU_DEFS = `<defs>
  <linearGradient id="mifuHorn" gradientUnits="userSpaceOnUse" x1="0" y1="66" x2="0" y2="20">
    <stop offset="0" stop-color="#10294a"/><stop offset="0.5" stop-color="#2f6fae"/><stop offset="1" stop-color="#6fb6ea"/></linearGradient>
  <linearGradient id="mifuHair" gradientUnits="userSpaceOnUse" x1="0" y1="56" x2="0" y2="150">
    <stop offset="0" stop-color="#f3e6ec"/><stop offset="0.55" stop-color="#eebbcb"/><stop offset="1" stop-color="#d8698d"/></linearGradient>
</defs>`

const HAIR = 'url(#mifuHair)'
// A thin outline that keeps the pale hair apart from her face.
const HAIR_LINE = '#d690a8'

const MIFU_BODY = `
  <ellipse cx="115" cy="305" rx="70" ry="7" fill="#000" opacity="0.12"/>
  <path d="M198 240 Q226 172 168 120" stroke="#ff6fa8" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.4"/>
  <path d="M198 240 Q226 172 168 120" stroke="#ffd0e2" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.8"/>
  <path d="M80 70 Q64 90 68 116 Q66 130 76 138 Q90 144 115 142 Q140 144 154 138 Q164 130 162 116 Q166 90 150 70 Z" fill="${HAIR}" stroke="${HAIR_LINE}" stroke-width="0.8"/>
  <path d="M86 196 Q66 250 70 296 L92 292 L98 210 Z M144 196 Q164 250 160 296 L138 292 L132 210 Z" fill="#1f3833"/>
  <path d="M86 196 Q66 250 70 296 M144 196 Q164 250 160 296" stroke="#3d6a60" stroke-width="2" fill="none"/>
  <g fill="${GOLD}"><circle cx="80" cy="232" r="1.6"/><circle cx="76" cy="256" r="1.6"/><circle cx="150" cy="232" r="1.6"/><circle cx="154" cy="256" r="1.6"/></g>
  <rect x="93" y="214" width="17" height="10" fill="${SKIN}"/><rect x="120" y="214" width="17" height="10" fill="${SKIN}"/>
  <rect x="92" y="222" width="19" height="62" rx="6" fill="#2f6150"/><rect x="119" y="222" width="19" height="62" rx="6" fill="#2f6150"/>
  <g fill="#4fd1b8"><rect x="92" y="224" width="19" height="3"/><rect x="92" y="231" width="19" height="2"/><rect x="119" y="224" width="19" height="3"/><rect x="119" y="231" width="19" height="2"/></g>
  <path d="M101 212 L101 224 M129 212 L129 224" stroke="#1d1c22" stroke-width="1.8"/>
  <rect x="91" y="272" width="21" height="24" rx="4" fill="#6b4a32"/><rect x="118" y="272" width="21" height="24" rx="4" fill="#6b4a32"/>
  <path d="M96 278 h11 M96 284 h11 M123 278 h11 M123 284 h11" stroke="#3e2a1c" stroke-width="1.4" stroke-linecap="round"/>
  <ellipse cx="100" cy="298" rx="13" ry="6" fill="#5d3f2a"/><ellipse cx="130" cy="298" rx="13" ry="6" fill="#5d3f2a"/>
  <path d="M88 196 L142 196 L144 216 L118 218 L115 210 L112 218 L86 216 Z" fill="#2a2a30"/>
  <rect x="86" y="193" width="58" height="5" fill="#2b2b30"/>
  <rect x="98" y="191" width="8" height="8" rx="1.5" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.8"/>
  <rect x="124" y="191" width="8" height="8" rx="1.5" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.8"/>
  <rect x="133" y="198" width="10" height="11" rx="2" fill="#4a3a2a" stroke="#2c2018" stroke-width="1"/>
  <path d="M90 146 Q115 138 140 146 L142 194 L88 194 Z" fill="#c8263b"/>
  <path d="M90 146 L95 194 L88 194 Z M140 146 L135 194 L142 194 Z" fill="#a51d30"/>
  <path d="M92 148 Q115 141 138 148" stroke="${GOLD}" stroke-width="1.8" fill="none"/>
  <path d="M100 166 L130 166 L134 192 L96 192 Z" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="1.2"/>
  <path d="M104 172 h22 M102 180 h26 M108 166 v6 M122 166 v6" stroke="${GOLD_DARK}" stroke-width="1.2"/>
  <rect x="112" y="183" width="6" height="6" rx="1" fill="#2f8fb5"/>
  <path d="M136 150 Q148 170 128 190" stroke="#2f8fb5" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M137 153 Q146 170 129 187" stroke="#8fd3f0" stroke-width="1" fill="none" stroke-linecap="round"/>
  ${gauntletArm([140, 150], [156, 174], [158, 204])}
  <rect x="108" y="120" width="14" height="12" fill="#f0d2c6"/>
  <rect x="105" y="125" width="20" height="9" rx="2" fill="#eef0f2" stroke="#c9ced6" stroke-width="0.8"/>
  <rect x="106" y="127" width="18" height="1.8" fill="#2f6fae"/><rect x="106" y="130.6" width="18" height="1.8" fill="#2f6fae"/>
  <rect x="113" y="126.4" width="4" height="7" rx="1" fill="#c9ced6"/>
  <path d="M82 96 Q82 66 115 64 Q148 66 148 96 Q148 120 128 129 Q115 135 102 129 Q82 120 82 96 Z" fill="${SKIN}" stroke="#e2b4a2" stroke-width="1.2"/>
  <ellipse cx="115" cy="133" rx="11" ry="2.6" fill="#dcae9c" opacity="0.6"/>
  ${sternEye(102, 1)}
  ${sternEye(128, -1)}
  <circle cx="135" cy="110.5" r="0.9" fill="#6a3a3a"/>
  <path d="M115 108 l-1 3" stroke="#e0b4a4" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M110 117.6 Q115 116.4 120 118.2" stroke="#8a4a50" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M86 106 Q74 118 77 132 Q79 142 70 149 Q84 152 91 143 Q97 134 95 118 Z" fill="${HAIR}" stroke="${HAIR_LINE}" stroke-width="0.8"/>
  <path d="M144 102 Q157 114 155 128 Q154 140 164 147 Q150 152 143 143 Q137 132 140 116 Z" fill="${HAIR}" stroke="${HAIR_LINE}" stroke-width="0.8"/>
  <path d="M84 116 Q79 128 82 140 M148 114 Q153 126 150 138" stroke="${PINK_DEEP}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.85"/>
  <path d="M70 149 q-3 -5 1 -8 M164 147 q3 -5 -1 -8" stroke="${PINK_DEEP}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M147 96 L162 86 L148 110 Z" fill="${SKIN}" stroke="#e2b4a2" stroke-width="1"/>
  <path d="M83 98 L68 90 L82 110 Z" fill="${SKIN}" stroke="#e2b4a2" stroke-width="1"/>
  <path d="M80 98 Q76 58 115 55 Q154 58 150 98 Q147 84 138 76 Q128 68 118 70 Q108 72 100 80 Q90 88 80 98 Z" fill="${HAIR}" stroke="${HAIR_LINE}" stroke-width="0.8"/>
  <path d="M124 64 Q144 72 150 100 Q141 86 130 80 Z" fill="${HAIR}" stroke="${HAIR_LINE}" stroke-width="0.8"/>
  <path d="M120 66 Q134 78 135 96 Q127 85 117 78 Z" fill="${HAIR}" stroke="${HAIR_LINE}" stroke-width="0.8"/>
  <path d="M116 68 Q122 80 120 92 Q114 82 110 76 Z" fill="${HAIR}" stroke="${HAIR_LINE}" stroke-width="0.8"/>
  <path d="M122 62 Q84 60 79 98 Q77 120 92 134 Q93 120 101 110 Q107 102 108 92 Q110 80 122 74 Z" fill="${HAIR}" stroke="${HAIR_LINE}" stroke-width="0.8"/>
  <path d="M112 70 Q96 82 96 104 Q96 118 92 128" stroke="${PINK_DEEP}" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="0.8"/>
  <path d="M104 66 Q88 76 88 100" stroke="${PINK_LIGHT}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M136 62 Q120 56 104 62" stroke="${PINK_LIGHT}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M119 56 q-1 -7 -6 -10" stroke="#e8b6c6" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  ${gauntletArm([90, 150], [68, 178], [86, 140])}
  ${HORN}
  <g transform="translate(230 0) scale(-1 1)">${HORN}</g>`

// Bust: horns, head, top and both gauntlets.
const MIFU_BUST: Box = [48, 10, 146, 198]

export function mifuSvg(view: CompanionView = 'full'): string {
  return frame(view === 'full' ? FULL : MIFU_BUST, MIFU_BODY, MIFU_DEFS)
}

// The busts' sizes, for laying them out beside her.
export const COMPANION_BUST = {
  panda: { width: PANDA_BUST[2], height: PANDA_BUST[3] },
  mifu: { width: MIFU_BUST[2], height: MIFU_BUST[3] },
}
