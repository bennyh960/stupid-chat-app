"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider"; // Ensure you ran: npx shadcn-ui@latest add slider
import {
  Paperclip,
  Send,
  Download,
  Trash2,
  Eraser,
  Settings2,
  RefreshCw,
  Play,
  Square,
  ChevronDown,
} from "lucide-react";

export default function SmartChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [user, setUser] = useState("userA");

  // --- Polling States ---
  const [isPolling, setIsPolling] = useState(true);
  const [intervalTime, setIntervalTime] = useState(2000);
  const [showConfig, setShowConfig] = useState(false);

  // --- Scrolling Ref ---
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // This function scrolls the specific viewport of the Shadcn ScrollArea
  const handleScroll = () => {
    const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (viewport) {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      // If we are within 50px of the bottom, consider us "at the bottom"
      const isBottom = scrollHeight - scrollTop <= clientHeight + 50;
      setIsAtBottom(isBottom);
    }
  };

  // 2. Attach scroll listener to the viewport
  useEffect(() => {
    const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (viewport) {
      viewport.addEventListener("scroll", handleScroll);
      return () => viewport.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // 3. Only scroll to bottom if the user was already there
  useEffect(() => {
    if (isAtBottom) {
      const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]");
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [messages, isAtBottom]);

  // 1. Fetch Logic
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Polling error:", err);
    }
  }, []);

  // 3. The Controlled Interval (The "Heartbeat")
  useEffect(() => {
    if (!isPolling) return;

    fetchMessages(); // Initial fetch
    const id = setInterval(fetchMessages, intervalTime);

    return () => clearInterval(id); // Cleanup on stop or interval change
  }, [isPolling, intervalTime, fetchMessages]);

  // 4. Send Message
  const handleSend = async () => {
    if (!text && !file) return;
    const formData = new FormData();
    formData.append("message", text);
    formData.append("sender", user);
    formData.append("receiver", user === "userA" ? "userB" : "userA");
    if (file) formData.append("file", file);

    await fetch("/api/chat", { method: "POST", body: formData });
    setText("");
    setFile(null);
    fetchMessages(); // Refresh immediately after sending
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4 gap-4">
      {/* Top Controller */}
      <div className="w-full max-w-[500px] flex items-center justify-between bg-white p-2 rounded-lg border shadow-sm">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-md">
          <Button size="sm" variant={user === "userA" ? "default" : "ghost"} onClick={() => setUser("userA")}>
            User A
          </Button>
          <Button size="sm" variant={user === "userB" ? "default" : "ghost"} onClick={() => setUser("userB")}>
            User B
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setShowConfig(!showConfig)}
            className={showConfig ? "border-orange-500 text-orange-500" : ""}
          >
            <Settings2 size={18} />
          </Button>
          <Button size="icon" variant="outline" onClick={fetchMessages} title="Manual Sync">
            <RefreshCw size={18} />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            onClick={() => fetch("/api/chat/clear", { method: "POST" }).then(fetchMessages)}
          >
            <Eraser size={18} />
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-start max-w-[800px] w-full justify-center flex-wrap">
        {/* Main Chat Window */}
        <Card className="w-full max-w-[500px] shadow-xl border-0 overflow-hidden">
          <CardHeader className="bg-white border-b flex flex-row items-center justify-between py-3">
            <CardTitle className="text-md font-bold text-slate-700">P2P File Transfer</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">{intervalTime}ms</span>
              <div className={`h-2 w-2 rounded-full ${isPolling ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea ref={scrollRef} className="h-[450px] p-4 bg-slate-50/50">
              {messages.map((m) => (
                <div key={m.id} className={`mb-4 flex ${m.sender === user ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
                      m.sender === user
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white text-slate-800 border rounded-tl-none"
                    }`}
                  >
                    <p className="text-sm">{m.message}</p>
                    {m.attached &&
                      m.attached.map((f: string) => (
                        <div
                          key={f}
                          className="mt-2 pt-2 border-t border-black/10 flex items-center justify-between gap-4"
                        >
                          {m.status === "downloaded" ? (
                            <span className="text-[10px] italic opacity-50">File downloaded & deleted</span>
                          ) : (
                            <a
                              href={`/api/download/${f}`}
                              className="flex items-center gap-1 text-xs font-bold underline decoration-2 underline-offset-4"
                            >
                              <Download size={14} /> {f.split("_").pop()}
                            </a>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-4 bg-white border-t flex flex-col gap-2">
            {file && (
              <div className="w-full bg-blue-50 text-blue-700 text-xs p-2 rounded flex justify-between items-center border border-blue-100">
                <span className="truncate flex items-center gap-2">
                  <Paperclip size={12} /> {file.name}
                </span>
                <button onClick={() => setFile(null)}>
                  <Trash2 size={14} className="text-red-400 hover:text-red-600" />
                </button>
              </div>
            )}
            <div className="flex w-full gap-2">
              <Input
                type="file"
                id="file-input"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <Button
                size="icon"
                variant="outline"
                className="shrink-0"
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <Paperclip size={20} />
              </Button>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Message..."
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button onClick={handleSend} className="bg-blue-600">
                <Send size={18} />
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Configuration Window */}
        {showConfig && (
          <Card className="w-[280px] shadow-lg animate-in fade-in zoom-in duration-200 border-orange-200">
            <CardHeader className="bg-orange-50/50 border-b py-3">
              <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
                <Settings2 size={16} /> Request Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-500 uppercase">Auto-Fetch Status</Label>
                <Button
                  className="w-full justify-between"
                  variant={isPolling ? "outline" : "default"}
                  onClick={() => setIsPolling(!isPolling)}
                >
                  {isPolling ? (
                    <>
                      <Square size={14} /> Stop Polling
                    </>
                  ) : (
                    <>
                      <Play size={14} /> Start Polling
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Fetch Every</Label>
                  <span className="text-xs font-bold text-orange-600">{(intervalTime / 1000).toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="500"
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  value={intervalTime}
                  onChange={(e) => setIntervalTime(Number(e.target.value))}
                />
                <p className="text-[10px] text-slate-400 leading-tight">
                  Faster polling makes the chat feel real-time but uses more battery/CPU.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
