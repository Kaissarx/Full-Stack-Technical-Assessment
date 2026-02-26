import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';

// 1. Zod Validation (Ensures the frontend sends a valid UUID)
const checkoutSchema = z.object({
  reservationId: z.string().uuid("Invalid Reservation ID format"),
  userId: z.string().min(1, "User ID is required"), // We still mock the user for now
});

export const processCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate the incoming data
    const validatedData = checkoutSchema.parse(req.body);
    const { reservationId, userId } = validatedData;

    // 2. The Database Transaction
    const order = await prisma.$transaction(async (tx) => {
      
      // Step A: Find the reservation and lock the row
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      // Step B: Run all our security checks
      if (!reservation) {
        throw new Error('Reservation not found');
      }
      if (reservation.userId !== userId) {
        throw new Error('Unauthorized: This is not your reservation');
      }
      if (reservation.status !== 'PENDING') {
        throw new Error(`Reservation is already ${reservation.status}`);
      }
      if (new Date() > reservation.expiresAt) {
        throw new Error('Reservation has expired');
      }

      // Step C: Mark the reservation as COMPLETED
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'COMPLETED' },
      });

      // Step D: Create the final Order
      const newOrder = await tx.order.create({
        data: {
          reservationId: reservation.id,
          userId: reservation.userId,
        },
      });

      // Step E: Create an audit log for the purchase
      await tx.inventoryLog.create({
        data: {
          productId: reservation.productId,
          type: 'PURCHASED',
          quantity: reservation.quantity,
        },
      });

      return newOrder;
    });

    // 3. Send success response
    res.status(200).json({
      success: true,
      message: 'Checkout successful!',
      orderId: order.id,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.issues });
      return;
    }
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Checkout failed',
    });
  }
};