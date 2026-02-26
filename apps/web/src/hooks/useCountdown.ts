import { useState, useEffect } from 'react';

export const useCountdown = (expiresAt: string | null) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    // If we don't have an expiration time yet, do nothing
    if (!expiresAt) {
      setTimeLeft(0);
      return;
    }

    // Convert the backend string into a real JavaScript Date number
    const targetTime = new Date(expiresAt).getTime();

    // Check the clock every 1 second (1000 milliseconds)
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      // If the timer hits zero, stop counting!
      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
      } else {
        setTimeLeft(difference);
      }
    }, 1000);

    // Cleanup function: stop the timer if the user leaves the page
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Math magic to turn milliseconds into Minutes and Seconds
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  
  // Format to always show two digits (e.g., "04:09" instead of "4:9")
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // A simple boolean our UI can use to know if it's too late
  const isExpired = expiresAt ? timeLeft <= 0 : false;

  return { formattedTime, isExpired, timeLeft };
};