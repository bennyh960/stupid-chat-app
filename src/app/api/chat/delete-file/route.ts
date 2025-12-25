import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  const { msgId, filename } = await req.json();
  const JSON_PATH = path.join(process.cwd(), "data", "messages.json");
  const filePath = path.join(process.cwd(), "attached-files", filename);

  // 1. Remove file from disk
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  // 2. Update JSON: remove attachment reference from that message
  const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
  const updatedData = data.map((m: any) => {
    if (m.id === msgId) {
      return { ...m, attached: null, status: "deleted" };
    }
    return m;
  });

  fs.writeFileSync(JSON_PATH, JSON.stringify(updatedData, null, 2));
  return NextResponse.json({ success: true });
}
