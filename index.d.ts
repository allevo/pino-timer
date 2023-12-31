// Type definitions for pino-caller 0.0.1
// Project: https://github.com/allevo/pino-timer#readme
// Definitions by: Austin Ziegler <https://github.com/allevo>

import { Logger as PinoLogger } from 'pino';

export type TimerLogger = PinoLogger & Timer;

declare function pinoTimer(logger: PinoLogger): TimerLogger

export interface TrackFn {
  (obj: Record<string, any>, msg: string): void
  (msg: string): void
}

export interface ErrorTrackFn {
  (err: any, msg: string): void
}

export interface Timer {
  startTimer: (obj: { label: string} & Record<string, any>, msg: string)  => TimerLogger
  track: TrackFn
  end: TrackFn
  endWithError: ErrorTrackFn
  wrapCall: <T>(label: string, fn: (logger: TimerLogger) => T) => T
}

declare module 'pino' {
  namespace pino {
    interface BaseLogger extends Timer { }
  }
}

export default pinoTimer
export { pinoTimer }

