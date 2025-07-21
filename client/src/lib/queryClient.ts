import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let url: string;
    if (queryKey.length === 1) {
      url = queryKey[0] as string;
    } else if (queryKey.length === 2) {
      const [baseUrl, param] = queryKey;
      if (typeof param === 'object' && param !== null) {
        // Handle object parameters as query string
        const params = new URLSearchParams();
        Object.entries(param).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
        url = `${baseUrl}?${params.toString()}`;
      } else if (param !== undefined && param !== null) {
        // Handle simple parameters as query parameter
        const paramName = (baseUrl as string).includes('/stats') ? 'divisionId' : 
                          (baseUrl as string).includes('/uploads') ? 'divisionId' :
                          (baseUrl as string).includes('/contact-categories') ? 'divisionId' : 'id';
        url = `${baseUrl}?${paramName}=${param}`;
      } else {
        url = baseUrl as string;
      }
    } else {
      url = queryKey.join("/") as string;
    }

    const res = await fetch(url, {
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
