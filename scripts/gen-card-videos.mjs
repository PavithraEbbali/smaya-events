import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

// This script lives in the scratchpad, so resolve sharp from the project.
const require = createRequire(
  'file:///C:/Users/pavit/Downloads/smaya events/package.json',
)
const sharp = require('sharp')

const DL = 'C:/Users/pavit/Downloads'
const OUT = 'C:/Users/pavit/Downloads/smaya events/public/videos'
const TMP = process.argv[2]

/** src filename -> vertical slug */
const JOBS = [
  ['corporate.mp4', 'corporate'],
  ['fitness&wellness.mp4', 'fitness'],
  ['adventure.mp4', 'adventure'],
  ['entertainment.mp4', 'entertainment'],
  ['community.mp4', 'community'],
  ['workshops&retreats.mp4', 'workshops'],
]

const CRF_DESKTOP = '34'
const CRF_MOBILE = '35'

const run = (bin, args) =>
  execFileSync(bin, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

const duration = (file) =>
  Number(
    run('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      file,
    ]).trim(),
  )

const frameCount = (file) =>
  Number(
    run('ffprobe', [
      '-v', 'error', '-count_frames',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=nb_read_frames',
      '-of', 'csv=p=0',
      file,
    ]).trim(),
  )

/**
 * True seamless loop: output starts AND ends on source t=X.
 *   base = source[X..D]   head = source[0..X]
 *   xfade(base, head, offset = D - 2X, duration = X)  -> length D - X
 */
function seamlessLoop(src, dest, width, crf) {
  const D = duration(src)
  const X = Math.min(2, D / 4)
  const offset = (D - X) - X

  const graph = [
    `[0:v]scale=${width}:-2,split=2[s1][s2]`,
    `[s1]trim=start=${X}:end=${D},setpts=PTS-STARTPTS[base]`,
    `[s2]trim=start=0:end=${X},setpts=PTS-STARTPTS[head]`,
    `[base][head]xfade=transition=fade:duration=${X}:offset=${offset},format=yuv420p[out]`,
  ].join(';')

  run('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-i', src,
    '-filter_complex', graph,
    '-map', '[out]',
    '-an',
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-pix_fmt', 'yuv420p',
    '-crf', crf,
    '-preset', 'veryslow',
    '-g', '48',
    '-movflags', '+faststart',
    dest,
  ])
  return D - X
}

/** Mean absolute pixel difference between two extracted frames. */
async function seamDiff(file, slug) {
  const n = frameCount(file)
  const grab = (idx, out) =>
    run('ffmpeg', [
      '-y', '-loglevel', 'error',
      '-i', file,
      '-vf', `select=eq(n\\,${idx})`,
      '-vsync', '0', '-frames:v', '1',
      out,
    ])

  const f0 = path.join(TMP, `${slug}-0.png`)
  const f1 = path.join(TMP, `${slug}-1.png`)
  const fl = path.join(TMP, `${slug}-l.png`)
  grab(0, f0)
  grab(1, f1)
  grab(n - 1, fl)

  const load = (f) =>
    sharp(f).resize(160, 90, { fit: 'fill' }).removeAlpha().raw().toBuffer()
  const [a, b, c] = await Promise.all([load(f0), load(f1), load(fl)])
  const mad = (x, y) => {
    let s = 0
    for (let i = 0; i < x.length; i++) s += Math.abs(x[i] - y[i])
    return +(s / x.length).toFixed(2)
  }
  return { baseline: mad(a, b), seam: mad(a, c) }
}

const kb = (f) => Math.round(fs.statSync(f).size / 1024)

console.log('slug          desktop   mobile   poster |  seam / baseline')
console.log('------------------------------------------------------------')

for (const [file, slug] of JOBS) {
  const src = path.join(DL, file)
  const desktop = path.join(OUT, `${slug}-card.mp4`)
  const mobile = path.join(OUT, `${slug}-card-mobile.mp4`)
  const poster = path.join(OUT, `${slug}-card-poster.jpg`)

  const len = seamlessLoop(src, desktop, 854, CRF_DESKTOP)

  run('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-i', desktop, '-an',
    '-vf', 'scale=640:-2',
    '-c:v', 'libx264', '-profile:v', 'main', '-pix_fmt', 'yuv420p',
    '-crf', CRF_MOBILE, '-preset', 'veryslow', '-g', '48',
    '-movflags', '+faststart',
    mobile,
  ])

  run('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-ss', String(Math.min(3, len / 2)),
    '-i', desktop, '-frames:v', '1', '-q:v', '6',
    poster,
  ])

  const d = await seamDiff(desktop, slug)
  const flag = d.seam <= d.baseline * 2.5 ? 'OK' : 'CHECK'
  console.log(
    `${slug.padEnd(14)}${String(kb(desktop)).padStart(4)}KB ${String(kb(mobile)).padStart(6)}KB ${String(kb(poster)).padStart(6)}KB | ${String(d.seam).padStart(6)} / ${String(d.baseline).padStart(5)}  ${flag}`,
  )
}
