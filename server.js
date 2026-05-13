const express = require('express');
const path = require('path');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

const products = [
  {
    id: 1,
    name: 'Гель для стирки Active Color',
    category: 'Гели',
    categoryKey: 'gel',
    brand: 'ACTIVE',
    volumeLabel: '2 л',
    volumeKey: 'large',
    price: 3600,
    oldPrice: 4200,
    isNew: true,
    badge: 'new',
    image: 'img/agel.png',
  },
];

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const normalizePhone = (value) => {
  const raw = String(value || '').trim();
  const hasLeadingPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');

  return hasLeadingPlus ? `+${digits}` : digits;
};

const isValidPhone = (value) => /^\+?\d{10,15}$/.test(value);

app.get('/api/products', (_req, res) => {
  res.json(products);
});

app.post('/api/subscriptions', async (req, res) => {
  const { whatsapp, clientNumber, contactType = 'whatsapp' } = req.body || {};
  const normalizedPhone = normalizePhone(clientNumber || whatsapp);

  if (!isValidPhone(normalizedPhone)) {
    return res.status(400).json({ message: 'Некорректный номер WhatsApp' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.RESEND_TO_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!resendApiKey || !toEmail) {
    return res.status(200).json({
      message: 'Заявка принята локально. Добавьте RESEND_API_KEY и RESEND_TO_EMAIL в .env для отправки email.',
    });
  }

  try {
    const resend = new Resend(resendApiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: `Новая заявка с Himtex сайта: ${normalizedPhone}`,
      html: `<p><strong>Тип контакта:</strong> ${escapeHtml(contactType)}</p><p><strong>Номер клиента:</strong> ${escapeHtml(normalizedPhone)}</p><p><strong>WhatsApp:</strong> ${escapeHtml(normalizedPhone)}</p>`,
    });

    if (error) {
      return res.status(502).json({ message: `Resend error: ${error.message}` });
    }

    return res.json({ message: 'Заявка успешно отправлена', emailId: data?.id });
  } catch (_error) {
    return res.status(500).json({ message: 'Сетевая ошибка при отправке email' });
  }
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'main.html'));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server started on http://localhost:${PORT}`);
});
