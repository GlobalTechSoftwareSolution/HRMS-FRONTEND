import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export function GET() {
  const filePath = path.join(process.cwd(), "src/app/bot/index.html");
  const html = fs.readFileSync(filePath, "utf8");

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
