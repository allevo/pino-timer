'use strict'

import pino from 'pino'
import PinoTimer from '../index.js'

const pinoTimer = PinoTimer(pino())

const outerOperationTimer = pinoTimer.startTimer({
  label: 'outer operation'
}, 'Starting...')
{
  const middleTimer = outerOperationTimer.startTimer({
    label: 'middle operation'
  }, 'Starting')

  {
    const innerTimer1 = middleTimer.startTimer({
      label: 'inner operation 1'
    }, 'Starting')

    await asyncOperation()

    innerTimer1.track('doing something...')

    const result = await asyncOperation()

    innerTimer1.end({ result }, 'ended')
  }

  middleTimer.info('first operation is done, starting second operation...')

  {
    const innerTimer2 = middleTimer.startTimer({
      label: 'inner operation 2'
    }, 'Starting')

    await asyncOperation()

    innerTimer2.track('doing something...')

    const todoId = await asyncOperation()

    innerTimer2.end({ todoId }, 'ended')
  }

  middleTimer.end('ended')
}

outerOperationTimer.end('ended')

function asyncOperation () {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('123')
    }, 1000)
  })
}
