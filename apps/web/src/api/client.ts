import type { Product, ReservationResponse, CheckoutResponse } from '../types';

const API_URL = 'http://localhost:3000/api';

// ---> NEW: We need a place to store the token in React's memory <---
let jwtToken: string | null = null; 

const fetchWithTimeout = async (url: string, options: RequestInit = {}) => {
  const timeout = 5000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: unknown) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('API Timeout: The server took too long to respond.');
    }
    throw error;
  }
};

export const apiClient = {
  // ---> NEW: Login function to get the VIP wristband! <---
  async login(userId: string): Promise<void> {
    const response = await fetchWithTimeout(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await response.json();
    if (!data.success) throw new Error('Login failed');
    jwtToken = data.token; // Save the token securely in memory!
  },

  async getProduct(productId: string): Promise<Product> {
    const response = await fetchWithTimeout(`${API_URL}/product/${productId}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch product');
    return data.product;
  },

  async reserveProduct(productId: string, userId: string): Promise<ReservationResponse> {
    if (!jwtToken) throw new Error('You must be logged in to reserve!');
    
    const response = await fetchWithTimeout(`${API_URL}/reserve`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}` // Attach the token!
      },
      body: JSON.stringify({ productId, quantity: 1, userId }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Reservation failed.');
    return data;
  },

  async checkout(reservationId: string, userId: string): Promise<CheckoutResponse> {
    if (!jwtToken) throw new Error('You must be logged in to checkout!');

    const response = await fetchWithTimeout(`${API_URL}/checkout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}` // Attach the token!
      },
      body: JSON.stringify({ reservationId, userId }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Checkout failed');
    return data;
  }
};