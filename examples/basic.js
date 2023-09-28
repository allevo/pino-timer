'use strict'

import pino from 'pino'
import PinoTimer from '../index.js'

const pinoTimer = PinoTimer(pino())

const timer = pinoTimer.startTimer({
  label: 'Insert todo',
  // other properties to add to the log
  userId: '123',
}, 'Start inserting todo')
const todoId = await makeQuery()
timer.end({ todoId }, 'ended')


function makeQuery() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('123')
    }, 1000)
  })
}