import { NextResponse } from "next/server";

export async function POST() {
  const newSecret = `whsec_${Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;

  return NextResponse.json({ secret: newSecret });
}