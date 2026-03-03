'use strict'

module.exports = () => {
  // set globals here
  // caution - avoid name clashes with native JS libraries, other libraries, other globals

  const DEFAULT_STACK_TRACE_LIMIT = 3 // default limit error stack trace to 3 level
  const { STACK_TRACE_LIMIT = DEFAULT_STACK_TRACE_LIMIT } = process.env
  Error.stackTraceLimit = Number(STACK_TRACE_LIMIT) || DEFAULT_STACK_TRACE_LIMIT
}
