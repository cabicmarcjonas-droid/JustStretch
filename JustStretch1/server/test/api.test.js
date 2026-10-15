import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { computeStreak } from '../routes/dashboard.js'
import { Exercise } from '../models/Exercise.js'
import { StretchSession } from '../models/StretchSession.js'

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
    assert.deepEqual(page1.body.meta, { page: 1, lastPage: 2, total: 11 })
    assert.equal((await user.get('/api/exercises?page=2')).body.data.length, 2)

    assert.equal((await user.get('/api/exercises?search=TWIST 1')).body.meta.total, 3) // 1, 10, 11
    assert.equal((await user.get('/api/exercises?area=neck')).body.meta.total, 6)
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
    assert.equal((await other.get('/api/sessions')).body.meta.total, 0)

    const sessionId = saved.body.session.id
    assert.equal((await other.delete(`/api/sessions/${sessionId}`)).status, 403)
    assert.equal((await owner.delete(`/api/sessions/${sessionId}`)).status, 200)
    assert.equal((await owner.get('/api/sessions')).body.meta.total, 0)

    await owner.post(`/api/exercises/${exercise.id}/sessions`).send({ score: 70 })
    await owner.delete(`/api/exercises/${exercise.id}`)
    assert.equal(await StretchSession.countDocuments({ exercise: exercise.id }), 0)
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
    assert.equal(body.recentSessions.length, 2)
    assert.ok(body.suggestions.length >= 1)
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
