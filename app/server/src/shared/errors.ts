/** Thrown for bad client input; the HTTP layer maps it to 400. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
