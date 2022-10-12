import { CustomConsole, LogType, LogMessage } from '@jest/console'

function simpleFormatter(type: LogType, message: LogMessage): string {
  return message
}

global.console = new CustomConsole(
  process.stdout,
  process.stderr,
  simpleFormatter,
)
