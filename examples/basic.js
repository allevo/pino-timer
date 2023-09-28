'use strict'

import pino from 'pino'
import PinoTimer from '../index.js'

const pinoTimer = PinoTimer(pino())

const timer = pinoTimer.startTimer({
  label: 'Insert todo',
  // other properties to add to the log
  userId: '123'
}, 'Start inserting todo')
try {
  const todoId = await makeQuery()
  timer.end({ todoId }, 'ended')
} catch (e) {
  timer.endWithError(e, 'error')
}

async function makeQuery () {
  if (Math.random() > 0.5) throw new Error('KABOOM')
  return new Promise((resolve) => {
    setTimeout(resolve, 1000, '123')
  })
}
