'use strict'

const t = require('tap')
const pino = require('pino')
const through2 = require('through2')
const pinoTimer = require('../')

t.only('pino startTimer / end works', async function (t) {
  const logs = []

  const pinoInstance = pinoTimer(pino(through2(function (chunk, enc, callback) {
    const res = JSON.parse(chunk.toString('utf8'))
    logs.push(res)
    callback()
  })))

  const timer = pinoInstance.startTimer({
    label: 'middleware',
    foo: 'foo',
  }, 'A message')
  await new Promise(res => setTimeout(res, 1000))
  timer.track('middle1')
  await new Promise(res => setTimeout(res, 1000))
  timer.track({ baz: 'baz'}, 'middle2')
  await new Promise(res => setTimeout(res, 1000))
  timer.end({
    bar: 'bar'
  }, 'end')

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
      bar: 'bar',
      msg: 'end'
    }
  ])

  t.ok(logs[1].delta >= 1000)
  t.ok(logs[2].delta >= 1000)
  t.ok(logs[3].delta >= 1000)
  t.ok(logs[3].totalDelta >= 2000)

  t.end()
})

t.test('pino startTimer / end works, nested', async function (t) {
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
      url: '/todos',
    }, 'Incoming request')
  }

  let todoId

  {
    const createTodoHandlerTimer = middlewareTimer.startTimer({
      label: 'createTodoHandler',
      userId: 'allevo',
      name: 'My todo',
    }, 'Create todo')

    {
      const userTimer = createTodoHandlerTimer.startTimer({
        label: 'checkUser'
      })

      userTimer.track('query to db')
      await new Promise(res => setTimeout(res, 1000))
      userTimer.track('query to db done')

      userTimer.end({
        allowed: true,
      }, 'done')
    }

    {
      const todoTimer = createTodoHandlerTimer.startTimer({
        label: 'createTodo',
      }, 'Create todo')

      todoTimer.track('query to db')
      await new Promise(res => setTimeout(res, 1000))
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

t.test('pino still properly', function (t) {
  const logs = []
  const pinoInstance = pinoTimer(pino({
    level: 'info',
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
