require('dotenv').config()
const { createDatabase, validateEnvironment } = require('../dist/index.js')

async function go() {
  const validEnvironment = validateEnvironment(process.env).length === 0

  if (!validEnvironment) return

  try {
    const result = await createDatabase(process.env)
    console.log(result)
  } catch (e) {
    console.log(e)
  }
}

go()
