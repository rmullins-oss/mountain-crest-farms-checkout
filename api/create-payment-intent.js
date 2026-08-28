const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, items, customerEmail } = req.body;

    if (!amount || amount < 50) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true
      },
      receipt_email: customerEmail || undefined,
      metadata: {
        app: "Mountain Crest Farms",
        items: JSON.stringify(items || [])
      }
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
};
