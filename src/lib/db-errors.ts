const MONGO_DUPLICATE_KEY = 11000;

/** True when MongoDB rejected a write because it would break a unique index. */
export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === MONGO_DUPLICATE_KEY
  );
}
