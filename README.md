# pino-timer
[![Build Status](https://img.shields.io/github/actions/workflow/status/allevo/pino-timer/.github/workflows/node.js.yml?branch=main)](https://github.com/allevo/pino-timer/actions)
[![Coverage Status](https://coveralls.io/repos/github/allevo/pino-timer/badge.svg?branch=main)](https://coveralls.io/github/allevo/pino-timer?branch=main)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://standardjs.com/)


### Description
`pino-timer` is a wrapper for [pino](https://github.com/pinojs/pino) which adds some utilities to calculate delta like `console.time` and `console.endTime`.
This can be useful when developing with large codebases in order to track which operation tooks time.

### Install

```
npm install pino-timer
```

### Usage

#### Basic

```js
'use strict'

const pino = require('pino')()
const pinoTimer = require('pino-timer')(pino)

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
cd examples
node basic.js | pino-pretty
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

#### Advanced

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
cd examples
node advanced.js | pino-pretty
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
