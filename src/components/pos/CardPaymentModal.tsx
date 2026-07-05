"use client";

import { useEffect, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { getStripePromise } from "@/lib/stripe-client";
import { createPaymentIntent } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { CreateOrderItemInput } from "@/types";

const stripePromise = getStripePromise();

interface CardPaymentModalProps {
  items: CreateOrderItemInput[];
  total: number;
  onCancel: () => void;
  onPaid: (paymentIntentId: string) => void;
  onError: (message: string) => void;
}

export function CardPaymentModal({
  items,
  total,
  onCancel,
  onPaid,
  onError,
}: CardPaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Open a PaymentIntent as soon as the modal mounts.
  useEffect(() => {
    let active = true;
    createPaymentIntent(items)
      .then((res) => {
        if (active) setClientSecret(res.clientSecret);
      })
      .catch((err: unknown) => {
        onError(
          err instanceof Error ? err.message : "Failed to initialise payment",
        );
        onCancel();
      });
    return () => {
      active = false;
    };
    // Intentionally run once for this cart snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const options: StripeElementsOptions = clientSecret
    ? { clientSecret, appearance: { theme: "stripe" } }
    : {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-[400px] max-w-full flex-col overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink dark:text-white">
            Card Payment
          </h2>
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-tertiary hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-dark-hover"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex justify-between rounded-xl bg-stone-50 p-3 text-sm dark:bg-dark-surface">
          <span className="text-ink-secondary dark:text-stone-400">
            Amount due
          </span>
          <span className="font-bold text-ink dark:text-white">
            {formatCurrency(total)}
          </span>
        </div>

        {clientSecret ? (
          <Elements stripe={stripePromise} options={options}>
            <PaymentForm onPaid={onPaid} onError={onError} />
          </Elements>
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-ink-tertiary dark:text-stone-500">
            Initialising secure payment…
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentForm({
  onPaid,
  onError,
}: {
  onPaid: (paymentIntentId: string) => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      onError(error.message ?? "Payment failed");
      setSubmitting(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      onPaid(paymentIntent.id);
    } else {
      onError("Payment was not completed");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          // A POS terminal only needs the card itself — drop the billing
          // address/country and Link's email/phone/name to keep the form short.
          layout: "tabs",
          fields: { billingDetails: "never" },
          wallets: { applePay: "never", googlePay: "never" },
        }}
      />
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-xl bg-dark-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-dark-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Processing…" : "Pay now"}
      </button>
      <p className="text-center text-xs text-ink-tertiary dark:text-stone-500">
        Test card: 4242 4242 4242 4242 · any future date · any CVC
      </p>
    </form>
  );
}
