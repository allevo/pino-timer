'use strict'

import pino from 'pino'
import PinoTimer from '../index.js'

const pinoTimer = PinoTimer(pino())

async function makeQuery (logger) {
  logger.track('some msg')

  await logger.wrapCall('nestedCall', async logger => {
    // make some async operation
  })
  // make some async operation
  logger.track('other msg')

  return '123'
}

const r = await pinoTimer.wrapCall('makeQuery', logger => makeQuery(logger))

console.log(r) // r === '123'
