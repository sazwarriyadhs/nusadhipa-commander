const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nusadhipa.shop/api/v1';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Pastikan endpoint selalu diawali dengan '/' dan tidak double slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_URL}${cleanEndpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      next: { revalidate: 30 } 
    });

    if (!response.ok) {
      if (response.status === 404) {
         throw new Error(`Endpoint tidak ditemukan (404): ${url}`);
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    throw error;
  }
}
