import { register } from './register'

register()
  .then(() => {
    process.exit()
  })
  .catch(console.error)
