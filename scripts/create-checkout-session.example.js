// Example Express endpoint for creating a Stripe Checkout Session.
// Copy this to your backend, set STRIPE_SECRET_KEY in env, and deploy.

const express = require('express');
const Stripe = require('stripe');

const app = express();
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post('/create-checkout-session', async (req, res) => {
  const { priceId, quantity = 1 } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity }],
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
