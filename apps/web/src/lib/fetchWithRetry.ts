const RETRYABLE_STATUS = new Set([500, 502, 503, 504]);

function wait(milliseconds: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(resolve, milliseconds);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeout);
        reject(new DOMException("Request aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export async function fetchWithRetry(input: RequestInfo | URL, init: RequestInit = {}, attempts = 3) {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(input, init);
      if (!RETRYABLE_STATUS.has(response.status) || attempt === attempts - 1) return response;
    } catch (error) {
      if (init.signal?.aborted) throw error;
      lastError = error;
      if (attempt === attempts - 1) throw error;
    }

    await wait(350 * (attempt + 1), init.signal ?? undefined);
  }

  throw lastError;
}
