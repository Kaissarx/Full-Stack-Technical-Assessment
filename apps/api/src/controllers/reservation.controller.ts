import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';

// 1. Zod Validation Schema (Ensures the frontend sends correct data)
const reserveSchema = z.object({
    productId: z.string().uuid("Invalid Product ID format"),
    userId: z.string().min(1, "User ID is required"), // We will mock this for now
    quantity: z.number().int().positive("Quantity must be at least 1")
});

export const reserveProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        // 2. Validate the incoming request body
        const validatedData = reserveSchema.parse(req.body);
        const { productId, userId, quantity } = validatedData;

        // Check if the user already has a pending reservation for this product
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        userId: userId,
        productId: productId,
        status: 'PENDING',
      },
    });

    if (existingReservation) {
      res.status(400).json({ 
        success: false, 
        message: 'You already have an active reservation for this item. Please complete your checkout.' 
      });
      return;
    }

        // 3. The Database Transaction (This prevents race conditions!)
        const reservation = await prisma.$transaction(async (tx) => {

            // Atomic Update: Only decrement if stock >= quantity
            const updatedProduct = await tx.product.updateMany({
                where: {
                    id: productId,
                    stock: { gte: quantity } // The magic line that prevents overselling
                },
                data: {
                    stock: { decrement: quantity }
                }
            });

            // If count is 0, it means the WHERE clause failed (stock was too low)
            if (updatedProduct.count === 0) {
                throw new Error('Out of stock or product not found');
            }

            // Calculate exactly 5 minutes from right now
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

            // Create the reservation
            const newReservation = await tx.reservation.create({
                data: { userId, productId, quantity, expiresAt, status: 'PENDING' }
            });

            // Create the audit log required by the test
            await tx.inventoryLog.create({
                data: { productId, type: 'RESERVED', quantity }
            });

            return newReservation;
        });

        // 4. Send success response back to the frontend
        res.status(201).json({
            success: true,
            reservationId: reservation.id,
            expiresAt: reservation.expiresAt
        });

    } catch (error) {
        // Handle Zod validation errors
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, errors: error.issues }); return;
        }
        // Handle "Out of stock" or other transaction errors
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Reservation failed'
        });
    }
};