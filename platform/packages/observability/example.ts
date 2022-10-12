require('dotenv').config()
import { createLogger, expressLogger, initApm, apiMetrics } from './src'

initApm()

const express = require('express')
const app = express()
const port = 3000

const logger = createLogger('test')

app.use(apiMetrics())

// Optional : use express-pino-logger for Express req/res logging
app.use(expressLogger())

app.get('/', (req, res) => {
  req.log.info(
    {
      path: '/',
    },
    'Processing request',
  )
  res.send('Hello World!')
})

logger.error(new Error('Error message'), 'Test error message')

app.listen(port, () =>
  logger.info(`Example app listening at http://localhost:${port}`),
)
