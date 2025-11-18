/**
 * Fetch with Timeout Utility
 * يوفر fetch مع timeout لمنع التعليق اللانهائي
 */

interface FetchOptions extends RequestInit {
  timeout?: number; // Timeout in milliseconds (default: 10000ms = 10s)
}

/**
 * Fetch with automatic timeout
 * @param url - The URL to fetch
 * @param options - Fetch options including timeout
 * @returns Promise with response
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - Server is not responding');
    }
    throw error;
  }
}

/**
 * Fetch JSON with timeout and error handling
 * @param url - The URL to fetch
 * @param options - Fetch options including timeout
 * @returns Promise with parsed JSON data
 */
export async function fetchJSON<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  try {
    const response = await fetchWithTimeout(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Fetch error (${response.status}):`, errorText);
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('❌ Fetch JSON error:', error);
    throw error;
  }
}

/**
 * Fetch with retry logic
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param maxRetries - Maximum number of retries (default: 2)
 * @returns Promise with response
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {},
  maxRetries: number = 2
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      return response;
    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ Fetch attempt ${attempt + 1} failed:`, error.message);
      
      // Don't retry on timeout or abort
      if (error.message.includes('timeout') || error.name === 'AbortError') {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Fetch failed after retries');
}

/**
 * Helper to create fetch options with authorization
 * @param token - Authorization token
 * @param additionalOptions - Additional fetch options
 * @returns Fetch options with authorization header
 */
export function createAuthFetchOptions(
  token: string,
  additionalOptions: FetchOptions = {}
): FetchOptions {
  return {
    ...additionalOptions,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...additionalOptions.headers,
    },
  };
}

/**
 * Helper to handle API errors consistently
 * @param error - The error object
 * @param defaultMessage - Default error message
 * @param language - Current language ('ar' or 'en')
 * @returns User-friendly error message
 */
export function getErrorMessage(
  error: any,
  defaultMessage: { ar: string; en: string },
  language: 'ar' | 'en' = 'ar'
): string {
  if (error.message?.includes('timeout')) {
    return language === 'ar'
      ? 'انتهى وقت الاتصال - يرجى المحاولة مرة أخرى'
      : 'Connection timeout - Please try again';
  }

  if (error.message?.includes('401')) {
    return language === 'ar'
      ? 'جلسة منتهية - يرجى تسجيل الدخول مرة أخرى'
      : 'Session expired - Please login again';
  }

  if (error.message?.includes('404')) {
    return language === 'ar'
      ? 'البيانات المطلوبة غير موجودة'
      : 'Requested data not found';
  }

  if (error.message?.includes('500')) {
    return language === 'ar'
      ? 'خطأ في الخادم - يرجى المحاولة لاحقاً'
      : 'Server error - Please try later';
  }

  return language === 'ar' ? defaultMessage.ar : defaultMessage.en;
}
