export class NotWritableError extends Error {
  constructor(table: string) {
    super(`Schema '${table}' is not writable`);
  }
}
