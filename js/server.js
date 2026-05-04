const express = require('express');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'data', 'products.json');

app.use(express.json());
app.use(express.static(__dirname));

async function readProducts() {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/products', async (_req, res) => {
  try {
    const products = await readProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Не удалось получить товары' });
  }
});

app.post('/api/orders', async (req, res) => {
  const { items } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Корзина пуста' });
  }

  const products = await readProducts();
  const productsById = new Map(products.map((product) => [product.id, product]));

  const orderItems = [];
  let total = 0;

  for (const item of items) {
    const product = productsById.get(Number(item.productId));
    const quantity = Math.max(1, Number(item.quantity) || 1);

    if (!product) {
      return res.status(400).json({ message: `Товар с id=${item.productId} не найден` });
    }

    total += product.price * quantity;
    orderItems.push({
      productId: product.id,
      name: product.name,
      quantity,
      price: product.price,
      subtotal: product.price * quantity,
    });
  }

  return res.status(201).json({
    orderId: Date.now(),
    items: orderItems,
    total,
    createdAt: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Backend started: http://localhost:${PORT}`);
});
