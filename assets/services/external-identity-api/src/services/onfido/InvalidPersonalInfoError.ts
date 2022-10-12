export type ValidationErrors = { [key: string]: string[] }

export default class InvalidPersonalInfoError extends Error {
  constructor(m: string, private readonly errors: { [key: string]: string[] }) {
    super(m)

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, InvalidPersonalInfoError.prototype)
  }

  getErrors(): ValidationErrors {
    return this.errors
  }
}
