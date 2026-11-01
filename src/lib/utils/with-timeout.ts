/**
 * Wraps an asynchronous operation with an execution deadline to enforce
 * Vercel serverless execution limits (standard: 10s).
 *
 * @param promise The promise to execute
 * @param timeoutMs Maximum milliseconds before timing out (default: 9500ms)
 * @param errorMessage Custom error message upon timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 9500,
  errorMessage: string = "Serverless operation timed out"
): Promise<T> {
  let timer: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}
