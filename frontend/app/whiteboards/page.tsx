"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pen, Eraser, RotateCcw, Download, Square, Circle, Minus, Palette } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { User } from "@/types";

export default function WhiteboardsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser" | "line" | "rect" | "circle">("pen");
  const [color, setColor] = useState("#0E72ED");
  const [lineWidth, setLineWidth] = useState(4);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);

  useEffect(() => {
    api.getCurrentUser().then(setUser).catch(console.error);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.parentElement?.clientWidth || 900;
      canvas.height = 550;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const handleNewMeeting = async () => {
    try {
      const meeting = await api.createInstantMeeting();
      const code = meeting.meeting_code.replace(/\s/g, "");
      router.push(`/meeting/${code}/lobby`);
    } catch (err) {
      console.error("Failed to create meeting:", err);
    }
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getPos(e);
    setIsDrawing(true);
    setStartPos({ x, y });

    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setSnapshot(snap);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = tool === "eraser" ? lineWidth * 4 : lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !startPos) return;

    const { x, y } = getPos(e);

    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = tool === "eraser" ? lineWidth * 4 : lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "pen" || tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      setStartPos({ x, y });
    } else {
      if (snapshot) {
        ctx.putImageData(snapshot, 0, 0);
      }
      ctx.beginPath();
      if (tool === "line") {
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(x, y);
      } else if (tool === "rect") {
        ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
      } else if (tool === "circle") {
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      }
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setStartPos(null);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "meetclone-whiteboard.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen bg-zoom-surface">
      <Sidebar />
      <div className="ml-[68px]">
        <TopNav user={user} onNewMeeting={handleNewMeeting} />

        <main className="max-w-[1000px] mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-zoom-text-primary flex items-center gap-2">
                <Pen className="text-zoom-blue" size={28} />
                Interactive Whiteboard
              </h1>
              <p className="text-sm text-zoom-text-secondary mt-0.5">
                Brainstorm, draw diagrams, and export concepts during team sessions
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleClear} className="flex items-center gap-1.5">
                <RotateCcw size={14} /> Clear Canvas
              </Button>
              <Button variant="primary" size="sm" onClick={handleDownload} className="flex items-center gap-1.5">
                <Download size={14} /> Export PNG
              </Button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-white rounded-t-xl border border-zoom-border p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs select-none">
            {/* Tool Selection */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTool("pen")}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  tool === "pen" ? "bg-zoom-blue text-white" : "text-zoom-text-secondary hover:bg-slate-100"
                }`}
                title="Pen Tool"
              >
                <Pen size={16} /> Pen
              </button>
              <button
                onClick={() => setTool("eraser")}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  tool === "eraser" ? "bg-zoom-blue text-white" : "text-zoom-text-secondary hover:bg-slate-100"
                }`}
                title="Eraser Tool"
              >
                <Eraser size={16} /> Eraser
              </button>
              <button
                onClick={() => setTool("line")}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  tool === "line" ? "bg-zoom-blue text-white" : "text-zoom-text-secondary hover:bg-slate-100"
                }`}
                title="Line Tool"
              >
                <Minus size={16} /> Line
              </button>
              <button
                onClick={() => setTool("rect")}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  tool === "rect" ? "bg-zoom-blue text-white" : "text-zoom-text-secondary hover:bg-slate-100"
                }`}
                title="Rectangle Tool"
              >
                <Square size={16} /> Rectangle
              </button>
              <button
                onClick={() => setTool("circle")}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  tool === "circle" ? "bg-zoom-blue text-white" : "text-zoom-text-secondary hover:bg-slate-100"
                }`}
                title="Circle Tool"
              >
                <Circle size={16} /> Circle
              </button>
            </div>

            {/* Color Palette & Stroke Size */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Palette size={16} className="text-zoom-text-secondary" />
                {["#0E72ED", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#000000"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                      color === c ? "border-slate-800 scale-110" : "border-white"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zoom-text-secondary font-medium">Size:</span>
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  className="w-20 cursor-pointer accent-zoom-blue"
                />
              </div>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="bg-white rounded-b-xl border-x border-b border-zoom-border shadow-sm overflow-hidden flex justify-center touch-none">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="cursor-crosshair w-full block"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
