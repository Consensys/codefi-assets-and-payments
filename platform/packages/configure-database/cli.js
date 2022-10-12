#!/usr/bin/env node

const { createDatabase, validateEnvironment, installExtensions } = require('./dist/index.js')

;(async () => {
  const missingEnvironmentVariables = validateEnvironment(process.env)

  if (missingEnvironmentVariables.length) {
    console.error('Missing environment variables: ' + missingEnvironmentVariables.join())
    process.exit(1)
  }

  let result

  try {
    result = await createDatabase(process.env, console);
  } catch (e) {
    console.log(e)
    process.exit(1)
  }

  if (result.dbCreated) {
    console.log(`Database ${process.env.DB_DATABASE_NAME} created`)
  }

  if (result.userCreated) {
    console.log(`Database ${process.env.DB_USERNAME} created`)
  }

  if (result.accessGranted) {
    console.log(`Access granted`)
  }

  try {
      result = await installExtensions(process.env, console);
  } catch (e) {
      console.log(e)
      process.exit(1)
  }

  if (result.run) {
      console.log(`Extensions ${result.installed} created`)
  }

})()


