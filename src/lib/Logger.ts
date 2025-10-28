import { format } from 'date-fns'

enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
  NOTE = 6
}

class Logger {
  private logLevel: LogLevel
  private isDev: boolean

  constructor() {
    this.isDev = process.env.NODE_ENV !== 'production'

    // Allow override via LOG_LEVEL environment variable
    const envLogLevel = process.env.LOG_LEVEL?.toUpperCase()
    if (envLogLevel && envLogLevel in LogLevel) {
      this.logLevel = LogLevel[envLogLevel as keyof typeof LogLevel]
    } else {
      // Default: TRACE in development, INFO in production
      this.logLevel = !this.isDev ? LogLevel.INFO : LogLevel.TRACE
    }
  }

  get timestamp(): string {
    return format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS')
  }

  get levelString(): string {
    return this.getLogLevelString(this.logLevel)
  }

  /**
   * Extract source file and line number from stack trace
   */
  get source(): string {
    // Regex for Windows paths with TypeScript/JavaScript files
    const regex = /[/\\]([^/\\:]+:[0-9]+):[0-9]+\)?/
    const stack = new Error().stack || ''
    const stackLines = stack.split('\n')

    // Skip first 3 lines (Error, source getter, log method)
    if (stackLines[3]) {
      const match = stackLines[3].match(regex)
      return match ? match[1] : 'unknown'
    }
    return 'unknown'
  }

  getLogLevelString(level: LogLevel): string {
    const keys = Object.keys(LogLevel).filter((key) => isNaN(Number(key)))
    return keys[level] || 'UNKNOWN'
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level
    this.debug(`Set Log Level to ${this.levelString}`)
  }

  private static ConsoleMethods = {
    TRACE: 'trace' as const,
    DEBUG: 'debug' as const,
    INFO: 'info' as const,
    WARN: 'warn' as const,
    ERROR: 'error' as const,
    FATAL: 'error' as const,
    NOTE: 'log' as const
  }

  /**
   * Safely stringify any value for logging
   */
  private stringify(arg: unknown): string {
    if (typeof arg === 'string') return arg
    if (arg === null) return 'null'
    if (arg === undefined) return 'undefined'
    if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg)

    try {
      // Handle Error objects specially
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}${arg.stack ? '\n' + arg.stack : ''}`
      }
      return JSON.stringify(arg, null, 2)
    } catch {
      return String(arg)
    }
  }

  #log(levelName: keyof typeof Logger.ConsoleMethods, source: string, ...args: unknown[]): void {
    const level = LogLevel[levelName]
    if (level < LogLevel.FATAL && level < this.logLevel) return

    const consoleMethod = Logger.ConsoleMethods[levelName]
    const expandedArgs = args.map((arg) => this.stringify(arg))

    console[consoleMethod](`[${this.timestamp}] ${levelName}:`, ...expandedArgs, `(${source})`)
  }

  trace(...args: unknown[]): void {
    this.#log('TRACE', this.source, ...args)
  }

  debug(...args: unknown[]): void {
    this.#log('DEBUG', this.source, ...args)
  }

  info(...args: unknown[]): void {
    this.#log('INFO', this.source, ...args)
  }

  warn(...args: unknown[]): void {
    this.#log('WARN', this.source, ...args)
  }

  error(...args: unknown[]): void {
    this.#log('ERROR', this.source, ...args)
  }

  fatal(...args: unknown[]): void {
    this.#log('FATAL', this.source, ...args)
  }

  note(...args: unknown[]): void {
    this.#log('NOTE', this.source, ...args)
  }
}

const logger = new Logger()
export default logger
