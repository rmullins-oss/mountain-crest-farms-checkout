export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      if (!env.STRIPE_SECRET_KEY) {
        return new Response(JSON.stringify({ error: "Missing STRIPE_SECRET_KEY" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      const body = await request.json();

      const amount = body.amount;
      const items = body.items || [];
      const customerEmail = body.customerEmail || "";

      if (!amount || amount < 50) {
        return new Response(JSON.stringify({ error: "Invalid amount" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const form = new URLSearchParams();
      form.append("amount", String(amount));
      form.append("currency", "usd");
      form.append("automatic_payment_methods[enabled]", "true");

      if (customerEmail) {
        form.append("receipt_email", customerEmail);
      }

      form.append("metadata[app]", "Mountain Crest Farms");
      form.append("metadata[items]", JSON.stringify(items));

      const stripeResponse = await fetch("https://api.stripe.com/v1/payment_intents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: form
      });

      const stripeData = await stripeResponse.json();

      if (!stripeResponse.ok) {
        return new Response(JSON.stringify({
          error: stripeData.error?.message || "Stripe error"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({
        clientSecret: stripeData.client_secret
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
