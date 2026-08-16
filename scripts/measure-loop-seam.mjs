import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const sharp = require('sharp')

/**
 * Reports how seamless a looping video is.
 *
 * Compares frame 0 against the final frame (the wrap) and against frame 1
 * (an adjacent-frame baseline). A true seamless loop lands near the baseline;
 * a hard cut lands an order of magnitude higher — an unprocessed clip measured
 * ~55 against a ~4 baseline.
 *
 *   node scripts/measure-loop-seam.mjs <tmpdir> <file.mp4> [more.mp4 ...]
 *
 * Note the comma inside ffmpeg's `select=eq(n\,N)` MUST stay escaped: an
 * unescaped comma is read as a filter separator.
 */
const [tmpDir, ...files] = process.argv.slice(2)

const run = (bin, args) =>
  execFileSync(bin, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

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

const grabFrame = (file, index, out) =>
  run('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-i', file,
    '-vf', `select=eq(n\\,${index})`,
    '-vsync', '0', '-frames:v', '1',
    out,
  ])

const load = (file) =>
  sharp(file).resize(160, 90, { fit: 'fill' }).removeAlpha().raw().toBuffer()

const meanAbsDiff = (a, b) => {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i])
  return +(sum / a.length).toFixed(2)
}

console.log('file                          seam   baseline   verdict')
console.log('---------------------------------------------------------')

for (const file of files) {
  const name = path.basename(file, '.mp4')
  const n = frameCount(file)

  const paths = {
    first: path.join(tmpDir, `${name}-first.png`),
    second: path.join(tmpDir, `${name}-second.png`),
    last: path.join(tmpDir, `${name}-last.png`),
  }
  grabFrame(file, 0, paths.first)
  grabFrame(file, 1, paths.second)
  grabFrame(file, n - 1, paths.last)

  const [first, second, last] = await Promise.all([
    load(paths.first),
    load(paths.second),
    load(paths.last),
  ])

  const seam = meanAbsDiff(first, last)
  const baseline = meanAbsDiff(first, second)
  const verdict = seam <= baseline * 2 ? 'seamless' : seam <= 20 ? 'soft dissolve' : 'HARD CUT'

  console.log(
    `${name.padEnd(28)}${String(seam).padStart(6)}${String(baseline).padStart(10)}   ${verdict}`,
  )
}
