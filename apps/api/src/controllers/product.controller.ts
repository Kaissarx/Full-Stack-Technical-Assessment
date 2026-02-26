import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    // Grab the ID from the URL (e.g., /api/product/1234)
const id = req.params.id as string;
    // Ask the database for this specific product
    const product = await prisma.product.findUnique({
      where: { id },
      // We only select the fields the frontend actually needs to see
      select: {
        id: true,
        name: true,
        stock: true,
      },
    });

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching product' });
  }
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Get query parameters from the URL (with safe defaults)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // 🔥 FIX 1: Changed default sort to 'name' instead of 'createdAt'
    const sortBy = (req.query.sortBy as string) || 'name'; 
    const sortOrder = (req.query.sortOrder as string) === 'desc' ? 'desc' : 'asc';
    const search = (req.query.search as string) || ''; 

    // 2. Math for pagination
    const skip = (page - 1) * limit;

    // 3. Build the filter condition
    const whereCondition = search 
      ? { name: { contains: search, mode: 'insensitive' as const } } 
      : {};

    // 4. Ask Prisma for the products AND the total count at the same time
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereCondition,
        skip: skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        // 🔥 FIX 2: Removed 'createdAt' from this select block entirely!
        select: { id: true, name: true, stock: true } 
      }),
      prisma.product.count({ where: whereCondition }),
    ]);

    // 5. Send the formatted paginated response
    res.status(200).json({
      success: true,
      data: products,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Pagination Error:", error);
    res.status(500).json({ success: false, message: 'Server error fetching products' });
  }
};