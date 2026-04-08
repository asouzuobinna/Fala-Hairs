// utils/whatsappBuilder.js
const COLOR_NAMES = {
  '1': 'Jet Black',
  '1B': 'Natural Black',
  '2': 'Dark Brown',
  '4': 'Medium Brown',
  '27': 'Honey Blonde',
  '613': 'Platinum Blonde'
};

function buildWhatsAppMessage(product, length, color, quantity = 1) {
  const colorName = COLOR_NAMES[color] || color;
  return `Hello FALA Hairs! 👋

I would like to place an order:

🛍 *Product:* ${product.name}
📏 *Length:* ${length} inches
🎨 *Color:* ${colorName} (${color})
📦 *Quantity:* ${quantity}
💰 *Price:* ₦${(product.price * quantity).toLocaleString()}

Please confirm availability and share payment details.

Thank you! ✨`;
}

function buildWhatsAppURL(phone, message) {
  const clean = phone.replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

module.exports = { buildWhatsAppMessage, buildWhatsAppURL, COLOR_NAMES };
