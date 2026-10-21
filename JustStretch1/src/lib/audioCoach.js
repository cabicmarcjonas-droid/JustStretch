// src/lib/audioCoach.js
//
// Spoken posture cues using the browser's built-in speech synthesis (Web Speech API).
// No audio files, no API key and no AI service: the text comes from strings in the code.
//
// The tracker calls update() on every frame. This module decides whether anything is
// worth saying, so the user hears a short cue when something changes instead of a
// sentence 30 times a second.
//
//   step back    target joints out of view for a moment        (interrupts what is playing)
//   adjust       form stays off the reference for about 1 s    ("Adjust your left elbow.")
//   good         form comes back after having been off         ("Good, hold it there.")
 
const STORAGE_KEY = 'juststretch.sound'
 
function readPreference() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}
 
function savePreference(on) {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    // Private mode or storage blocked: the setting simply won't be remembered.
  }
}
 
export class AudioCoach {
  /**
   * @param {object} options
   * @param {string} options.lang       Voice language.
   * @param {number} options.minGapMs   Minimum pause between two spoken cues.
   * @param {number} options.repeatMs   How long before the same cue may be repeated.
   * @param {number} options.unseenMs   How long the body must be out of view before "step back".
   * @param {number} options.badMs      How long form must stay off before "adjust".
   * @param {number} options.goodMs     How long form must stay right before "good".
   * @param {number} options.rate       Speech rate (1 is normal).
   */
  constructor({
    lang = 'en-US',
    minGapMs = 3000,
    repeatMs = 8000,
    unseenMs = 350,
    badMs = 1000,
    goodMs = 700,
    rate = 1,
  } = {}) {
    this.synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
    this.lang = lang
    this.minGapMs = minGapMs
    this.repeatMs = repeatMs
    this.unseenMs = unseenMs
    this.badMs = badMs
    this.goodMs = goodMs
    this.rate = rate
    this.enabled = this.synth !== null && readPreference()
    this.voice = null
    this.reset()
  }
 
  get supported() {
    return this.synth !== null
  }
 
  setEnabled(on) {
    this.enabled = Boolean(on) && this.supported
    if (!this.enabled) this.stop()
    savePreference(this.enabled)
  }
 
  // Forget the timing state at the start of a session.
  reset() {
    this.lastSpokenAt = -Infinity
    this.lastByKey = new Map()
    this.unseenSince = null
    this.visibleSince = null
    this.badSince = null
    this.goodSince = null
    this.promptedUnseen = false
    this.wasBad = false
  }
 
  stop() {
    this.synth?.cancel()
  }
 
  // Some browsers (iOS Safari especially) only allow speech that starts inside a tap.
  // Calling this from the Start button's click handler unlocks it for the rest of the session.
  unlock() {
    if (!this.enabled) return
    const silent = new SpeechSynthesisUtterance(' ')
    silent.volume = 0
    this.synth.speak(silent)
  }
 
  // Prefer an on-device voice. Some browsers ship voices that send the text to an online
  // speech service, and the app's privacy note says nothing leaves the device.
  pickVoice() {
    if (this.voice) return this.voice
    const prefix = this.lang.slice(0, 2).toLowerCase()
    const local = this.synth
      .getVoices()
      .find((voice) => voice.localService && voice.lang?.toLowerCase().startsWith(prefix))
    this.voice = local ?? null
    return this.voice
  }
 
  /**
   * Speak a cue if it is allowed right now. Returns true when it was spoken.
   * @param {string} key  Identifies the cue so the same one is not repeated too soon.
   * @param {string} text What to say.
   * @param {object} options { urgent: interrupt current speech, cooldownMs: repeat delay for this key }
   */
  say(key, text, { urgent = false, cooldownMs = this.repeatMs } = {}) {
    if (!this.enabled) return false
 
    const now = performance.now()
    if (now - (this.lastByKey.get(key) ?? -Infinity) < cooldownMs) return false
 
    if (urgent) {
      this.synth.cancel()
    } else if (this.synth.speaking || now - this.lastSpokenAt < this.minGapMs) {
      // Never queue: a late cue describes something that already changed.
      return false
    }
 
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = this.lang
    utterance.rate = this.rate
    const voice = this.pickVoice()
    if (voice) utterance.voice = voice
    this.synth.speak(utterance)
 
    this.lastSpokenAt = now
    this.lastByKey.set(key, now)
    return true
  }
 
  /**
   * Called once per processed frame.
   * @param {object} state
   * @param {number} state.now          performance.now() for this frame.
   * @param {boolean} state.inFrame     The joints this stretch needs are visible and inside the picture.
   * @param {boolean} state.tracked     This frame was compared with the reference pose.
   * @param {boolean} state.good        Form was inside the margin of error (only read when tracked).
   * @param {string|null} state.worstJoint  Readable name of the joint furthest off, e.g. "left elbow".
   */
  update({ now, inFrame, tracked, good, worstJoint }) {
    if (!this.enabled) return
 
    if (!inFrame) {
      this.badSince = null
      this.goodSince = null
      this.visibleSince = null
      this.unseenSince ??= now
      if (now - this.unseenSince >= this.unseenMs) {
        if (this.say('stepback', 'Step back so the camera can see you.', { urgent: true })) {
          this.promptedUnseen = true
        }
      }
      return
    }
 
    this.unseenSince = null
 
    // Back in view after a "step back": say so once.
    if (this.promptedUnseen) {
      this.visibleSince ??= now
      if (now - this.visibleSince >= 400 && this.say('visible', 'I can see you now.', { cooldownMs: 0 })) {
        this.promptedUnseen = false
        this.visibleSince = null
      }
    }
 
    if (!tracked) {
      this.badSince = null
      this.goodSince = null
      return
    }
 
    if (good) {
      this.badSince = null
      this.goodSince ??= now
      if (this.wasBad && now - this.goodSince >= this.goodMs) {
        if (this.say('good', 'Good, hold it there.', { cooldownMs: 10000 })) this.wasBad = false
      }
      return
    }
 
    this.goodSince = null
    this.badSince ??= now
    if (now - this.badSince >= this.badMs) {
      this.wasBad = true
      this.say(
        `adjust:${worstJoint ?? 'form'}`,
        worstJoint ? `Adjust your ${worstJoint}.` : 'Adjust your form.',
      )
    }
  }
}