import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { Product } from '../types';
import { useCountdown } from '../hooks/useCountdown';

// ⚠️ PASTE YOUR REAL PRODUCT ID HERE:
const PRODUCT_ID = '914af6b2-0fc1-4f57-91e7-3331e8f78d24'; 
// We are simulating a logged-in user for this test:
const MOCK_USER_ID = '7703b3e0-aa54-4001-adb9-04f3666d158f';

export const ProductCard = () => {
  // --- STATE (Like Vue's ref() or reactive()) ---
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Reservation State
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  // Use our custom hook!
  const { formattedTime, isExpired } = useCountdown(expiresAt);

  // --- LIFECYCLE & POLLING (Like Vue's onMounted) ---
  useEffect(() => {
    const fetchStock = async () => {
      try {
        await apiClient.login(MOCK_USER_ID);
        const data = await apiClient.getProduct(PRODUCT_ID);
        setProduct(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately on load
    fetchStock();

    // Test Requirement: "real-time refresh every 5s"
    const interval = setInterval(fetchStock, 5000);
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

// --- ACTIONS ---
  const handleReserve = async () => {
    // Edge Case: Network Failure
    if (!navigator.onLine) {
      setError("Network failure: Please check your internet connection.");
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const res = await apiClient.reserveProduct(PRODUCT_ID, MOCK_USER_ID);
      setReservationId(res.reservationId!);
      setExpiresAt(res.expiresAt!);
    } catch (err: unknown) {
      // Strict TypeScript: No "any" allowed!
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!reservationId) return;
    if (!navigator.onLine) {
      setError("Network failure: Please check your internet connection.");
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await apiClient.checkout(reservationId, MOCK_USER_ID);
      setSuccessMsg('🎉 Order Complete! You got the sneaker!');
      setReservationId(null);
      setExpiresAt(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // --- UI RENDER (Like Vue's <template>) ---
  if (loading && !product) return <div>Loading Drop...</div>;
  if (!product) return <div>Product not found!</div>;

  return (
    <div style={{ padding: '2rem', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '400px', backgroundColor: 'white' }}>
      <h2>{product.name}</h2>
      
      {/* Real-time stock indicator */}
      <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: product.stock > 0 ? 'green' : 'red' }}>
        Stock Remaining: {product.stock}
      </p>

      {/* Error & Success Messages */}
      {error && <div style={{ color: 'red', margin: '10px 0' }}>❌ {error}</div>}
      {successMsg && <div style={{ color: 'green', margin: '10px 0', fontWeight: 'bold' }}>{successMsg}</div>}

      {/* State 1: We have a reservation, and it is NOT expired */}
      {reservationId && !isExpired && !successMsg && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
          <p style={{ color: '#856404', fontWeight: 'bold' }}>Item Reserved!</p>
          <p style={{ fontSize: '1.5rem', fontFamily: 'monospace' }}>⏱️ {formattedTime}</p>
          <button 
            onClick={handleCheckout} 
            disabled={actionLoading}
            style={{ marginTop: '10px', padding: '10px', width: '100%', backgroundColor: 'black', color: 'white', cursor: 'pointer' }}
          >
            {actionLoading ? 'Processing...' : 'Complete Checkout'}
          </button>
        </div>
      )}

      {/* State 2: Reservation Expired */}
      {reservationId && isExpired && (
        <div style={{ marginTop: '1rem', color: 'red', fontWeight: 'bold' }}>
          ⚠️ Your reservation has expired.
        </div>
      )}

      {/* State 3: No reservation yet (or it expired), show Reserve button */}
      {(!reservationId || isExpired) && !successMsg && (
        <button
          onClick={handleReserve}
          disabled={product.stock === 0 || actionLoading}
          style={{
            marginTop: '1rem', padding: '10px', width: '100%', cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
            backgroundColor: product.stock === 0 ? 'gray' : '#007bff', color: 'white', border: 'none', borderRadius: '4px'
          }}
        >
          {actionLoading ? 'Locking item...' : product.stock === 0 ? 'Sold Out' : 'Reserve Now'}
        </button>
      )}
    </div>
  );
};