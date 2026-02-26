export interface Product {
  id: string;
  name: string;
  stock: number;
}

export interface ReservationResponse {
  success: boolean;
  reservationId?: string;
  expiresAt?: string;
  message?: string;
}

export interface CheckoutResponse {
  success: boolean;
  orderId?: string;
  message?: string;
}