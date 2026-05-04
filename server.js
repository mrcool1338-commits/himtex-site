const express = require('express');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'data', 'products.json');
const IDEMPOTENCY_TTL_MS = 60 * 60 * 1000;
const idempotentOrders = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const ORDER_THROTTLE_WINDOW_MS = 60 * 1000;
const ORDER_THROTTLE_MAX_REQUESTS = 10;
const RESEND_API_URL = 'https://api.resend.com/emails';
const apiRequestsByIp = new Map();
const orderRequestsByIp = new Map();

function cleanupExpiredEntries(storage, windowMs, nowMs) {
  for (const [ip, entry] of storage.entries()) {
    if (nowMs - entry.windowStartMs >= windowMs) {
      storage.delete(ip);
    }
  }
}

function resolveClientIp(req) {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function apiRateLimiter(req, res, next) {
  const nowMs = Date.now();
  cleanupExpiredEntries(apiRequestsByIp, RATE_LIMIT_WINDOW_MS, nowMs);

  const ip = resolveClientIp(req);
  const entry = apiRequestsByIp.get(ip);

  if (!entry || nowMs - entry.windowStartMs >= RATE_LIMIT_WINDOW_MS) {
    apiRequestsByIp.set(ip, { windowStartMs: nowMs, count: 1 });
    return next();
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((RATE_LIMIT_WINDOW_MS - (nowMs - entry.windowStartMs)) / 1000);
    res.set('Retry-After', String(Math.max(retryAfterSeconds, 1)));
    return res.status(429).json({ message: 'Слишком много запросов. Попробуйте позже.' });
  }

  entry.count += 1;
  return next();
}

app.use(express.json());
app.use(express.static(__dirname));
app.use('/api', apiRateLimiter);

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


function orderIpThrottler(req, res, next) {
  const nowMs = Date.now();
  cleanupExpiredEntries(orderRequestsByIp, ORDER_THROTTLE_WINDOW_MS, nowMs);

  const ip = resolveClientIp(req);
  const entry = orderRequestsByIp.get(ip);

  if (!entry || nowMs - entry.windowStartMs >= ORDER_THROTTLE_WINDOW_MS) {
    orderRequestsByIp.set(ip, { windowStartMs: nowMs, count: 1 });
    return next();
  }

  if (entry.count >= ORDER_THROTTLE_MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((ORDER_THROTTLE_WINDOW_MS - (nowMs - entry.windowStartMs)) / 1000);
    res.set('Retry-After', String(Math.max(retryAfterSeconds, 1)));
    return res.status(429).json({ message: 'Слишком много попыток оформления заказа. Попробуйте позже.' });
  }

  entry.count += 1;
  return next();
}

app.post('/api/subscriptions', async (req, res) => {
  const { email } = req.body || {};

  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ message: 'mrcool1338@gmail.com' });
  }

  const targetEmail = process.env.SUBSCRIPTION_TARGET_EMAIL;
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!targetEmail || !resendApiKey || !fromEmail) {
    return res.status(500).json({
      message: 'Сервис подписки не настроен на сервере',
    });
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [targetEmail],
        subject: 'Новая заявка на рассылку Himtex',
        html: `<p>Новый email для подписки: <b>${email}</b></p>`,
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      return res.status(502).json({
        message: 'Не удалось отправить заявку на email',
        details: errorPayload,
      });
    }

    return res.status(201).json({ message: 'Заявка отправлена' });
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка отправки заявки' });
  }
});

app.post('/api/orders', orderIpThrottler, async (req, res) => {
  const { items } = req.body || {};
  const idempotencyKey = req.get('Idempotency-Key');

  if (idempotencyKey) {
    const cachedOrder = idempotentOrders.get(idempotencyKey);

    if (cachedOrder && Date.now() - cachedOrder.createdAtMs < IDEMPOTENCY_TTL_MS) {
      return res.status(200).json(cachedOrder.payload);
    }
  }
  
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

  const orderPayload = {
    orderId: Date.now(),
    items: orderItems,
    total,
    createdAt: new Date().toISOString(),
  };

  if (idempotencyKey) {
    idempotentOrders.set(idempotencyKey, {
      createdAtMs: Date.now(),
      payload: orderPayload,
    });
  }

  return res.status(201).json(orderPayload);
});

app.listen(PORT, () => {
  console.log(`Backend started: http://localhost:${PORT}`);
});
