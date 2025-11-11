"use client";

import { useImageStore } from "@/app/store/image.store";
import { Button } from "@/components/ui/button";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { X as Close } from "lucide-react";
import Image from "next/image";

export default function Page() {
  const setImageFiles = useImageStore((state) => state.setImagesPath);
  const removeFile = useImageStore((state) => state.removeElement);
  const files = useImageStore((state) => state.imageFiles);
  const handleDrop = (files: File[]) => {
    setImageFiles(files);
  };

  const hasFiles = files && files.size > 0;

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-muted/30 px-4">
      <section className="w-full max-w-2xl">
        <Dropzone
          accept={{ "image/*": [".png", ".jpg", ".jpeg"] }}
          maxFiles={3}
          onDrop={handleDrop}
          onError={console.error}
          src={hasFiles ? Array.from(files) : undefined}
          noClick={hasFiles}
          className="rounded-lg border-2 border-dashed border-muted-foreground/30 bg-background p-6"
        >
          {!hasFiles ? (
            <DropzoneEmptyState />
          ) : (
            <DropzoneContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from(files).map((image) => (
                  <div
                    key={image.name}
                    className="relative group rounded-md overflow-hidden border border-muted-foreground/20 bg-muted"
                  >
                    <div
                      onClick={() => removeFile(image)}
                      className="absolute top-1 right-1 z-10 h-6 w-6 rounded-full bg-red-600 flex items-center justify-center cursor-pointer"
                      aria-label={`Remove ${image.name}`}
                    >
                      <Close className="h-3 w-3 text-white" />
                    </div>
                    <Image
                      src={URL.createObjectURL(image)}
                      alt={`${image.name} preview`}
                      width={400}
                      height={300}
                      className="object-cover w-full h-40"
                    />
                  </div>
                ))}
              </div>
            </DropzoneContent>
          )}
        </Dropzone>

        {hasFiles && (
          <div className="flex justify-end mt-6">
            <Button variant="secondary" onClick={() => setImageFiles([])}>
              Clear All
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
