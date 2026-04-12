import { NextResponse } from "next/server";

import { deleteSessionFromRequest } from "@/lib/auth";

export async function POST() {
  await deleteSessionFromRequest();
  return NextResponse.json({ ok: true });
}
