async function testReservation() {
  console.log("⏳ Sending reservation request...");
  
  try {
    const response = await fetch('http://localhost:3000/api/reserve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: '914af6b2-0fc1-4f57-91e7-3331e8f78d24', // Your exact sneaker ID
        userId: 'frontend-user-999', // A fake user ID for now
        quantity: 1,
      }),
    });

    const data = await response.json();
    console.log('✅ Server Response:', data);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testReservation();