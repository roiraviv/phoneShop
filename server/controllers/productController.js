import {
  getAllProducts,
  findProductById,
  saveProduct,
  updateProduct,
} from '../storage/repositories/productRepository.js';

export async function listProducts(req, res) {
  try {
    let products = await getAllProducts();
    const { type, quickAdd, search } = req.query;

    if (type) {
      products = products.filter((p) => p.productType === type);
    }

    if (quickAdd === 'true') {
      products = products.filter(
        (p) => p.productType === 'accessory' && p.isActive && p.stockQuantity > 0
      );
    }

    if (search) {
      const q = search.trim().toLowerCase();
      products = products.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.imei?.includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.barcode?.includes(q) ||
          p.make?.toLowerCase().includes(q) ||
          p.model?.toLowerCase().includes(q) ||
          p.supplier?.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getProduct(req, res) {
  try {
    const product = await findProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function addProduct(req, res) {
  try {
    const product = await saveProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function patchProduct(req, res) {
  try {
    const product = await updateProduct(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function removeProduct(req, res) {
  try {
    const product = await updateProduct(req.params.id, { isActive: false });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}
