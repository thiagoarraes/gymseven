import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Debug logger function for API calls
let debugLogger: ((call: any) => void) | null = null;

export function setApiDebugLogger(logger: (call: any) => void) {
  debugLogger = logger;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const startTime = Date.now();
  const callId = generateId();
  
  // Get token from localStorage
  const token = localStorage.getItem('auth-token');
  

  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response | undefined;
  let responseData: any;
  let error: string | undefined;

  try {
    response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // Try to parse response for debugging
    const responseText = await response.clone().text();
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    await throwIfResNotOk(response);
    
  } catch (err: any) {
    error = err.message;
    // response might already be set from fetch, or create a dummy one
    if (!response) {
      response = { status: 0, statusText: 'Network Error' } as Response;
    }
    throw err;
  } finally {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Log to debug if enabled
    if (debugLogger) {
      debugLogger({
        id: callId,
        timestamp: new Date(startTime),
        method,
        url,
        requestData: data,
        responseData,
        status: response?.status || 0,
        error,
        duration
      });
    }
  }

  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth-token');
  

    const headers: Record<string, string> = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
