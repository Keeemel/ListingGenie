import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, PLANS, PlanKey } from "@/lib/stripe";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const body = (await req.json()) as { plan: PlanKey };
  const plan = PLANS[body.plan];

  if (!plan) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const origin =
    req.headers.get("origin") ??
    req.headers.get("referer")?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/`,
    metadata: { userId: user.id, plan: body.plan },
    customer_email: user.email,
  });

  return NextResponse.json({ url: session.url });
}
