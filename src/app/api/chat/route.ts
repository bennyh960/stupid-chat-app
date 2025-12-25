import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const JSON_PATH = path.join(process.cwd(), "data", "messages.json");
const FILES_DIR = path.join(process.cwd(), "attached-files");

// Ensure directories exist
if (!fs.existsSync(path.join(process.cwd(), "data"))) fs.mkdirSync(path.join(process.cwd(), "data"));
if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR);
if (!fs.existsSync(JSON_PATH)) fs.writeFileSync(JSON_PATH, JSON.stringify([]));

export async function GET() {
  const data = fs.readFileSync(JSON_PATH, "utf-8");
  return NextResponse.json(JSON.parse(data));
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const message = formData.get("message") as string;
  const sender = formData.get("sender") as string;
  const receiver = formData.get("receiver") as string;
  const file = formData.get("file") as File | null;

  let attachedFileName = null;

  if (file) {
    const timestamp = Date.now();
    attachedFileName = `${sender}_to_${receiver}_${timestamp}_${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(FILES_DIR, attachedFileName), buffer);
  }

  const newMessage = {
    id: Date.now(),
    message,
    sender,
    receiver,
    timestamp: new Date().toISOString(),
    attached: attachedFileName ? [attachedFileName] : null,
  };

  const currentData = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
  currentData.push(newMessage);
  fs.writeFileSync(JSON_PATH, JSON.stringify(currentData, null, 2));

  return NextResponse.json({ success: true });
}
