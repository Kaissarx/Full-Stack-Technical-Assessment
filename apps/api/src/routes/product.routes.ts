import { Router } from 'express';
import { getProduct, getProducts } from '../controllers/product.controller';
const router = Router();

// Notice we use router.get() instead of router.post() here!
// The :id part is a dynamic variable in the URL
router.get('/products', getProducts);
router.get('/product/:id', getProduct);

export default router;