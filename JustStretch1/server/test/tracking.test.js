// The browser tracker's scoring code (src/lib/poseComparison.js), tested with the same
// limb data the tracker passes in. A plain object used to crash LimbScorer on every judged
// frame, which stopped the skeleton from being drawn; nothing tested this before.
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { LimbScorer, compareToReference, referenceTime } from '../../src/lib/poseComparison.js'
import { LIMB_BY_JOINT } from '../shared/limbs.js'

// A 3-frame reference, 1 s apart: left_shoulder sweeps 0 -> 90 -> 0.
const reference = {
  duration: 2,
  targetJoints: ['left_shoulder', 'right_knee'],
  frames: [
    { t: 0, angles: { left_shoulder: 0, right_knee: 170 } },
    { t: 1, angles: { left_shoulder: 90, right_knee: 170 } },
    { t: 2, angles: { left_shoulder: 0, right_knee: 170 } },
  ],
}

describe('limb scoring in the tracker', () => {
  test('accepts the LIMB_BY_JOINT object the tracker passes in', () => {
    const scorer = new LimbScorer(LIMB_BY_JOINT)
    const frame = compareToReference({ left_shoulder: 88, right_knee: 171 }, reference, 1)
    assert.doesNotThrow(() => scorer.add(frame, 1))
    assert.doesNotThrow(() => scorer.add(frame, 1.5))
    const limbs = Object.fromEntries(scorer.summary().map((row) => [row.limb, row]))
    assert.equal(limbs.leftArm.judgedFrames, 2)
    assert.equal(limbs.leftArm.goodFrames, 2)
    assert.equal(limbs.rightLeg.judgedFrames, 2)
  })

  test('still accepts a lookup function, and skips joints that belong to no limb', () => {
    const scorer = new LimbScorer((joint) => (joint === 'left_shoulder' ? 'leftArm' : null))
    scorer.add(compareToReference({ left_shoulder: 10, right_knee: 170 }, reference, 0), 0)
    const rows = scorer.summary()
    assert.deepEqual(rows.map((row) => row.limb), ['leftArm'])
  })

  test('null frames are skipped', () => {
    const scorer = new LimbScorer(LIMB_BY_JOINT)
    assert.doesNotThrow(() => scorer.add(null, 0))
    assert.equal(scorer.summary().length, 0)
  })
})

describe('reference time', () => {
  // 900 frames 1/30 s apart, like the Blender exports: 29.967 s of frames, 30 s per loop.
  const blender = { duration: 899 / 30, frames: new Array(900).fill(null) }

  test('follows the session clock during the first pass', () => {
    assert.equal(referenceTime(blender, 0), 0)
    assert.equal(referenceTime(blender, 12.5), 12.5)
  })

  test('loops with the reference video instead of stopping after ~30 s', () => {
    assert.ok(Math.abs(referenceTime(blender, 30) - 0) < 1e-9)
    assert.ok(Math.abs(referenceTime(blender, 75) - 15) < 1e-9)
    assert.ok(Math.abs(referenceTime(blender, 299.5) - 29.5) < 1e-9)
  })

  test('a session minutes long is still judged', () => {
    const frame = compareToReference({ left_shoulder: 90, right_knee: 170 }, reference, referenceTime(reference, 301))
    assert.ok(frame, 'judged after the first pass')
    assert.equal(frame.good, true)
  })

  test('copes with odd input', () => {
    assert.equal(referenceTime(blender, -3), 0)
    assert.equal(referenceTime({ duration: 0, frames: [] }, 7), 7)
  })
})
