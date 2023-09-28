// Type definitions for pino-caller 0.0.1
// Project: https://github.com/allevo/pino-timer#readme
// Definitions by: Austin Ziegler <https://github.com/allevo>

import { Logger as PinoLogger } from 'pino';

interface Options {
  deltaKey?: string
}

export type TimerLogger = PinoLogger & Timer;

declare function pinoTimer(logger: PinoLogger, options?: Options): TimerLogger

export interface TrackFn {
  (obj: Record<string, any>, msg: string): void
  (msg: string): void
}

export interface Timer {
  startTimer: (obj: { label: string} & Record<string, any>, msg: string)  => TimerLogger
  track: TrackFn
  end: TrackFn
}

export default pinoTimer
export { pinoTimer }
