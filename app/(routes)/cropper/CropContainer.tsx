"use client";
import { useImageStore } from "@/app/store/image.store";
import { ImageCrop } from "./ImageCrop";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { loadImageFromFile } from "@/app/utils/file.utils";
import { imageToCanvas } from "@/app/utils/image.utils";
import { cropCanvas } from "@/app/lib/imgmanip";

const BATCH_SIZE = 3;

export default function CropContainer() {
  const files = useImageStore((state) => state.imageFiles);
  const [selectedFiles, setSelectedFile] = useState<File[]>([]);

  const handleSelectedFile = (file: File) => {
    if (selectedFiles.includes(file))
      setSelectedFile((states) => states.filter((state) => state !== file));
    else setSelectedFile((states) => [file, ...states]);
  };
  const handleDownloadAll = async () => {
    for (let i = 0; i < selectedFiles.length; i += BATCH_SIZE) {
      const batch = selectedFiles.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (file) => {
          try {
            const img = await loadImageFromFile(file);
            const canvas = imageToCanvas(img);
            const croppedCanvas = cropCanvas(canvas);
            const blob = await new Promise<Blob | null>((resolve) =>
              croppedCanvas.toBlob(resolve),
            );
            if (!blob) return;
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(a.href);
          } catch (err) {
            console.error("Failed to process file:", file.name, err);
          }
        }),
      );
    }
  };

  return (
    <div>
      {Array.from(files).map((file, i) => (
        <ImageCrop
          key={i}
          pathOrFile={file}
          onClick={() => {
            handleSelectedFile(file);
          }}
        />
      ))}
      <div>
        <Button onClick={handleDownloadAll}>Crop transparent pixel</Button>
      </div>
    </div>
  );
}
