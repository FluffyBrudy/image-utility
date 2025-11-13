"use client";
import { useState } from "react";
import Image from "next/image";
import { renderBytes } from "@/components/ui/shadcn-io/dropzone";

interface ImageProps {
  file: File;
  isSelected?: boolean;
}

export function ImageCrop({ file, isSelected }: ImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  const src = URL.createObjectURL(file);

  const fileName = file.name;

  return (
    <div className="w-full h-full flex flex-col">
      <div
        className={`relative w-full aspect-square bg-muted overflow-hidden transition-opacity duration-300 ${
          isSelected ? "opacity-100" : "opacity-100 hover:opacity-95"
        }`}
      >
        <Image
          src={src}
          alt={fileName}
          fill
          className="object-cover"
          onLoadingComplete={() => setIsLoading(false)}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
      </div>

      <div className="px-4 py-3 bg-card border-t border-border">
        <p className="text-sm font-medium text-foreground truncate">
          {fileName}
        </p>
        <p className="font-bold">{renderBytes(file.size)}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Click to {isSelected ? "deselect" : "select"}
        </p>
      </div>
    </div>
  );
}
