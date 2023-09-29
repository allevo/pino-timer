///<reference path='../index.d.ts' />

import * as through2 from 'through2'
import pinoTimer, { TimerLogger } from '../'
import t = require('tap')
import pino = require('pino')

t.test('pino timer works with typescript', async function (t: any) {
  let logs: any[] = []
  const pinoInstance = pinoTimer(pino.pino(through2(function (chunk, enc, callback) {
    const res = JSON.parse(chunk.toString('utf8'))
    logs.push(res)
    callback()
  })))

  const timer = pinoInstance.startTimer({
    label: 'middleware',
    foo: 'foo',
  }, 'A message')
  timer.track('middle1')
  timer.track({
    baz: 'baz'
  }, 'middle2')
  timer.end({
    bar: 'bar'
  }, 'end')

  t.equal(logs.length, 4)

  t.equal(logs[0]['b.0'], 'middleware')
  t.equal(logs[0].msg, 'A message')
  t.equal(logs[1].msg, 'middle1')
  t.equal(logs[2].baz, 'baz')
  t.equal(logs[2].msg, 'middle2')
  t.equal(logs[3].bar, 'bar')
  t.equal(logs[3].msg, 'end')

  t.test('child works', async function (t: any) {
    const child = pinoInstance.child({})
    const childTimer = child.startTimer({
      label: 'middleware',
      foo: 'foo',
    }, 'A message')

    childTimer.track('middle1')

    childTimer.end('foo')
  })

  t.test('wrapCall works', async function (t: any) {
    const res = pinoInstance.wrapCall('wrapCall', (logger: TimerLogger) => {
      return 'foo'
    })
    t.equal(res, 'foo')

    const error = new Error('KABOOM')
    try {
      pinoInstance.wrapCall('wrapCall', (logger: TimerLogger) => {
        throw error
      })
    } catch (err) {
      t.equal(err, error)
    }

    const res2 = await pinoInstance.wrapCall('wrapCall', async (logger: TimerLogger) => {
      return 'foo'
    })
    t.equal(res2, 'foo')

    try {
      await pinoInstance.wrapCall('wrapCall', async (logger: TimerLogger) => {
        throw error
      })
    } catch (err) {
      t.equal(err, error)
    }
  })

  t.end()
})
