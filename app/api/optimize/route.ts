import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateOptimizedListing } from "@/lib/optimize";
import { Platform, Issue } from "@/types/audit";

const VALID_PLATFORMS = new Set<Platform>([
  "amazon", "ebay", "etsy", "shopify", "vinted", "other",
]);

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  if (profile.credits <= 0) {
    return NextResponse.json(
      { error: "No optimizations remaining." },
      { status: 402 },
    );
  }

  let body: { title: string; description: string; platform: Platform; issues: Issue[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const platform: Platform = VALID_PLATFORMS.has(body.platform)
    ? body.platform
    : "other";

  let optimized;
  try {
    optimized = await generateOptimizedListing(
      body.title ?? "",
      body.description ?? "",
      platform,
      body.issues ?? [],
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Optimization failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await supabase
    .from("profiles")
    .update({ credits: profile.credits - 1 })
    .eq("id", user.id);

  return NextResponse.json({
    optimizedTitle: optimized.optimizedTitle,
    optimizedDescription: optimized.optimizedDescription,
    creditsRemaining: profile.credits - 1,
  });
}
