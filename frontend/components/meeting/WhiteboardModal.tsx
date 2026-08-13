"use client";

import { useState, useRef, useEffect } from "react";
import { Pen, Eraser, RotateCcw, Download, Square, Circle, Minus, Palette, X } from "lucide-react";
import Button from "@/components/ui/Button";

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhiteboardModal({ isOpen, onClose }: WhiteboardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser" | "line" | "rect" | "circle">("pen");
  const [color, setColor] = useState("#0E72ED");
  const [lineWidth, setLineWidth] = useState(4);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = canvas.parentElement?.clientWidth || 800;
          canvas.height = 480;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    link.download = "meeting-whiteboard.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-700/40">
        {/* Header */}
        <div className="px-6 py-4 bg-zoom-dark text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Pen className="text-zoom-blue" size={20} />
            <h2 className="text-base font-bold">In-Meeting Whiteboard</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleClear} className="flex items-center gap-1 text-xs">
              <RotateCcw size={12} /> Clear
            </Button>
            <Button variant="primary" size="sm" onClick={handleDownload} className="flex items-center gap-1 text-xs">
              <Download size={12} /> Save PNG
            </Button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-slate-100 p-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 select-none">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTool("pen")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                tool === "pen" ? "bg-zoom-blue text-white" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Pen size={14} /> Pen
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                tool === "eraser" ? "bg-zoom-blue text-white" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Eraser size={14} /> Eraser
            </button>
            <button
              onClick={() => setTool("line")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                tool === "line" ? "bg-zoom-blue text-white" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Minus size={14} /> Line
            </button>
            <button
              onClick={() => setTool("rect")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                tool === "rect" ? "bg-zoom-blue text-white" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Square size={14} /> Rect
            </button>
            <button
              onClick={() => setTool("circle")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                tool === "circle" ? "bg-zoom-blue text-white" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Circle size={14} /> Circle
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Palette size={14} className="text-slate-500 mr-1" />
              {["#0E72ED", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#000000"].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border border-white cursor-pointer transition-transform ${
                    color === c ? "ring-2 ring-slate-700 scale-110" : ""
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span>Size:</span>
              <input
                type="range"
                min="2"
                max="20"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-16 cursor-pointer accent-zoom-blue"
              />
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="bg-white flex justify-center touch-none p-2">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="cursor-crosshair w-full rounded-lg border border-slate-200 block"
          />
        </div>
      </div>
    </div>
  );
}
