import { NextRequest, NextResponse } from "next/server";
import { getStripe, PLANS, PlanKey } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import Stripe from "stripe";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing Stripe-Signature header." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[webhook] Signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook error: ${message}` },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const planKey = session.metadata?.plan as PlanKey | undefined;

    if (!userId || !planKey || !PLANS[planKey]) {
      console.error("[webhook] Missing or invalid metadata:", session.metadata);
      return NextResponse.json(
        { error: "Missing metadata." },
        { status: 400 },
      );
    }

    const creditsToAdd = PLANS[planKey].credits;

    // Read current balance then increment atomically
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    const current = profile?.credits ?? 0;
    const { error: updateError } = await admin
      .from("profiles")
      .update({ credits: current + creditsToAdd })
      .eq("id", userId);

    if (updateError) {
      console.error("[webhook] Failed to credit user:", updateError);
      return NextResponse.json(
        { error: "Failed to update credits." },
        { status: 500 },
      );
    }

    console.log(`[webhook] Credited ${creditsToAdd} optimizations to user ${userId}`);
  }

  return NextResponse.json({ received: true });
}
