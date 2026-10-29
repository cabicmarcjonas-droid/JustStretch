// src/lib/scriptRunner.js
//
// Plays a step-by-step exercise script: speaks each step's text with the AudioCoach, then
// moves on when the step's condition is met. One step at a time, and never while speech is
// still playing, so two lines never overlap.
//
//   advance: 'spoken'  move on once the line has been spoken
//   advance: 'reach'   the joint must reach the reference peak (pick 'max') or trough (pick 'min')
//                      and stay within tolerance for holdMs. The script waits for the pose: it never
//                      moves on by itself, and repeats the instruction every repromptMs (default 8 s)
//                      until the user is in position. With no reference file it falls back to
//                      durationMs. Add maxWaitMs to a step only if you want it to give up after that long.
//                      Add side: 'left' | 'right' to also require the correct side (uses the signed
//                      angle, for joints such as neck_tilt and trunk_lean).
//   advance: 'timer'   wait durationMs after the line, for holds that are not camera-checked
//
// Optional on any step:
//   pauseMs    pause after the step completes, so the user has time to move
//   speakOnce  the line is spoken only the first time the step is reached
//   loop       { to, times } and/or { to, forMs }: jump back to step `to` until the count or
//              time is used up (for reps)
 
const FALLBACK_REACH_MS = 4000
const REPROMPT_MS = 8000
 
// Which sign of the signed angle means "the user's right". This depends on how the angle is built
// and whether the camera image is mirrored, so check it with a real tilt: if the left step accepts a
// right tilt, flip the sign for that joint (1 <-> -1). Pass { rightSign: { neck_tilt: -1 } } to override.
const DEFAULT_RIGHT_SIGN = { neck_tilt: 1, trunk_lean: 1 }
 
export class ScriptRunner {
  constructor(script, { coach, reference = null, rightSign = {}, onStatus = () => {}, onDone = () => {} } = {}) {
    this.steps = script.steps
    this.coach = coach
    this.reference = reference // assign again once the reference file has loaded
    this.rightSign = { ...DEFAULT_RIGHT_SIGN, ...rightSign }
    this.lastPromptAt = 0
    this.wrongSide = false
    this.onStatus = onStatus
    this.onDone = onDone
    this.running = false
    this.line = ''
    this.token = 0 // bumped on every start and stop, so late speech callbacks are ignored
    this.index = -1
    this.speaking = false
    this.completed = false
    this.readyAt = 0
    this.waitStart = 0
    this.holdStart = null
    this.reachCued = false
    this.peaks = new Map()
    this.spokenIds = new Set()
    this.loopCounts = new Map()
    this.loopStart = new Map()
  }
 
  start(now = performance.now()) {
    this.token += 1
    this.running = true
    this.index = -1
    this.speaking = false
    this.spokenIds.clear()
    this.loopCounts.clear()
    this.loopStart.clear()
    this.advanceTo(0, now)
  }
 
  // Pause freezes the script. Speech is cancelled, and late callbacks from it are ignored.
  pause() {
    if (!this.running) return
    this.token += 1
    this.speaking = false
    this.coach.stop()
  }
 
  // Resume repeats the current instruction, unless the step had already finished.
  resume(now = performance.now()) {
    if (!this.running || this.index < 0) return
    if (this.completed) {
      this.readyAt = now
      return
    }
    this.advanceTo(this.index, now)
  }
 
  stop() {
    this.running = false
    this.token += 1
    this.speaking = false
    this.coach.stop()
  }
 
  // Speak a line. `then` runs once it has finished (or after the estimated time when speech is off).
  say(text, then) {
    const token = this.token
    this.speaking = true
    this.coach.speak(text).then(() => {
      if (token !== this.token) return
      this.speaking = false
      then?.(performance.now())
    })
  }
 
  advanceTo(i, now) {
    if (!this.running) return
    if (i >= this.steps.length) {
      this.running = false
      this.onDone()
      return
    }
 
    this.index = i
    const step = this.steps[i]
    this.completed = false
    this.holdStart = null
    this.reachCued = false
    this.wrongSide = false
    this.lastPromptAt = now
    this.line = step.text ?? ''
    this.onStatus(this.line)
 
    const skipSpeech = !step.text || (step.speakOnce && this.spokenIds.has(step.id))
    if (skipSpeech) {
      this.waitStart = now
      this.lastPromptAt = now
      if (step.advance === 'spoken') this.complete(now)
      return
    }
 
    if (step.speakOnce) this.spokenIds.add(step.id)
    this.say(step.text, (t) => {
      this.waitStart = t
      this.lastPromptAt = t
      if (step.advance === 'spoken') this.complete(t)
    })
  }
 
  complete(now) {
    if (this.completed) return
    this.completed = true
    this.readyAt = now + (this.steps[this.index].pauseMs ?? 0)
  }
 
  nextIndex(now) {
    const step = this.steps[this.index]
    if (!step.loop) return this.index + 1
 
    const count = (this.loopCounts.get(step.id) ?? 0) + 1
    this.loopCounts.set(step.id, count)
    if (!this.loopStart.has(step.id)) this.loopStart.set(step.id, now)
 
    const { to, times, forMs } = step.loop
    const again =
      (times != null && count < times) || (forMs != null && now - this.loopStart.get(step.id) < forMs)
    const target = this.steps.findIndex((s) => s.id === to)
    return again && target >= 0 ? target : this.index + 1
  }
 
  // Called once per processed camera frame.
  //   inFrame  the joints needed for this stretch are visible
  //   angles   smoothed user angles for this frame, or null when there is no pose
  tick({ now, inFrame, angles }) {
    if (!this.running || this.index < 0 || this.speaking) return
    const step = this.steps[this.index]
 
    if (!this.completed) {
      if (step.advance === 'reach') this.tickReach(step, now, inFrame, angles)
      else if (step.advance === 'timer' && now - this.waitStart >= step.durationMs) this.complete(now)
    }
 
    if (this.completed && now >= this.readyAt) {
      this.advanceTo(this.nextIndex(now), now)
    }
  }
 
  tickReach(step, now, inFrame, angles) {
    const target = this.targetFor(step)
    if (target === null) {
      // No reference for this exercise: time the step instead.
      if (now - this.waitStart >= (step.durationMs ?? FALLBACK_REACH_MS)) this.complete(now)
      return
    }
 
    // The script waits for the pose. It only gives up if the step sets maxWaitMs itself.
    if (step.maxWaitMs != null && now - this.waitStart >= step.maxWaitMs) {
      this.complete(now)
      return
    }
 
    const value = angles?.[step.joint]
    const reached = inFrame && value != null && Math.abs(value - target) <= step.tolerance
    const sideOk = !step.side || this.onCorrectSide(step, angles)
    const inside = reached && sideOk
 
    if (!inside) {
      this.holdStart = null
      // Right amount of movement, wrong direction: say so the next time the line is repeated.
      this.wrongSide = reached && !sideOk
      // Not in position yet: repeat the instruction every repromptMs and keep waiting.
      if (now - this.lastPromptAt >= (step.repromptMs ?? REPROMPT_MS)) {
        this.lastPromptAt = now
        const text = this.wrongSide ? `That is the other side. ${step.text}` : step.text
        this.wrongSide = false
        this.say(text, (t) => {
          this.lastPromptAt = t
        })
      }
      return
    }
 
    this.holdStart ??= now
    if (step.onReach && !this.reachCued) {
      this.reachCued = true
      this.say(step.onReach)
    }
    if (now - this.holdStart >= (step.holdMs ?? 0)) this.complete(now)
  }
 
  // True when the signed angle points to the side the step asks for.
  onCorrectSide(step, angles) {
    const signed = angles?.[`${step.joint}_signed`]
    if (signed == null) return false
    const rightSign = this.rightSign[step.joint] ?? 1
    const wantsRight = step.side === 'right'
    return wantsRight ? signed * rightSign > 0 : signed * rightSign < 0
  }
 
  // The reference peak (max) or trough (min) for this joint, or null when there is no reference.
  targetFor(step) {
    if (!this.reference) return null
    const key = `${step.joint}:${step.pick}`
    if (!this.peaks.has(key)) {
      const values = this.reference.frames.map((f) => f.angles[step.joint]).filter((v) => v != null)
      this.peaks.set(key, values.length ? (step.pick === 'min' ? Math.min(...values) : Math.max(...values)) : null)
    }
    return this.peaks.get(key)
  }
}