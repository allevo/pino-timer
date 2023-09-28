'use strict'

const t = require('tap')
const pino = require('pino')
const through2 = require('through2')
const pinoTimer = require('../')

t.test('pino-timer startTimer / end works', async function (t) {
  const logs = []

  const pinoInstance = pinoTimer(pino(through2(function (chunk, enc, callback) {
    const res = JSON.parse(chunk.toString('utf8'))
    logs.push(res)
    callback()
  })))

  const timer = pinoInstance.startTimer({
    label: 'middleware',
    foo: 'foo'
  }, 'A message')
  await new Promise(resolve => setTimeout(resolve, 1000))
  timer.track('middle1')
  await new Promise(resolve => setTimeout(resolve, 1000))
  timer.track({ baz: 'baz' }, 'middle2')
  await new Promise(resolve => setTimeout(resolve, 1000))
  timer.end('end')

  t.match(logs, [
    {
      level: 30,
      middleware: true,
      foo: 'foo',
      msg: 'A message'
    },
    {
      level: 30,
      middleware: true,
      foo: 'foo',
      msg: 'middle1'
    },
    {
      level: 30,
      middleware: true,
      foo: 'foo',
      baz: 'baz',
      msg: 'middle2'
    },
    {
      level: 30,
      middleware: true,
      foo: 'foo',
      msg: 'end'
    }
  ])

  t.ok(logs[1].delta >= 1000)
  t.ok(logs[2].delta >= 1000)
  t.ok(logs[3].delta >= 1000)
  t.ok(logs[3].totalDelta >= 2000)

  t.end()
})

t.test('pino-timer startTimer / endWithError works', async function (t) {
  const logs = []

  const pinoInstance = pinoTimer(pino(through2(function (chunk, enc, callback) {
    const res = JSON.parse(chunk.toString('utf8'))
    logs.push(res)
    callback()
  })))

  const error = new Error('KABOOM')

  const timer = pinoInstance.startTimer({
    label: 'middleware',
    foo: 'foo'
  }, 'A message')
  await new Promise(resolve => setTimeout(resolve, 1000))
  timer.endWithError(error, 'end')

  t.match(logs, [
    {
      level: 30,
      middleware: true,
      foo: 'foo',
      msg: 'A message'
    },
    {
      level: 50,
      middleware: true,
      foo: 'foo',
      err: {
        type: 'Error',
        message: 'KABOOM'
      },
      msg: 'end'
    }
  ])

  t.ok(logs[1].delta >= 1000)
  t.ok(logs[1].totalDelta >= 1000)

  t.end()
})

t.test('pino-timer wrap works', async function (t) {
  await t.test('with sync function - ok - no return', function (t) {
    const logs = []

    const pinoInstance = pinoTimer(pino(through2(function (chunk, enc, callback) {
      const res = JSON.parse(chunk.toString('utf8'))
      logs.push(res)
      callback()
    })))

    pinoInstance.wrapCall('foo', _timer => { /* some work */ })

    t.match(logs, [
      {
        level: 30,
        foo: true,
        msg: 'start'
      },
      {
        level: 30,
        foo: true,
        msg: 'done'
      }
    ])

    t.end()
  })

  await t.test('with sync function - ok - return something', function (t) {
    const logs = []

    const pinoInstance = pinoTimer(pino(through2(function (chunk, enc, callback) {
      const res = JSON.parse(chunk.toString('utf8'))
      logs.push(res)
      callback()
    })))

    const r = pinoInstance.wrapCall('foo', _timer => 42)

    t.match(logs, [
      {
        level: 30,
        foo: true,
        msg: 'start'
      },
      {
        level: 30,
        foo: true,
        msg: 'done'
      }
    ])

    t.equal(r, 42)

    t.end()
  })

  await t.test('with sync function - ok - return promise', async function (t) {
    const logs = []

    const pinoInstance = pinoTimer(pino(through2(function (chunk, enc, callback) {
      const res = JSON.parse(chunk.toString('utf8'))
      logs.push(res)
      callback()
    })))

    const r = pinoInstance.wrapCall('foo', _timer => Promise.resolve(42))
    t.ok(r instanceof Promise)
    t.equal(await r, 42)

    t.match(logs, [
      {
        level: 30,
        foo: true,
        msg: 'start'
      },
      {
        level: 30,
        foo: true,
        msg: 'done'
      }
    ])

    t.end()
  })

  await t.test('with sync function - error', function (t) {
    const logs = []

    const pinoInstance = pinoTimer(pino(through2(function (chunk, enc, callback) {
      const res = JSON.parse(chunk.toString('utf8'))
      logs.push(res)
      callback()
    })))

    const error = new Error('KABOOM')
    try {
      pinoInstance.wrapCall('foo', _timer => { throw error })
      t.fail('should throw')
    } catch (e) {
      t.equal(e, error)
    }

    t.match(logs, [
      {
        level: 30,
        foo: true,
        msg: 'start'
      },
      {
        level: 50,
        foo: true,
        msg: 'error',
        err: {
          type: 'Error',
          message: 'KABOOM'
        }
      }
    ])

    t.end()
  })

  await t.test('with async function - no return', async function (t) {
    const logs = []

    const pinoInstance = pinoTimer(pino(through2(function (chunk, enc, callback) {
      const res = JSON.parse(chunk.toString('utf8'))
      logs.push(res)
      callback()
    })))

    const r = await pinoInstance.wrapCall('foo', async _timer => { })

    t.match(logs, [
      {
        level: 30,
        foo: true,
        msg: 'start'
      },
      {
        level: 30,
        foo: true,
        msg: 'done'
      }
    ])

    t.equal(r, undefined)

    t.end()
  })

  await t.test('with async function - throw async', async function (t) {
    const logs = []

    const pinoInstance = pinoTimer(pino(through2(function (chunk, enc, callback) {
      const res = JSON.parse(chunk.toString('utf8'))
      logs.push(res)
      callback()
    })))

    const error = new Error('KABOOM')
    const p = pinoInstance.wrapCall('foo', async _timer => { throw error })
    t.ok(p instanceof Promise)

    try {
      await p
      t.fail('should throw')
    } catch (e) {
      t.equal(e, error)
    }

    t.match(logs, [
      {
        level: 30,
        foo: true,
        msg: 'start'
      },
      {
        level: 50,
        foo: true,
        msg: 'error',
        err: {
          type: 'Error',
          message: 'KABOOM'
        }
      }
    ])

    t.end()
  })

  await t.test('with async function - return something', async function (t) {
    const logs = []

    const pinoInstance = pinoTimer(pino(through2(function (chunk, enc, callback) {
      const res = JSON.parse(chunk.toString('utf8'))
      logs.push(res)
      callback()
    })))

    const p = pinoInstance.wrapCall('foo', async _timer => 42)
    t.ok(p instanceof Promise)

    t.equal(await p, 42)

    t.match(logs, [
      {
        level: 30,
        foo: true,
        msg: 'start'
      },
      {
        level: 30,
        foo: true,
        msg: 'done'
      }
    ])

    t.end()
  })

  t.end()
})

t.test('pino-timer startTimer / end works, nested', async function (t) {
  const logs = []

  let middlewareTimer
  {
    const timerLogger = pinoTimer(pino(through2(function (chunk, enc, callback) {
      const res = JSON.parse(chunk.toString('utf8'))
      logs.push(res)
      callback()
    })))
    middlewareTimer = timerLogger.startTimer({
      label: 'middleware',
      method: 'POST',
      url: '/todos'
    }, 'Incoming request')
  }

  let todoId

  {
    const createTodoHandlerTimer = middlewareTimer.startTimer({
      label: 'createTodoHandler',
      userId: 'allevo',
      name: 'My todo'
    }, 'Create todo')

    {
      const userTimer = createTodoHandlerTimer.startTimer({
        label: 'checkUser'
      })

      userTimer.track('query to db')
      await new Promise(resolve => setTimeout(resolve, 1000))
      userTimer.track('query to db done')

      userTimer.end({
        allowed: true
      }, 'done')
    }

    {
      const todoTimer = createTodoHandlerTimer.startTimer({
        label: 'createTodo'
      }, 'Create todo')

      todoTimer.track('query to db')
      await new Promise(resolve => setTimeout(resolve, 1000))
      todoTimer.track('query to db done')

      todoId = 'qwertyuiop'

      todoTimer.end({
        todoId
      }, 'Todo inserted')
    }

    createTodoHandlerTimer.end({
      todoId
    }, 'Todo created')
  }

  middlewareTimer.end({
    statusCode: 200
  }, 'End request')

  await t.test('every logs has middleware property', t => {
    t.ok(logs.every(log => log.middleware === true))
    t.end()
  })
  await t.test('check createTodoHandler property', t => {
    t.ok(logs.slice(1, -1).every(log => log.createTodoHandler === true))
    t.end()
  })
  await t.test('check checkUser property', t => {
    t.ok(logs.slice(2, 5).every(log => log.checkUser === true))
    t.end()
  })
  await t.test('check createTodo property', t => {
    t.ok(logs.slice(6, 9).every(log => log.createTodo === true))
    t.end()
  })

  t.match(logs, [
    {
      level: 30,
      middleware: true,
      method: 'POST',
      url: '/todos',
      msg: 'Incoming request'
    },
    {
      level: 30,
      middleware: true,
      method: 'POST',
      url: '/todos',
      createTodoHandler: true,
      userId: 'allevo',
      name: 'My todo',
      msg: 'Create todo'
    },
    {
      level: 30,
      middleware: true,
      method: 'POST',
      url: '/todos',
      createTodoHandler: true,
      userId: 'allevo',
      name: 'My todo',
      checkUser: true
    },
    {
      level: 30,
      middleware: true,
      method: 'POST',
      url: '/todos',
      createTodoHandler: true,
      userId: 'allevo',
      name: 'My todo',
      checkUser: true,
      msg: 'query to db'
    },
    {
      level: 30,
      middleware: true,
      method: 'POST',
      url: '/todos',
      createTodoHandler: true,
      userId: 'allevo',
      name: 'My todo',
      checkUser: true,
      msg: 'query to db done'
    },
    {
      level: 30,
      middleware: true,
      method: 'POST',
      url: '/todos',
      createTodoHandler: true,
      userId: 'allevo',
      name: 'My todo',
      checkUser: true,
      allowed: true,
      msg: 'done'
    },
    {
      level: 30,
      middleware: true,
      method: 'POST',
      url: '/todos',
      createTodoHandler: true,
      userId: 'allevo',
      name: 'My todo',
      createTodo: true,
      msg: 'Create todo'
    },
    {
      level: 30,
      middleware: true,
      method: 'POST',
      url: '/todos',
      createTodoHandler: true,
      userId: 'allevo',
      name: 'My todo',
      createTodo: true,
      msg: 'query to db'
    },
    {
      level: 30,
      middleware: true,
      method: 'POST',
      url: '/todos',
      createTodoHandler: true,
      userId: 'allevo',
      name: 'My todo',
      createTodo: true,
      msg: 'query to db done'
    },
    {
      level: 30,
      middleware: true,
      method: 'POST',
      url: '/todos',
      createTodoHandler: true,
      userId: 'allevo',
      name: 'My todo',
      createTodo: true,
      todoId: 'qwertyuiop',
      msg: 'Todo inserted'
    },
    {
      level: 30,
      middleware: true,
      method: 'POST',
      url: '/todos',
      createTodoHandler: true,
      userId: 'allevo',
      name: 'My todo',
      todoId: 'qwertyuiop',
      msg: 'Todo created'
    },
    {
      level: 30,
      middleware: true,
      method: 'POST',
      url: '/todos',
      statusCode: 200
    }
  ])

  t.end()
})

t.test('pino interface still works properly', function (t) {
  const logs = []
  const pinoInstance = pinoTimer(pino({
    level: 'info'
  }, through2(function (chunk, enc, callback) {
    const res = JSON.parse(chunk.toString('utf8'))
    logs.push(res)
    callback()
  })))

  pinoInstance.info('test')
  pinoInstance.child({ child: true }).info('test-child')

  t.equal(2, logs.length)

  t.end()
})
