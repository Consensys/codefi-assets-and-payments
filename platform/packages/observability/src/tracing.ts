import { FORMAT_TEXT_MAP, Span, Tracer } from 'opentracing'
import { createLogger } from './logging'

const apm = require('elastic-apm-node')
const ApmTracer = require('elastic-apm-node-opentracing')

// Pass the Elastic APM agent as an argument to the OpenTracing tracer
export const tracer: Tracer = new ApmTracer(apm)

const logger = createLogger('Tracing')

async function traceSpan<T>(span: Span, target: () => Promise<T>): Promise<T> {
  try {
    return await target()
  } catch (e) {
    span.addTags({
      error: e.message,
    })
    throw e
  } finally {
    span.finish()
  }
}

export function setTracingContext(tags: { [key: string]: any }) {
  apm.setCustomContext(tags)
}

/**
 * Creates a new tracing span for the execution of the passed function.
 * Should be used to add traces to standalone functions.
 *
 * @param name name of the new tracing span
 * @param target a function that will
 */
export async function trace<T>(
  name: string,
  target: () => Promise<T>,
): Promise<T> {
  const span = tracer.startSpan(name)
  return traceSpan(span, target)
}

/**
 * Continue a trace created by a different request. Request might start as an HTTP request, but then can be
 * stored in Kafka and processed later.
 *
 * @param name name of a new span to create
 * @param spanContextDict span context from the original request stored as a dictionary
 * @param target a function to run in a new span
 */
export async function continueTrace<T>(
  name: string,
  spanContextDict: any,
  target: () => Promise<T>,
): Promise<T> {
  const spanContext = tracer.extract(FORMAT_TEXT_MAP, spanContextDict)
  if (!spanContext) {
    logger.warn('No parent span context was provided')
    return trace(name, target)
  }
  return traceSpan(
    tracer.startSpan(name, {
      childOf: spanContext,
    }),
    target,
  )
}

/**
 * Store current span information in a provided dictionary
 * @param spanDict
 */
export function persistCurrentSpan(spanDict: any) {
  const newSpan = tracer.startSpan('remote-span')
  try {
    tracer.inject(newSpan, FORMAT_TEXT_MAP, spanDict)
  } finally {
    newSpan.finish()
  }
}

/**
 * A decorator that creates a new tracing span for a decorated method.
 *
 * @param name name of a new span
 */
export function Trace(name: string) {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const decoratedMethod = descriptor.value

    if (!decoratedMethod) {
      return decoratedMethod
    }

    // Function after being decorated
    // Creates a new trace and calls the decorated method
    descriptor.value = async function (...args: any[]) {
      return trace(name, async () => {
        return decoratedMethod.apply(this, args)
      })
    }

    return descriptor
  }
}
