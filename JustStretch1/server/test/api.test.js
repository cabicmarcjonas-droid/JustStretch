import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { computeStreak } from '../routes/dashboard.js'
import { Exercise } from '../models/Exercise.js'
import { StretchSession } from '../models/StretchSession.js'
import { Therapist } from '../models/Therapist.js'
import { referralReason } from '../services/referral.js'
import { REFERRAL_HIGH_FATIGUE, REFERRAL_LOW_SCORE, REFERRAL_RECENT_SESSIONS } from '../shared/referral.js'

let mongod
let app

before(async () => {
  mongod = await MongoMemoryServer.create()
  const url = mongod.getUri('juststretch-test')
  await mongoose.connect(url)
  app = createApp({ mongoUrl: url })
})

after(async () => {
  await app.locals.sessionStore.close()
  await mongoose.disconnect()
  await mongod.stop()
})

// A logged-in supertest agent (keeps the session cookie).
async function signUp(name, email) {
  const agent = request.agent(app)
  const res = await agent
    .post('/api/auth/register')
    .send({ name, email, password: 'password', passwordConfirmation: 'password' })
  assert.equal(res.status, 201)
  return agent
}

const exerciseBody = (overrides = {}) => ({
  title: 'Seated Spinal Twist',
  targetArea: 'lower_back',
  difficulty: 'beginner',
  durationMinutes: 3,
  description: 'Gentle twist.',
  instructions: 'Sit tall.\nTurn right.\n\nHold.',
  benefits: ['Loosens the spine', '', '  ', 'Easy on the back', '', ''],
  precautions: '',
  videoUrl: '',
  ...overrides,
})

describe('auth', () => {
  test('register, me, logout, login', async () => {
    const agent = request.agent(app)

    const registered = await agent
      .post('/api/auth/register')
      .send({ name: 'Ada Lovelace', email: 'Ada@Example.com', password: 'password', passwordConfirmation: 'password' })
    assert.equal(registered.status, 201)
    assert.equal(registered.body.user.email, 'ada@example.com')
    assert.equal(registered.body.user.password, undefined)

    assert.equal((await agent.get('/api/auth/me')).body.user.name, 'Ada Lovelace')

    assert.equal((await agent.post('/api/auth/logout')).status, 200)
    assert.equal((await agent.get('/api/auth/me')).body.user, null)

    const bad = await agent.post('/api/auth/login').send({ email: 'ada@example.com', password: 'wrong-password' })
    assert.equal(bad.status, 422)
    assert.deepEqual(bad.body.errors.email, ['These credentials do not match our records.'])

    const ok = await agent.post('/api/auth/login').send({ email: 'ada@example.com', password: 'password' })
    assert.equal(ok.status, 200)
  })

  test('register validation mirrors Breeze', async () => {
    await signUp('Taken', 'taken@example.com')

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: 'taken@example.com', password: 'short', passwordConfirmation: 'other' })
    assert.equal(res.status, 422)
    assert.deepEqual(res.body.errors.name, ['The name field is required.'])
    assert.ok(res.body.errors.password.some((m) => m.includes('at least 8 characters')))

    const dup = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dup', email: 'taken@example.com', password: 'password', passwordConfirmation: 'password' })
    assert.deepEqual(dup.body.errors.email, ['The email has already been taken.'])
  })

  test('protected routes return 401 for guests', async () => {
    for (const path of ['/api/dashboard', '/api/exercises', '/api/sessions']) {
      assert.equal((await request(app).get(path)).status, 401, path)
    }
  })
})

describe('profile', () => {
  test('reads and saves the body map and the baseline', async () => {
    const user = await signUp('Body map', 'bodymap@example.com')

    // A new member has no body map and no baseline.
    const empty = await user.get('/api/profile')
    assert.equal(empty.status, 200)
    assert.deepEqual(empty.body.user.painAreas, [])
    assert.equal(empty.body.user.baseline.assessedAt, null)
    assert.deepEqual(empty.body.user.baseline.measurements, [])

    const saved = await user.put('/api/profile').send({
      painAreas: ['neck', 'lower_back'],
      baseline: {
        assessedAt: '2026-10-21T00:00:00.000Z',
        measurements: [
          { test: 'sit_and_reach', value: 8.5, unit: 'cm' },
          { test: 'neck_range', value: 4, unit: '1-5' },
        ],
      },
    })
    assert.equal(saved.status, 200)
    assert.deepEqual(saved.body.user.painAreas, ['neck', 'lower_back'])
    assert.equal(saved.body.user.baseline.assessedAt, '2026-10-21T00:00:00.000Z')
    assert.deepEqual(saved.body.user.baseline.measurements, [
      { test: 'sit_and_reach', value: 8.5, unit: 'cm' },
      { test: 'neck_range', value: 4, unit: '1-5' },
    ])

    // It comes back on the next read.
    const reloaded = await user.get('/api/profile')
    assert.deepEqual(reloaded.body.user.painAreas, ['neck', 'lower_back'])
    assert.equal(reloaded.body.user.baseline.measurements.length, 2)
  })

  test('never changes the name, the email or the password', async () => {
    const user = await signUp('Locked down', 'locked@example.com')
    const before = await user.get('/api/profile')

    const saved = await user.put('/api/profile').send({
      name: 'Hacked',
      email: 'hacked@example.com',
      password: 'newpassword',
      painAreas: ['hips'],
    })
    assert.equal(saved.status, 200)
    assert.equal(saved.body.user.name, before.body.user.name)
    assert.equal(saved.body.user.email, before.body.user.email)
    assert.equal(saved.body.user.password, undefined)

    // The email still works for logging in, and the old password still does.
    const login = await request(app).post('/api/auth/login').send({ email: 'locked@example.com', password: 'password' })
    assert.equal(login.status, 200)
  })

  test('rejects pain areas and measurements that make no sense', async () => {
    const user = await signUp('Validator', 'profile-validator@example.com')

    const badArea = await user.put('/api/profile').send({ painAreas: ['spine'] })
    assert.equal(badArea.status, 422)
    assert.deepEqual(badArea.body.errors['painAreas.0'], ['The selected pain area is invalid.'])

    const badRange = await user.put('/api/profile').send({
      baseline: { measurements: [{ test: 'neck_range', value: 9, unit: '1-5' }] },
    })
    assert.equal(badRange.status, 422)
    assert.deepEqual(badRange.body.errors['baseline.measurements.0.value'], ['The neck range must be a whole number between 1 and 5.'])

    const badValue = await user.put('/api/profile').send({
      baseline: { measurements: [{ test: 'sit_and_reach', value: 'far', unit: 'cm' }] },
    })
    assert.equal(badValue.status, 422)
    assert.ok(badValue.body.errors['baseline.measurements.0.value'])
  })

  test('needs a session', async () => {
    assert.equal((await request(app).get('/api/profile')).status, 401)
    assert.equal((await request(app).put('/api/profile').send({ painAreas: [] })).status, 401)
  })
})

describe('exercises', () => {
  test('create validates, then author-only update/delete (403 for others)', async () => {
    const author = await signUp('Author', 'author@example.com')
    const other = await signUp('Other', 'other@example.com')

    const invalid = await author.post('/api/exercises').send(exerciseBody({ benefits: ['', ' '], videoUrl: 'not a url' }))
    assert.equal(invalid.status, 422)
    assert.deepEqual(invalid.body.errors.benefits, ['Add at least one benefit.'])
    assert.deepEqual(invalid.body.errors.videoUrl, [
      'The video URL must be a full link or a path like /videos/stretch.mp4.',
    ])

    const created = await author.post('/api/exercises').send(exerciseBody())
    assert.equal(created.status, 201)
    const { exercise } = created.body
    assert.deepEqual(exercise.benefits, ['Loosens the spine', 'Easy on the back'])
    assert.equal(exercise.precautions, null)
    assert.equal(exercise.author.name, 'Author')

    const url = `/api/exercises/${exercise.id}`
    assert.equal((await other.put(url).send(exerciseBody({ title: 'Hijack' }))).status, 403)
    assert.equal((await other.delete(url)).status, 403)
    assert.equal((await other.get(url)).status, 200)

    const updated = await author.put(url).send(exerciseBody({ title: 'Renamed', videoUrl: '/videos/stretch.mp4' }))
    assert.equal(updated.status, 200)
    assert.equal(updated.body.exercise.title, 'Renamed')

    assert.equal((await author.delete(url)).status, 200)
    assert.equal((await author.get(url)).status, 404)
  })

  test('index filters, searches case-insensitively and paginates 9 per page', async () => {
    const user = await signUp('Lister', 'lister@example.com')
    await Exercise.deleteMany({})
    for (let i = 1; i <= 11; i++) {
      await user.post('/api/exercises').send(exerciseBody({ title: `Twist ${i}`, targetArea: i % 2 ? 'neck' : 'hips' }))
    }

    const page1 = await user.get('/api/exercises')
    assert.equal(page1.body.data.length, 9)
    assert.deepEqual(page1.body.meta, { page: 1, lastPage: 2, total: 11, areaCounts: { neck: 6, hips: 5 } })
    assert.equal((await user.get('/api/exercises?page=2')).body.data.length, 2)

    assert.equal((await user.get('/api/exercises?search=TWIST 1')).body.meta.total, 3) // 1, 10, 11
    const neck = (await user.get('/api/exercises?area=neck')).body.meta
    assert.equal(neck.total, 6)
    // Chip counts ignore the selected area, so the other chips still show their totals.
    assert.deepEqual(neck.areaCounts, { neck: 6, hips: 5 })
    assert.deepEqual((await user.get('/api/exercises?search=TWIST 1')).body.meta.areaCounts, { neck: 2, hips: 1 })
    assert.equal((await user.get('/api/exercises?difficulty=advanced')).body.meta.total, 0)
  })
})

describe('sessions', () => {
  test('create, list own only, owner-only delete, cascade on exercise delete', async () => {
    const owner = await signUp('Owner', 'session-owner@example.com')
    const other = await signUp('Intruder', 'intruder@example.com')
    const { exercise } = (await owner.post('/api/exercises').send(exerciseBody({ title: 'Cascade me' }))).body

    const invalid = await owner.post(`/api/exercises/${exercise.id}/sessions`).send({ score: 101 })
    assert.equal(invalid.status, 422)
    assert.deepEqual(invalid.body.errors.score, ['The score field must be between 0 and 100.'])

    const saved = await owner
      .post(`/api/exercises/${exercise.id}/sessions`)
      .send({ score: 82, durationSeconds: 95, notes: 'Felt good.' })
    assert.equal(saved.status, 201)
    assert.equal(saved.body.message, 'Session saved for "Cascade me". Nice work!')

    const list = await owner.get('/api/sessions')
    assert.equal(list.body.meta.total, 1)
    assert.equal(list.body.data[0].exercise.title, 'Cascade me')
    assert.deepEqual(list.body.exercises, [{ id: exercise.id, title: 'Cascade me' }])
    assert.equal(list.body.summary.count, 1)
    assert.equal(list.body.summary.averageScore, 82)
    assert.equal(list.body.summary.totalSeconds, 95)
    assert.equal(list.body.summary.best.title, 'Cascade me')
    assert.deepEqual(
      list.body.history.map((h) => h.score),
      [82],
    )
    // The exercise filter also narrows the summary.
    assert.equal((await owner.get(`/api/sessions?exercise=${exercise.id}`)).body.summary.count, 1)

    const detail = await owner.get(`/api/exercises/${exercise.id}`)
    assert.deepEqual(detail.body.stats, { attempts: 1, best: 82, averageScore: 82 })
    assert.equal((await other.get('/api/sessions')).body.meta.total, 0)

    const sessionId = saved.body.session.id
    assert.equal((await other.delete(`/api/sessions/${sessionId}`)).status, 403)
    assert.equal((await owner.delete(`/api/sessions/${sessionId}`)).status, 200)
    assert.equal((await owner.get('/api/sessions')).body.meta.total, 0)

    await owner.post(`/api/exercises/${exercise.id}/sessions`).send({ score: 70 })
    await owner.delete(`/api/exercises/${exercise.id}`)
    assert.equal(await StretchSession.countDocuments({ exercise: exercise.id }), 0)
  })

  test('stores the tracking results with the session', async () => {
    const user = await signUp('Tracker', 'tracker@example.com')
    const { exercise } = (await user.post('/api/exercises').send(exerciseBody({ title: 'Tracked stretch' }))).body

    const metrics = {
      jointResults: [
        { joint: 'neck_tilt', avgError: 4.25, timeInRangePct: 91 },
        { joint: 'left_shoulder', avgError: 11.8, timeInRangePct: 64 },
      ],
      judgedFrames: 412,
      framesWithinMargin: 321,
      trackingScore: 78,
      droppedFrames: 18,
      fatigue: 3,
    }

    const saved = await user.post(`/api/exercises/${exercise.id}/sessions`).send({ score: 82, durationSeconds: 95, ...metrics })
    assert.equal(saved.status, 201)
    assert.deepEqual(saved.body.session.jointResults, metrics.jointResults)
    assert.equal(saved.body.session.judgedFrames, 412)
    assert.equal(saved.body.session.framesWithinMargin, 321)
    assert.equal(saved.body.session.trackingScore, 78)
    assert.equal(saved.body.session.droppedFrames, 18)
    assert.equal(saved.body.session.fatigue, 3)

    // The list carries the same results.
    const list = await user.get('/api/sessions')
    assert.deepEqual(list.body.data[0].jointResults, metrics.jointResults)
    assert.equal(list.body.data[0].trackingScore, 78)

    // And so does the detail endpoint.
    const detail = await user.get(`/api/sessions/${saved.body.session.id}`)
    assert.equal(detail.status, 200)
    assert.equal(detail.body.session.exercise.title, 'Tracked stretch')
    assert.deepEqual(detail.body.session.jointResults, metrics.jointResults)
    assert.equal(detail.body.session.judgedFrames, 412)
    assert.equal(detail.body.session.framesWithinMargin, 321)
    assert.equal(detail.body.session.trackingScore, 78)
    assert.equal(detail.body.session.droppedFrames, 18)
    assert.equal(detail.body.session.fatigue, 3)
  })

  test('rejects tracking results that are out of range', async () => {
    const user = await signUp('Validator', 'validator@example.com')
    const { exercise } = (await user.post('/api/exercises').send(exerciseBody({ title: 'Validated stretch' }))).body
    const url = `/api/exercises/${exercise.id}/sessions`

    const badScore = await user.post(url).send({ score: 80, trackingScore: 120 })
    assert.equal(badScore.status, 422)
    assert.deepEqual(badScore.body.errors.trackingScore, ['The tracking score field must be between 0 and 100.'])

    const badFatigue = await user.post(url).send({ score: 80, fatigue: 6 })
    assert.equal(badFatigue.status, 422)
    assert.deepEqual(badFatigue.body.errors.fatigue, ['The fatigue field must be between 1 and 5.'])

    const badPct = await user.post(url).send({ score: 80, jointResults: [{ joint: 'neck_tilt', avgError: 4, timeInRangePct: 140 }] })
    assert.equal(badPct.status, 422)
    assert.deepEqual(badPct.body.errors['jointResults.0.timeInRangePct'], ['The time in range percentage field must be between 0 and 100.'])

    const badError = await user.post(url).send({ score: 80, jointResults: [{ joint: 'neck_tilt', avgError: -1, timeInRangePct: 50 }] })
    assert.equal(badError.status, 422)
    assert.deepEqual(badError.body.errors['jointResults.0.avgError'], ['The average error field must be between 0 and 180.'])

    const notAnArray = await user.post(url).send({ score: 80, jointResults: 'neck_tilt' })
    assert.equal(notAnArray.status, 422)
    assert.deepEqual(notAnArray.body.errors.jointResults, ['The joint results field must be an array.'])

    // Frames within the margin are a subset of the judged frames.
    const impossible = await user.post(url).send({ score: 80, judgedFrames: 10, framesWithinMargin: 20 })
    assert.equal(impossible.status, 422)
    assert.deepEqual(impossible.body.errors.framesWithinMargin, [
      'The frames within margin field cannot be greater than the judged frames field.',
    ])
  })

  test('keeps sessions valid without tracking results', async () => {
    const user = await signUp('Legacy', 'legacy@example.com')
    const { exercise } = (await user.post('/api/exercises').send(exerciseBody({ title: 'Self rated stretch' }))).body

    const saved = await user.post(`/api/exercises/${exercise.id}/sessions`).send({ score: 70, durationSeconds: 60 })
    assert.equal(saved.status, 201)
    assert.deepEqual(saved.body.session.jointResults, [])
    assert.equal(saved.body.session.judgedFrames, null)
    assert.equal(saved.body.session.framesWithinMargin, null)
    assert.equal(saved.body.session.trackingScore, null)
    assert.equal(saved.body.session.droppedFrames, null)
    assert.equal(saved.body.session.fatigue, null)
  })

  test('only the owner can open a session', async () => {
    const owner = await signUp('Session owner', 'session-owner-2@example.com')
    const other = await signUp('Someone else', 'someone-else@example.com')
    const { exercise } = (await owner.post('/api/exercises').send(exerciseBody({ title: 'Private stretch' }))).body
    const saved = await owner.post(`/api/exercises/${exercise.id}/sessions`).send({ score: 60 })
    const sessionId = saved.body.session.id

    assert.equal((await owner.get(`/api/sessions/${sessionId}`)).status, 200)
    assert.equal((await other.get(`/api/sessions/${sessionId}`)).status, 403)
    assert.equal((await owner.get('/api/sessions/not-an-id')).status, 404)
    assert.equal((await owner.get('/api/sessions/507f1f77bcf86cd799439011')).status, 404)
  })

  test('dashboard reports stats and suggestions', async () => {
    const user = await signUp('Stats', 'stats@example.com')
    const { exercise } = (await user.post('/api/exercises').send(exerciseBody({ title: 'Stats stretch' }))).body
    await user.post(`/api/exercises/${exercise.id}/sessions`).send({ score: 80, durationSeconds: 120 })
    await user.post(`/api/exercises/${exercise.id}/sessions`).send({ score: 60, durationSeconds: 60 })

    const { body } = await user.get('/api/dashboard')
    assert.equal(body.totalSessions, 2)
    assert.equal(body.averageScore, 70)
    assert.equal(body.topArea, 'lower_back')
    assert.equal(body.topAreaSessions, 2)
    assert.equal(body.recentSessions.length, 2)
    assert.ok(body.suggestions.length >= 1)
    // Oldest first, for the chart.
    assert.deepEqual(
      body.scoreHistory.map((h) => h.score),
      [80, 60],
    )
    assert.equal(body.previousAverageScore, null)
    assert.equal(body.recentDays.length, 7)
    assert.equal(body.recentDays[6].active, true)
  })
})

describe('streak', () => {
  // 2026-10-15 12:00 in Manila
  const now = new Date('2026-10-15T04:00:00Z')

  test('counts consecutive Manila days ending today or yesterday', () => {
    assert.equal(computeStreak(new Set(), now), 0)
    assert.equal(computeStreak(new Set(['2026-10-15']), now), 1)
    assert.equal(computeStreak(new Set(['2026-10-15', '2026-10-14', '2026-10-13']), now), 3)
    assert.equal(computeStreak(new Set(['2026-10-14', '2026-10-13']), now), 2) // ended yesterday
    assert.equal(computeStreak(new Set(['2026-10-13', '2026-10-12']), now), 0) // ended 2 days ago
    assert.equal(computeStreak(new Set(['2026-10-15', '2026-10-13']), now), 1) // gap breaks it
  })

  test('uses the Manila date, not UTC', () => {
    // 2026-10-14 17:00Z is already 2026-10-15 01:00 in Manila
    const lateNight = new Date('2026-10-14T17:00:00Z')
    assert.equal(computeStreak(new Set(['2026-10-15']), lateNight), 1)
  })

  test('dashboard reports a streak from real sessions', async () => {
    const user = await signUp('Streaky', 'streaky@example.com')
    const { exercise } = (await user.post('/api/exercises').send(exerciseBody({ title: 'Streak stretch' }))).body
    assert.equal((await user.get('/api/dashboard')).body.streak, 0)
    await user.post(`/api/exercises/${exercise.id}/sessions`).send({ score: 70 })
    assert.equal((await user.get('/api/dashboard')).body.streak, 1)
  })
})

describe('referral', () => {
  // Seeds the sample therapists once; the threshold numbers come from shared/referral.js.
  before(async () => {
    const { seedTherapists } = await import('../src/seed.js')
    if ((await Therapist.countDocuments()) === 0) await seedTherapists()
  })

  const save = (agent, exercise, body) => agent.post(`/api/exercises/${exercise.id}/sessions`).send(body)

  test('flags persistent low scores in one body area and returns a matching therapist', async () => {
    const user = await signUp('Struggling', 'struggling@example.com')
    // Two different neck exercises: the rule looks at the body area, not one exercise.
    const a = (await user.post('/api/exercises').send(exerciseBody({ title: 'Neck A', targetArea: 'neck' }))).body.exercise
    const b = (await user.post('/api/exercises').send(exerciseBody({ title: 'Neck B', targetArea: 'neck' }))).body.exercise
    const low = REFERRAL_LOW_SCORE - 10

    for (let i = 1; i < REFERRAL_RECENT_SESSIONS; i += 1) {
      const res = await save(user, i % 2 ? a : b, { score: low })
      assert.equal(res.status, 201)
      assert.equal(res.body.referral, null, 'no referral before enough sessions')
    }

    const res = await save(user, a, { score: low })
    assert.equal(res.status, 201)
    assert.equal(res.body.referral.reason, 'low_scores')
    assert.equal(res.body.referral.area, 'neck')
    assert.match(res.body.referral.message, /scored below/)
    assert.ok(res.body.referral.therapist.areas.includes('neck'))
    assert.ok(res.body.referral.therapist.phone)
    assert.match(res.body.message, /physical therapist/)

    // The flag is stored on the session and the detail page gets the full contact.
    const detail = await user.get(`/api/sessions/${res.body.session.id}`)
    assert.equal(detail.body.session.referral.reason, 'low_scores')
    assert.equal(detail.body.session.referral.therapist.name, res.body.referral.therapist.name)
    assert.match(detail.body.session.referral.message, /scored below/)
  })

  test('one good session in the window means no referral', async () => {
    const user = await signUp('Mixed', 'mixed@example.com')
    const ex = (await user.post('/api/exercises').send(exerciseBody({ title: 'Hip opener', targetArea: 'hips' }))).body.exercise
    const scores = Array.from({ length: REFERRAL_RECENT_SESSIONS }, (_, i) => (i === 1 ? REFERRAL_LOW_SCORE : REFERRAL_LOW_SCORE - 5))
    let last
    for (const score of scores) last = await save(user, ex, { score })
    assert.equal(last.body.referral, null)
  })

  test('low scores in different body areas do not add up', async () => {
    const user = await signUp('Spread', 'spread@example.com')
    const areas = ['neck', 'hips', 'calves']
    let last
    for (const area of areas.slice(0, REFERRAL_RECENT_SESSIONS)) {
      const ex = (await user.post('/api/exercises').send(exerciseBody({ title: `Stretch ${area}`, targetArea: area }))).body.exercise
      last = await save(user, ex, { score: 10 })
    }
    assert.equal(last.body.referral, null)
  })

  test('flags persistent high fatigue even when the scores are fine', async () => {
    const user = await signUp('Tired', 'tired@example.com')
    const ex = (await user.post('/api/exercises').send(exerciseBody({ title: 'Hamstring reach', targetArea: 'hamstrings' }))).body.exercise
    let last
    for (let i = 0; i < REFERRAL_RECENT_SESSIONS; i += 1) last = await save(user, ex, { score: 85, fatigue: REFERRAL_HIGH_FATIGUE })
    assert.equal(last.body.referral.reason, 'high_fatigue')
    assert.ok(last.body.referral.therapist.areas.includes('hamstrings'))
  })

  test('falls back to a general therapist when no specialist matches', async () => {
    await Therapist.updateMany({ areas: 'lower_back' }, { $pull: { areas: 'lower_back' } })
    const user = await signUp('Backache', 'backache@example.com')
    const ex = (await user.post('/api/exercises').send(exerciseBody({ title: 'Cat cow', targetArea: 'lower_back' }))).body.exercise
    let last
    for (let i = 0; i < REFERRAL_RECENT_SESSIONS; i += 1) last = await save(user, ex, { score: 5 })
    assert.equal(last.body.referral.reason, 'low_scores')
    assert.deepEqual(last.body.referral.therapist.areas, [])
  })

  test('referralReason needs a full window', () => {
    assert.equal(referralReason([{ score: 1 }]), null)
    const full = Array.from({ length: REFERRAL_RECENT_SESSIONS }, () => ({ score: 1, fatigue: null }))
    assert.equal(referralReason(full), 'low_scores')
  })
})

describe('performance data', () => {
  test('stores the perf summary and reports Server-Timing', async () => {
    const user = await signUp('Perf', 'perf@example.com')
    const ex = (await user.post('/api/exercises').send(exerciseBody({ title: 'Perf stretch' }))).body.exercise
    const perf = {
      frames: 1790,
      seconds: 60,
      fps: 29.8,
      latencyMs: { avg: 41.2, min: 20.1, max: 140.3, p95: 63.9 },
      processMs: { avg: 18.4, min: 9.9, max: 120.5, p95: 27.1 },
      droppedPct: 1.2,
      noPosePct: 0.4,
      overBudgetPct: 2.1,
      injectedDelays: 3,
      outOfOrderFrames: 0,
    }
    const res = await user.post(`/api/exercises/${ex.id}/sessions`).send({ score: 80, perf })
    assert.equal(res.status, 201)
    assert.deepEqual(res.body.session.perf, perf)
    assert.match(res.headers['server-timing'], /^app;dur=\d+(\.\d)?$/)

    const bad = await user.post(`/api/exercises/${ex.id}/sessions`).send({ score: 80, perf: { droppedPct: 140 } })
    assert.equal(bad.status, 422)
  })
})
