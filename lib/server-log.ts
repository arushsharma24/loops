export function logServerError(scope: string, error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    error.digest === "DYNAMIC_SERVER_USAGE"
  ) {
    return;
  }

  console.error(`[${scope}]`, error);
}
