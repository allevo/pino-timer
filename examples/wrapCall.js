'use strict'

import pino from 'pino'
import PinoTimer from '../index.js'

const pinoTimer = PinoTimer(pino())

async function makeQuery () {
  // make some async operation
  return new Promise((resolve) => {
    setTimeout(resolve, 1000, '123')
  })
}

const r = await pinoTimer.wrapCall('makeQuery', makeQuery)

console.log(r) // r === '123'
