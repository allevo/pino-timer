import pino, {Logger} from 'pino'
import pinoTimer, { pinoTimer as pinoTimerNamed, type TimerLogger, type TrackFn} from ".";
import pinoTimerDefault from ".";
import * as pinoTimerStar from ".";
import pinoTimerCjsImport = require (".");
import {expectAssignable, expectType} from "tsd";

const pinoTimerCjs = require(".");
const { pinoTimer: pinoTimerCjsNamed } = require('pino-timer')

const log = pino()
const timerLog = pinoTimer(log)

timerLog.info('hello')
timerLog.error('error!')

expectType<TrackFn>(timerLog.startTimer({ label: 'test' }, 'test').track)
expectType<TrackFn>(timerLog.startTimer({ label: 'test' }, 'test').end)

pinoTimer(log).error('error!')
pinoTimer(log).error('error!')

expectType<TimerLogger>(pinoTimerNamed(log));
expectType<TimerLogger>( pinoTimerDefault(log));
expectType<TimerLogger>(pinoTimerStar.pinoTimer(log));
expectType<TimerLogger>(pinoTimerStar.default(log));
expectType<TimerLogger>(pinoTimerCjsImport.pinoTimer(log));
expectType<TimerLogger>(pinoTimerCjsImport.default(log));
expectType<any>(new pinoTimerCjs(log));
expectType<any>(new pinoTimerCjsNamed(log));

expectAssignable<TimerLogger>(pinoTimerNamed(log).child({}));
