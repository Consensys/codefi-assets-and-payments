import { createNamespace } from 'cls-hooked';

const session = createNamespace('tracing-session');
const currentSpanKey = 'span';

const setCurrentSpan = (span) => {
  return session.set(currentSpanKey, span);
};

const getCurrentSpan = () => {
  return session.get(currentSpanKey);
};

const startSpan = (tracer, spanName, options = {}) => {
  if (tracer === undefined || tracer === null) {
    throw new Error('Tracer arguement needs to be provided.');
  }

  if (spanName === undefined || spanName === null) {
    throw new Error('spanName arguement needs to be provided');
  }

  // Get the parent span, which is the current span in the current context session
  // If no value is given (null or undefined) - default to undefined.
  const parentSpan = getCurrentSpan() || undefined;

  // Create a span with the currentSpan as the child span
  // We let options provided as the arguement to override if the caller of the
  // method wants to override it
  const currentSpan = tracer.startSpan(spanName, {
    childOf: parentSpan,
    ...options,
  });

  // Span created, lets set it in the session.
  setCurrentSpan(currentSpan);

  // Return this new span.
  return currentSpan;
};

/**
 * Adds tags to the current span if it exists.
 * @param tags Tags to add to the current span.
 */
const addTagsToCurrentSpan = (tags) => {
  const currentSpan = getCurrentSpan();

  if (currentSpan === undefined || currentSpan === null) {
    return;
  }

  currentSpan.addTags(tags);
};

/**
 * Adds a log to the current span if it exists, optionally with a timestamp.
 * @param log - Log to add which is an object with key-value pairs
 * @param timestamp - Optional timestamp for the log
 */
const addLogToCurrentSpan = (log, timestamp) => {
  const currentSpan = getCurrentSpan();

  if (currentSpan === undefined || currentSpan === null) {
    return;
  }

  currentSpan.log(log, timestamp);
};

const exp = Object.assign(session, {
  startSpan,
  addTagsToCurrentSpan,
  addLogToCurrentSpan,
  getCurrentSpan,
  setCurrentSpan,
});

export default exp;
