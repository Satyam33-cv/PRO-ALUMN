import { NextResponse } from "next/server";

const currentSecret = `whsec_${Array.from(crypto.getRandomValues(new Uint8Array(24)))
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("")}`;

export async function GET() {
  return NextResponse.json({ secret: currentSecret });
}