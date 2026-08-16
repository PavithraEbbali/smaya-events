import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const sharp = require('sharp')

/**
 * Builds a seamless looping hero clip, its mobile cut and its poster.
 *
 *   node scripts/make-hero-loop.mjs <src.mp4> <slug> <tmpdir>
 *
 * THE POINT OF THIS SCRIPT is choosing the splice point safely.
 *
 * The loop works by starting and ending the output on the SAME source
 * timestamp X:  base = src[X..D], head = src[0..X], xfade(base, head,
 * offset = D - 2X, duration = X). Output length is D - X.
 *
 * Every clip Gemini has produced for this project is a multi-shot montage. If X
 * lands on a shot boundary, the output's first frame and last frame sit on
 * OPPOSITE SIDES OF A CUT and the "seamless" loop becomes the harshest cut on
 * the page — that shipped once, measuring 59.16 against a 2.99 baseline. So
 * scene cuts are detected first and X is moved to the safest mid-shot gap.
 */

const [src, slug, tmpDir] = process.argv.slice(2)
if (!src || !slug || !tmpDir) {
  console.error('usage: make-hero-loop.mjs <src.mp4> <slug> <tmpdir>')
  process.exit(1)
}

const OUT = 'public/videos'
const run = (bin, args) =>
  execFileSync(bin, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

const probe = (entries, stream) =>
  run('ffprobe', [
    '-v', 'error',
    ...(stream ? ['-select_streams', stream] : []),
    '-show_entries', entries,
    '-of', 'csv=p=0',
    src,
  ]).trim()

const duration = Number(probe('format=duration'))
const fpsRaw = probe('stream=r_frame_rate', 'v:0').split('/')
const fps = Number(fpsRaw[0]) / Number(fpsRaw[1] ?? 1)

/**
 * Scene-cut timestamps, via ffmpeg's scene-score detector.
 *
 * MUST use spawnSync, not execFileSync: showinfo writes to stderr, and
 * `ffmpeg -f null -` exits 0, so execFileSync never surfaces it. An earlier
 * version silently reported "no cuts" for every clip and spliced straight onto
 * a shot boundary.
 */
function detectCuts() {
  const res = spawnSync(
    'ffmpeg',
    ['-i', src, '-filter:v', "select='gt(scene,0.3)',showinfo", '-f', 'null', '-'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  )
  const stderr = `${res.stderr ?? ''}`
  return [...stderr.matchAll(/pts_time:([\d.]+)/g)]
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b)
}

/**
 * Pick X: prefer 2s, but keep the whole risk window clear of any cut. The
 * window is [X - 2/fps, X + 1/fps] — the output's last frame sits one frame
 * before X, so a cut anywhere in there splits first frame from last.
 */
function chooseSplice(cuts) {
  const margin = 3 / fps
  const clear = (x) => cuts.every((c) => Math.abs(c - x) > margin)

  const candidates = [2, 1.5, 2.5, 1.25, 2.75, 1, 3, 0.75, 3.25]
    .filter((x) => x > 0.5 && x < duration / 2)
  for (const x of candidates) if (clear(x)) return { x, safe: true }

  // Nothing clean — take the candidate furthest from any cut.
  let best = candidates[0]
  let bestGap = -1
  for (const x of candidates) {
    const gap = Math.min(...cuts.map((c) => Math.abs(c - x)))
    if (gap > bestGap) { bestGap = gap; best = x }
  }
  return { x: best, safe: false }
}

const cuts = detectCuts()
const { x: X, safe } = chooseSplice(cuts)
const offset = duration - 2 * X

console.log(`source     ${path.basename(src)}`)
console.log(`duration   ${duration.toFixed(3)}s @ ${fps}fps`)
console.log(`scene cuts ${cuts.length ? cuts.map((c) => c.toFixed(2)).join(', ') : 'none'}`)
console.log(`splice X   ${X}s ${safe ? '(clear of every cut)' : '(NO CLEAN POINT — closest available)'}`)
console.log(`output     ${(duration - X).toFixed(3)}s\n`)

const desktop = path.join(OUT, `${slug}-hero.mp4`)
const mobile = path.join(OUT, `${slug}-hero-mobile.mp4`)
const poster = path.join(OUT, `${slug}-hero-poster.jpg`)

const graph = [
  `[0:v]scale=1280:-2,split=2[s1][s2]`,
  `[s1]trim=start=${X}:end=${duration},setpts=PTS-STARTPTS[base]`,
  `[s2]trim=start=0:end=${X},setpts=PTS-STARTPTS[head]`,
  `[base][head]xfade=transition=fade:duration=${X}:offset=${offset},format=yuv420p[out]`,
].join(';')

run('ffmpeg', [
  '-y', '-loglevel', 'error', '-i', src,
  '-filter_complex', graph, '-map', '[out]', '-an',
  '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
  '-crf', '33', '-preset', 'veryslow', '-g', '48',
  '-movflags', '+faststart', desktop,
])
run('ffmpeg', [
  '-y', '-loglevel', 'error', '-i', desktop, '-an',
  '-vf', 'scale=854:-2',
  '-c:v', 'libx264', '-profile:v', 'main', '-pix_fmt', 'yuv420p',
  '-crf', '32', '-preset', 'veryslow', '-g', '48',
  '-movflags', '+faststart', mobile,
])
run('ffmpeg', [
  '-y', '-loglevel', 'error', '-ss', String(Math.min(3, (duration - X) / 2)),
  '-i', desktop, '-frames:v', '1', '-q:v', '5', poster,
])

// Verify the seam we just tried to create.
const frames = Number(
  run('ffprobe', [
    '-v', 'error', '-count_frames', '-select_streams', 'v:0',
    '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', desktop,
  ]).trim(),
)
const grab = (i, out) =>
  run('ffmpeg', [
    '-y', '-loglevel', 'error', '-i', desktop,
    '-vf', `select=eq(n\\,${i})`, '-vsync', '0', '-frames:v', '1', out,
  ])

const p = (t) => path.join(tmpDir, `${slug}-hero-${t}.png`)
grab(0, p('first'))
grab(1, p('second'))
grab(frames - 1, p('last'))

const load = (f) =>
  sharp(f).resize(160, 90, { fit: 'fill' }).removeAlpha().raw().toBuffer()
const [first, second, last] = await Promise.all([
  load(p('first')), load(p('second')), load(p('last')),
])
const mad = (a, b) => {
  let s = 0
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i])
  return +(s / a.length).toFixed(2)
}
const seam = mad(first, last)
const baseline = mad(first, second)
const verdict = seam <= baseline * 2 ? 'seamless' : seam <= 20 ? 'soft dissolve' : 'HARD CUT — move X'

const kb = (f) => Math.round(fs.statSync(f).size / 1024)
console.log(`seam ${seam} / baseline ${baseline}  ->  ${verdict}\n`)
console.log(`${path.basename(desktop).padEnd(34)}${String(kb(desktop)).padStart(5)} KB`)
console.log(`${path.basename(mobile).padEnd(34)}${String(kb(mobile)).padStart(5)} KB`)
console.log(`${path.basename(poster).padEnd(34)}${String(kb(poster)).padStart(5)} KB`)
