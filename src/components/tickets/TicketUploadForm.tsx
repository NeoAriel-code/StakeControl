"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { FileImage, LoaderCircle, UploadCloud } from "lucide-react";
import {
  uploadTicketAction,
  type TicketUploadActionState,
} from "@/lib/ticket-actions";

const initialState: TicketUploadActionState = {};

const ACCEPTED_TYPES = ".jpg,.jpeg,.png,.webp";

function SubmitTicketButton() {
  const { pending } = useFormStatus();

  return (
    <div className="space-y-3">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70"
      >
        {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
        {pending ? "Procesando ticket..." : "Subir ticket"}
      </button>
      {pending && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Extrayendo texto y preparando la revisión.
        </p>
      )}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TicketUploadForm() {
  const [state, action] = useActionState(uploadTicketAction, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function updateSelectedFile(file: File | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setSelectedFile(file);

    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
  }

  function assignFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      updateSelectedFile(null);
      return;
    }

    const file = files[0];
    updateSelectedFile(file);

    if (inputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      inputRef.current.files = dataTransfer.files;
    }
  }

  return (
    <form action={action} className="space-y-6">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          assignFiles(event.dataTransfer.files);
        }}
        className={`rounded-3xl border-2 border-dashed p-8 text-center transition ${
          isDragging
            ? "border-primary bg-accent"
            : "border-border-strong bg-background hover:border-primary/40 hover:bg-accent/40"
        }`}
        aria-label="Zona para arrastrar y soltar ticket"
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UploadCloud size={26} />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              Arrastra tu ticket aquí o haz clic para seleccionarlo
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Formatos permitidos: JPG, PNG y WEBP. Tamaño máximo: 10 MB.
            </p>
          </div>
        </div>

        <input
          ref={inputRef}
          id="ticketFile"
          name="ticketFile"
          type="file"
          accept={ACCEPTED_TYPES}
          className="sr-only"
          onChange={(event) => assignFiles(event.target.files)}
        />
      </div>

      {selectedFile && (
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-primary">
              <FileImage size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{selectedFile.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedFile.type || "Archivo"} · {formatBytes(selectedFile.size)}
              </p>
            </div>
          </div>

          {previewUrl ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-background p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Vista previa del ticket"
                className="h-auto max-h-[420px] w-full rounded-xl object-contain"
              />
            </div>
          ) : null}
        </div>
      )}

      {state.error && (
        <p className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <SubmitTicketButton />
    </form>
  );
}
