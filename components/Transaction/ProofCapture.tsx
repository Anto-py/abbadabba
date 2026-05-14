"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
};

export function ProofCapture({ value, onChange, required }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    if (value.type === "application/pdf") {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    onChange(f);
  }

  return (
    <div className="space-y-2">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFile}
      />

      {value ? (
        <div className="rounded-xl bg-white p-3 shadow-sm">
          {preview ? (
            <img
              src={preview}
              alt="Preuve"
              className="mx-auto max-h-64 rounded-md object-contain"
            />
          ) : (
            <p className="text-center text-sm text-zinc-600">
              📄 {value.name}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
            <span className="truncate">{value.name}</span>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="ml-2 rounded-md px-2 py-1 text-red-600 hover:bg-red-50"
            >
              Retirer
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="rounded-xl border-2 border-dashed border-zinc-300 px-3 py-4 text-sm text-zinc-600 hover:border-[#1a1a2e] hover:text-[#1a1a2e]"
          >
            📷 Photo
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border-2 border-dashed border-zinc-300 px-3 py-4 text-sm text-zinc-600 hover:border-[#1a1a2e] hover:text-[#1a1a2e]"
          >
            📎 Fichier
          </button>
        </div>
      )}
      {required && !value && (
        <p className="text-xs text-zinc-500">
          Une preuve est requise pour cette catégorie.
        </p>
      )}
    </div>
  );
}
