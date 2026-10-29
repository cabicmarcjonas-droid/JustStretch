import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { createMemoryMailer } from '../services/mailer.js'

let mongod
let app
let mailer

before(async () => {
  mongod = await MongoMemoryServer.create()
  const url = mongod.getUri('juststretch-rate-limit-test')
  await mongoose.connect(url)
  mailer = createMemoryMailer()
  app = createApp({ mongoUrl: url, mailer, rateLimits: true })
})

after(async () => {
  await app.locals.sessionStore.close()
  await mailer.close()
  await mongoose.disconnect()
  await mongod.stop()
})

test('login is rate limited per address and email', async () => {
  const body = { email: 'rate-limit@example.com', password: 'wrong-password' }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const res = await request(app).post('/api/auth/login').send(body)
    assert.equal(res.status, 422)
  }

  const limited = await request(app).post('/api/auth/login').send(body)
  assert.equal(limited.status, 429)
  assert.match(limited.body.message, /Too many attempts/)

  const otherEmail = await request(app)
    .post('/api/auth/login')
    .send({ email: 'different@example.com', password: 'wrong-password' })
  assert.equal(otherEmail.status, 422)
})
