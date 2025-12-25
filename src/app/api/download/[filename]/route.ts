import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  // Decode the URL-encoded filename from the request params
  const decodedFilename = decodeURIComponent(filename);
  const filePath = path.join(process.cwd(), "attached-files", decodedFilename);
  const jsonPath = path.join(process.cwd(), "data", "messages.json");

  if (!fs.existsSync(filePath)) return new Response("File Not Found", { status: 404 });

  const fileBuffer = fs.readFileSync(filePath);

  // 1. Update JSON status
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const updatedData = data.map((msg: any) => {
      if (msg.attached && msg.attached.includes(decodedFilename)) {
        return { ...msg, status: "downloaded" };
      }
      return msg;
    });
    fs.writeFileSync(jsonPath, JSON.stringify(updatedData, null, 2));
  }

  // 2. Encode for Header (Supports Hebrew/Unicode)
  const safeFilename = encodeURIComponent(decodedFilename);

  // 3. Delete file after short delay
  setTimeout(() => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }, 2000);

  return new NextResponse(fileBuffer, {
    headers: {
      // filename* uses UTF-8 encoding which supports Hebrew
      "Content-Disposition": `attachment; filename*=UTF-8''${safeFilename}`,
      "Content-Type": "application/octet-stream",
    },
  });
}
