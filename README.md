# pino-timer
[![Build Status](https://img.shields.io/github/actions/workflow/status/allevo/pino-timer/.github/workflows/node.js.yml?branch=main)](https://github.com/allevo/pino-timer/actions)
[![Coverage Status](https://coveralls.io/repos/github/allevo/pino-timer/badge.svg?branch=main)](https://coveralls.io/github/allevo/pino-timer?branch=main)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://standardjs.com/)


## Description
`pino-timer` is a wrapper for [pino](https://github.com/pinojs/pino) which adds some utilities to calculate delta like `console.time` and `console.endTime`.
This can be useful when developing with large codebases in order to track which operation tooks time.

## Install

```
npm install pino-timer
```

## Usage

### Basic

```js
'use strict'

const pino = require('pino')()
const pinoTimer = require('pino-timer')(pino)

async function makeQuery() {
  // make some async operation
  return new Promise((resolve) => {
    setTimeout(resolve, 1000, '123')
  })
}

const timer = pinoTimer.startTimer({
  label: 'Insert todo',
  // other properties to add to the log
  userId: '123',
}, 'Start inserting todo')
try {
  const todoId = await makeQuery()
  timer.end({ todoId }, 'ended')
} catch (e) {
  timer.endWithError(e, 'error')
}
```

You can run the example above with:
```sh
npm run example basic.js | pino-pretty
```

The output will be something like:
```
[14:01:29.616] INFO (60789): Start inserting todo
    Insert todo: true
    userId: "123"
[14:01:30.618] INFO (60789): ended
    Insert todo: true
    userId: "123"
    todoId: "123"
    delta: 1002
    totalDelta: 1002
```

### `wrapCall`

`pino-timer` supports also a `wrapCall` function which wraps a function and logs the time it tooks to execute it.

```js
'use strict'

const pino = require('pino')()
const pinoTimer = require('pino-timer')(pino)

async function makeQuery(logger) {
  logger.track('some msg')

  await logger.wrapCall('nestedCall' , async logger => {
    // make some async operation
  })
  // make some async operation
  logger.track('other msg')

  return '123'
}

const r = await pinoTimer.wrapCall('makeQuery', logger => makeQuery(logger))

console.log(r) // r === '123'
```

You can run the example above with:
```sh
npm run example wrapCall.js | pino-pretty
```

The output will be something like:
```
[18:04:17.224] INFO (94199): start
    makeQuery: true
123
[18:04:17.224] INFO (94199): some msg
    makeQuery: true
    delta: 0
[18:04:17.224] INFO (94199): start
    makeQuery: true
    nestedCall: true
[18:04:17.224] INFO (94199): done
    makeQuery: true
    nestedCall: true
    delta: 0
    totalDelta: 0
[18:04:17.224] INFO (94199): other msg
    makeQuery: true
    delta: 0
[18:04:17.224] INFO (94199): done
    makeQuery: true
    delta: 0
    totalDelta: 0
```

### Advanced

`pino-timer` supports also nested timers, in order to track nested operations.

```js
'use strict'

const pino = require('pino')()
const pinoTimer = require('pino-timer')(pino)

const outerOperationTimer = pinoTimer.startTimer({
  label: 'outer operation',
}, 'Starting...')
{
  const middleTimer = outerOperationTimer.startTimer({
    label: 'middle operation',
  }, 'Starting')

  {
    const innerTimer1 = middleTimer.startTimer({
      label: 'inner operation 1',
    }, 'Starting')

    // make some async operation

    innerTimer1.track('doing something...')

    // make another async operation

    innerTimer1.end({ todoId }, 'ended')
  }

  innerTimer1.info('first operation is done, starting second operation...')

  {
    const innerTimer2 = middleTimer.startTimer({
      label: 'inner operation 2',
    }, 'Starting')

    // make some async operation

    innerTimer2.track('doing something...')

    // make another async operation

    innerTimer2.end({ todoId }, 'ended')
  }

  middleTimer.end('ended')
}

outerOperationTimer.end({ todoId }, 'ended')
```

You can run the example above with:
```sh
npm run example  advanced.js | pino-pretty
```

The output will be something like:
```
[14:04:15.658] INFO (60879): Starting...
    outer operation: true
[14:04:15.658] INFO (60879): Starting
    outer operation: true
    middle operation: true
[14:04:15.658] INFO (60879): Starting
    outer operation: true
    middle operation: true
    inner operation 1: true
[14:04:16.661] INFO (60879): doing something...
    outer operation: true
    middle operation: true
    inner operation 1: true
    delta: 1003
[14:04:17.662] INFO (60879): ended
    outer operation: true
    middle operation: true
    inner operation 1: true
    result: "123"
    delta: 1001
    totalDelta: 2004
[14:04:17.663] INFO (60879): first operation is done, starting second operation...
    outer operation: true
    middle operation: true
[14:04:17.663] INFO (60879): Starting
    outer operation: true
    middle operation: true
    inner operation 2: true
[14:04:18.664] INFO (60879): doing something...
    outer operation: true
    middle operation: true
    inner operation 2: true
    delta: 1001
[14:04:19.666] INFO (60879): ended
    outer operation: true
    middle operation: true
    inner operation 2: true
    todoId: "123"
    delta: 1002
    totalDelta: 2003
[14:04:19.666] INFO (60879): ended
    outer operation: true
    middle operation: true
    delta: 4008
    totalDelta: 4008
[14:04:19.667] INFO (60879): ended
    outer operation: true
    delta: 4008
    totalDelta: 4008
```
