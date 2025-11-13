"use client";

import { useImageStore } from "@/app/store/image.store";
import { Button } from "@/components/ui/button";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { X as Close, Upload, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Page() {
  const navigate = useRouter();
  const setImageFiles = useImageStore((state) => state.setImagesPath);
  const removeFile = useImageStore((state) => state.removeElement);
  const files = useImageStore((state) => state.imageFiles);

  const handleDrop = (files: File[]) => {
    setImageFiles(files);
  };

  const hasFiles = files && files.size > 0;

  const handleToolChoice = () => {
    navigate.push("/cropper");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-12 max-w-2xl">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
          <Upload className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-3">
          Crop Your Images
        </h1>
        <p className="text-lg text-muted-foreground">
          Upload your images and automatically remove transparent pixels for the
          perfect crop
        </p>
      </div>

      <section className="w-full max-w-2xl">
        <Dropzone
          accept={{ "image/*": [".png", ".jpg", ".jpeg"] }}
          maxFiles={3}
          onDrop={handleDrop}
          onError={console.error}
          src={hasFiles ? Array.from(files) : undefined}
          noClick={hasFiles}
          className="rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 p-8 transition-colors hover:border-primary/40 hover:bg-primary/10"
        >
          {!hasFiles ? (
            <DropzoneEmptyState />
          ) : (
            <DropzoneContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    {files.size} {files.size === 1 ? "image" : "images"} ready
                  </h2>
                  <div
                    role="button"
                    onClick={() => setImageFiles([])}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Clear
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from(files).map((image) => (
                    <div
                      key={image.name}
                      className="group relative rounded-lg overflow-hidden border border-border bg-muted hover:border-primary/40 transition-colors"
                    >
                      <button
                        onClick={() => removeFile(image)}
                        className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-destructive/90 hover:bg-destructive flex items-center justify-center transition-colors"
                        aria-label={`Remove ${image.name}`}
                      >
                        <Close className="h-4 w-4 text-white" />
                      </button>

                      <div className="relative w-full aspect-square overflow-hidden bg-muted">
                        <Image
                          src={URL.createObjectURL(image) || "/placeholder.svg"}
                          alt={`${image.name} preview`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="px-3 py-2 bg-card border-t border-border">
                        <p className="text-xs text-muted-foreground truncate">
                          {image.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DropzoneContent>
          )}
        </Dropzone>
      </section>

      <div className="flex gap-3 mt-10">
        <Button
          disabled={!hasFiles}
          onClick={handleToolChoice}
          size="lg"
          className="gap-2"
        >
          Start Cropping
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mt-8 text-center max-w-xs">
        Support for PNG, JPG, and JPEG formats. Up to 3 images at a time.
      </p>
    </main>
  );
}
