import t = require('tap')
import pino = require('pino')
import * as through2 from 'through2'
import pinoTimer from '../'

t.test('pino timer works with typescript', async function (t) {
  let logs: any[] = []
  const pinoInstance = pinoTimer(pino(through2(function (chunk, enc, callback) {
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

  t.equal(logs[0].middleware, true)
  t.equal(logs[0].msg, 'A message')
  t.equal(logs[1].msg, 'middle1')
  t.equal(logs[2].baz, 'baz')
  t.equal(logs[2].msg, 'middle2')
  t.equal(logs[3].bar, 'bar')
  t.equal(logs[3].msg, 'end')

  t.end()
})