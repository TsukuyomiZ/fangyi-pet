// Hand-drawn pixel sprites for the terminal, 12x10 pixels each: two pixels to
// a cell with the upper half block, so a sprite is 12 columns by 5 rows. A
// sprite is drawn, not shrunk, so every pixel stays one clean colour.

type Sprite = { columns: number; rows: number; cells: string }

// One letter a colour; '.' is see-through.
const PALETTE: Record<string, number> = {
  R: 0xc4262e, // antler, red top
  K: 0x3e3b4c, // Fangyi's hair, lifted off a dark terminal
  k: 0x15141a, // dark line: closed or narrowed eyes, panda patches
  S: 0xf8dfcf, // skin
  G: 0x2fa866, // green eye
  M: 0xe08a8a, // closed mouth
  Q: 0xb03a48, // open mouth
  W: 0xf2f2ee, // white: collar, panda
  O: 0x93b13c, // olive band
  T: 0x43c6cf, // teal: panda glasses
  J: 0x24252c, // panda jacket
  Y: 0xf2c230, // panda's sun logo
  P: 0xf0bccb, // 弭弗's hair
  p: 0xd97393, // 弭弗's hair, its pink ends
  B: 0x2f6fae, // 弭弗's crystal horns
  E: 0xc24a4a, // 弭弗's red eye
  A: 0xfde2e6, // blush
}

// Fangyi's face, the eye row and the mouth row left to each mood.
function fangyi(eyes: string, mouth: string): string[] {
  return [
    '.R........R.',
    '.RR......RR.',
    '..RKKKKKKR..',
    '.KKKKKKKKKK.',
    '.KKKKKKKKKK.',
    'SKSSSSSSSSKS',
    eyes,
    '.KSASSSSASK.',
    mouth,
    '.KK.WOOW.KK.',
  ]
}

const SPRITES: Record<string, string[]> = {
  'fangyi-idle': fangyi('.KSGSSSSGSK.', '.KKSSMMSSKK.'),
  'fangyi-thinking': fangyi('.KSSGSSSSGK.', '.KKSSSMSSKK.'),
  'fangyi-working': fangyi('.KSkSSSSkSK.', '.KKSSMMSSKK.'),
  'fangyi-speaking': fangyi('.KSGSSSSGSK.', '.KKSSQQSSKK.'),
  'fangyi-done': fangyi('.KkSkSSkSkK.', '.KKSQQQQSKK.'),
  'fangyi-waiting': fangyi('.KSGSSSSGSK.', '.KKSSSQSSKK.'),
  panda: [
    '.kk......kk.',
    '.kkWWWWWWkk.',
    '..WWWWWWWW..',
    '.WWWWWWWWWW.',
    '.WkkWWWWkkW.',
    '.WkTWWWWTkW.',
    '.WWWWkkWWWW.',
    '.WAWWMMWWAW.',
    '..WWWWWWWW..',
    '.JJJWYYWJJJ.',
  ],
  mifu: [
    'B..........B',
    '.B..PPPP..B.',
    '..BPPPPPPB..',
    '.PPPPPPPPPP.',
    '.PPPPPPPSSP.',
    'SPPPPPSSSSPS',
    '.PPPPPSSESP.',
    '.pPPPSSSSSp.',
    '.ppPSSMMSpp.',
    '..pp.WRRW.pp',
  ],
}

// The reply's avatar is her speaking face.
SPRITES.avatar = SPRITES['fangyi-speaking']

const UPPER_HALF = 0x2580
const LOWER_HALF = 0x2584
const SPACE = 0x20
const DEFAULT = 0x01000000

const built = new Map<string, Sprite>()

// A sprite as a Raster's cells: [codePoint, fg, bg] u32 triplets, base64.
export function sprite(name: string): Sprite {
  const cached = built.get(name)
  if (cached) {
    return cached
  }
  const rows = SPRITES[name] ?? SPRITES.avatar
  const columns = rows[0].length
  const colour = (row: number, col: number) => PALETTE[rows[row]?.[col] ?? '.']
  const words: number[] = []
  for (let row = 0; row < rows.length; row += 2) {
    for (let col = 0; col < columns; col++) {
      const top = colour(row, col)
      const bottom = colour(row + 1, col)
      if (top === undefined && bottom === undefined) {
        words.push(SPACE, DEFAULT, DEFAULT)
      } else if (bottom === undefined) {
        words.push(UPPER_HALF, top, DEFAULT)
      } else if (top === undefined) {
        words.push(LOWER_HALF, bottom, DEFAULT)
      } else {
        words.push(UPPER_HALF, top, bottom)
      }
    }
  }
  const made = {
    columns,
    rows: Math.ceil(rows.length / 2),
    cells: new Uint8Array(Uint32Array.from(words).buffer).toBase64(),
  }
  built.set(name, made)

  return made
}
