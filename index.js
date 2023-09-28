'use strict'

const timers = Symbol('timers')

function pinoTimer (pinoInstance) {
  function get (target, name) {
    switch (name) {
      case 'startTimer':
        return startTimer
      case 'track':
        return track
      case 'end':
        return end
      default:
        return target[name]
    }
  }

  function startTimer({ label, ...rest }, msg) {
    const child = this.child({ [label]: true, ...rest })
    child.startTime = Date.now()
    child.previusTime = child.startTime
    child.info(msg)
    return child
  }
  function track(obj, msg) {
    if (msg === undefined) {
      msg = obj
      obj = {}
    }
    const now = Date.now()
    this.info({
      ...obj,
      'delta': now - this.previusTime,
    }, msg)
    this.previusTime = now
  }
  function end(obj, msg) {
    if (msg === undefined) {
      msg = obj
      obj = {}
    }
    const now = Date.now()

    this.info({
      ...obj,
      'delta': now - this.previusTime,
      'totalDelta': now - this.startTime,
    }, msg)
    this.previusTime = now
  }

  return new Proxy(pinoInstance, { get })
}

/**
 * These export configurations enable JS and TS developers
 * to consumer pino-timer in whatever way best suits their needs.
 * Some examples of supported import syntax includes:
 * - `const pinoTimer = require('pino-timer')`
 * - `const { pinoTimer } = require('pino-timer')`
 * - `import * as pinoTimer from 'pino-timer'`
 * - `import { pinoTimer } from 'pino-timer'`
 * - `import pinoTimer from 'pino-timer'`
 */
pinoTimer.pinoCaller = pinoTimer
pinoTimer.default = pinoTimer
module.exports = pinoTimer
