
export const customInstance = async <T>(
    url: string,
    { method, params, data, headers, ...options }: any
): Promise<T> => {
    // Determine if we should use the proxy (client-side only)
    const isClient = typeof window !== 'undefined';

    let finalUrl: string;
    if (isClient) {
        // Use our Next.js API Proxy to bypass CORS
        const proxyUrl = new URL(`${window.location.origin}/api/proxy`);
        proxyUrl.searchParams.append('path', url);
        if (params) {
            Object.keys(params).forEach((key) => {
                if (params[key] !== undefined && params[key] !== null) {
                    proxyUrl.searchParams.append(key, String(params[key]));
                }
            });
        }
        finalUrl = proxyUrl.toString();
    } else {
        // Server-side (during SSR/Pre-render) can call directly
        const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.bravefrontierheroes.com';
        const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        const directUrl = new URL(`${baseUrl}${cleanUrl}`);
        if (params) {
            Object.keys(params).forEach((key) => {
                if (params[key] !== undefined && params[key] !== null) {
                    directUrl.searchParams.append(key, String(params[key]));
                }
            });
        }
        finalUrl = directUrl.toString();
    }

    // Get token from cookie (client side)
    let token = null;
    if (isClient) {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const parts = cookie.trim().split('=');
            if (parts[0] === 'bfh_access_token') {
                token = parts[1];
                break;
            }
        }
    }

    if (process.env.NODE_ENV === 'development') {
        console.log(`[API Request] ${method} ${url} -> ${isClient ? 'via Proxy' : 'Direct'} - Token: ${token ? 'Present' : 'Missing'}`);
    }

    const response = await fetch(finalUrl, {
        method,
        headers: {
            'Accept': 'application/json',
            ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        ...options
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = { message: response.statusText };
        }

        const errorMessage = `API Error ${response.status}: ${errorData.message || 'API request failed'}`;
        console.error(`[API Error Trace] ${method} ${url}`, errorData);
        throw new Error(errorMessage);
    }

    const responseData = await response.json();

    // Wrap the response in the format expected by Orval's generated API clients
    return {
        data: responseData,
        status: response.status,
        headers: response.headers,
    } as T;
};

export default customInstance;
