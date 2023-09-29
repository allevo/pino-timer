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
[12:07:05.393] INFO (9400): Start inserting todo
    userId: "123"
    b.0: "Insert todo"
[12:07:06.397] INFO (9400): ended
    userId: "123"
    b.0: "Insert todo"
    todoId: "123"
    delta: 1004
    totalDelta: 1004
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
[12:07:38.838] INFO (9446): start
    b.0: "makeQuery"
[12:07:38.838] INFO (9446): some msg
    b.0: "makeQuery"
    delta: 0
[12:07:38.838] INFO (9446): start
    b.0: "makeQuery"
    b.1: "nestedCall"
[12:07:38.838] INFO (9446): done
    b.0: "makeQuery"
    b.1: "nestedCall"
    delta: 0
    totalDelta: 0
[12:07:38.838] INFO (9446): other msg
    b.0: "makeQuery"
    delta: 0
[12:07:38.838] INFO (9446): done
    b.0: "makeQuery"
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
[12:08:05.936] INFO (9476): Starting...
    b.0: "outer operation"
[12:08:05.936] INFO (9476): Starting
    b.0: "outer operation"
    b.1: "middle operation"
[12:08:05.936] INFO (9476): Starting
    b.0: "outer operation"
    b.1: "middle operation"
    b.2: "inner operation 1"
[12:08:06.941] INFO (9476): doing something...
    b.0: "outer operation"
    b.1: "middle operation"
    b.2: "inner operation 1"
    delta: 1005
[12:08:07.943] INFO (9476): ended
    b.0: "outer operation"
    b.1: "middle operation"
    b.2: "inner operation 1"
    result: "123"
    delta: 1002
    totalDelta: 2007
[12:08:07.943] INFO (9476): first operation is done, starting second operation...
    b.0: "outer operation"
    b.1: "middle operation"
[12:08:07.944] INFO (9476): Starting
    b.0: "outer operation"
    b.1: "middle operation"
    b.2: "inner operation 2"
[12:08:08.945] INFO (9476): doing something...
    b.0: "outer operation"
    b.1: "middle operation"
    b.2: "inner operation 2"
    delta: 1001
[12:08:09.946] INFO (9476): ended
    b.0: "outer operation"
    b.1: "middle operation"
    b.2: "inner operation 2"
    todoId: "123"
    delta: 1001
    totalDelta: 2002
[12:08:09.946] INFO (9476): ended
    b.0: "outer operation"
    b.1: "middle operation"
    delta: 4010
    totalDelta: 4010
[12:08:09.946] INFO (9476): ended
    b.0: "outer operation"
    delta: 4010
    totalDelta: 4010
```

## Reason
Logs are real important. Anyway without a proper structure they can be hard to read and to understand.
This is why logs with context are so important. `pino-timer` helps you to create logs with context and to track in which context an operation is executed, how much time the single operation tooks and how much time the whole operation tooks.

This package is not a silver bullet, but it can help you to improve your logs.
