import Stripe from 'stripe';

let _stripe;

/** Lazy init so the server can boot without Stripe in local dev. */
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is required for payment operations');
  }
  if (!_stripe) {
    _stripe = new Stripe(key, {
      apiVersion: '2024-06-20',
    });
  }
  return _stripe;
}

/** `amount` is in major currency units (e.g. EUR); converted to smallest unit for Stripe. */
export const createPaymentIntent = async ({
  amount,
  currency = 'eur',
  bookingId,
  userId,
  description,
  metadata = {},
}) => {
  const stripe = getStripe();
  return stripe.paymentIntents.create({
    amount: Math.round(Number(amount) * 100),
    currency,
    description,
    metadata: {
      booking_id: bookingId,
      user_id: userId,
      ...metadata,
    },
    automatic_payment_methods: { enabled: true },
  });
};

export const createCheckoutSession = async ({
  lineItems,
  bookingId,
  userId,
  successUrl,
  cancelUrl,
  metadata = {},
}) => {
  const stripe = getStripe();
  return stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      booking_id: bookingId,
      user_id: userId,
      ...metadata,
    },
  });
};

export const constructWebhookEvent = (payload, signature) => {
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!whSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required for webhooks');
  }
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, whSecret);
};
