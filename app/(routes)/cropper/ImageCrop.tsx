"use client";

import { useState, useEffect, useRef } from "react";
import { renderBytes } from "@/components/ui/shadcn-io/dropzone";
import { loadImageFromFile } from "@/app/utils/file.utils";
import { imageToCanvas } from "@/app/utils/image.utils";
import { cropCanvas } from "@/app/lib/imgmanip";

interface ImageProps {
  file: File;
  isSelected?: boolean;
  previewOffset?: number;
}

export function ImageCrop({
  file,
  isSelected = false,
  previewOffset = 0,
}: ImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [fileName] = useState(file.name);
  const [fileSize] = useState(file.size);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;

    loadImageFromFile(file)
      .then((img) => {
        if (!mounted) return;
        setOriginalImage(img);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load image:", err);
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [file]);

  useEffect(() => {
    if (!originalImage || !canvasRef.current) return;

    const tempCanvas = imageToCanvas(originalImage);
    const croppedCanvas = cropCanvas(tempCanvas, previewOffset);

    const canvas = canvasRef.current;
    canvas.width = croppedCanvas.width;
    canvas.height = croppedCanvas.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(croppedCanvas, 0, 0);
  }, [originalImage, previewOffset]);

  return (
    <div className="w-full h-full flex flex-col border rounded-lg overflow-hidden bg-card">
      <div
        className={`relative w-full aspect-square bg-muted transition-opacity duration-300 ${
          isSelected
            ? "opacity-100 ring-2 ring-primary"
            : "opacity-100 hover:opacity-95"
        }`}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <canvas ref={canvasRef} className="w-full h-full object-cover" />
      </div>

      <div className="px-4 py-3 border-t border-border bg-card">
        <p className="text-sm font-medium text-foreground truncate">
          {fileName}
        </p>
        <p className="font-bold">{renderBytes(fileSize)}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Click to {isSelected ? "deselect" : "select"}
        </p>
      </div>
    </div>
  );
}
