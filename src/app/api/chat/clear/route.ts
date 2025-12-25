import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST() {
  const jsonPath = path.join(process.cwd(), "data", "messages.json");
  const filesDir = path.join(process.cwd(), "attached-files");

  // Clear JSON
  fs.writeFileSync(jsonPath, JSON.stringify([]));

  // Delete all files in directory
  const files = fs.readdirSync(filesDir);
  for (const file of files) {
    fs.unlinkSync(path.join(filesDir, file));
  }

  return NextResponse.json({ success: true });
}
