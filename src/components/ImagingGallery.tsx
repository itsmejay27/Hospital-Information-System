import React, { useEffect, useState } from "react";
import { ImagingFile, ImagingFileMeta } from "../types";
import { hospitalDb } from "../services/db";
import { X } from "./Icons";
import { dt } from "../services/time";

/** Turns a data: URL into a blob: URL so browsers will show PDFs inline. */
function toBlobUrl(dataUrl: string): string {
  const [head, body] = dataUrl.split(",");
  const mime = head.match(/data:([^;]+)/)?.[1] || "application/octet-stream";
  const bytes = atob(body);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return URL.createObjectURL(new Blob([arr], { type: mime }));
}

const isPdf = (f: { type: string }) => f.type === "application/pdf";

/** Thumbnails of a study's images; click one to open it full screen. */
export default function ImagingGallery({ images }: { images: ImagingFileMeta[] }) {
  const [files, setFiles] = useState<ImagingFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const ids = images.map(i => i.id).join(",");

  useEffect(() => {
    let active = true;
    setFiles(null);
    setError(null);
    hospitalDb
      .getImagingFiles(images.map(i => i.id))
      .then(found => {
        if (!active) return;
        // Keep the upload order
        const byId = new Map(found.map(f => [f.id, f]));
        setFiles(images.map(i => byId.get(i.id)).filter((f): f is ImagingFile => !!f));
      })
      .catch(() => active && setError("Could not load the images."));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  const current = open !== null && files ? files[open] : null;

  useEffect(() => {
    if (!current || !isPdf(current)) return setPdfUrl(null);
    const url = toBlobUrl(current.dataUrl);
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [current]);

  useEffect(() => {
    if (open === null || !files) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(null);
      } else if (e.key === "ArrowRight") setOpen(i => (i === null ? i : Math.min(files.length - 1, i + 1)));
      else if (e.key === "ArrowLeft") setOpen(i => (i === null ? i : Math.max(0, i - 1)));
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, files]);

  if (images.length === 0) return <p className="text-xs text-slate-400 italic">No images uploaded yet.</p>;
  if (error) return <p className="text-xs text-rose-600 font-semibold">{error}</p>;
  if (!files) return <p className="text-xs text-slate-400">Loading {images.length} image{images.length > 1 ? "s" : ""}…</p>;

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {files.map((f, i) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setOpen(i)}
            title={f.name}
            className="aspect-square rounded-lg border border-slate-200 bg-slate-900 overflow-hidden cursor-pointer hover:ring-2 hover:ring-emerald-500 flex items-center justify-center"
          >
            {isPdf(f) ? (
              <span className="text-[11px] font-bold text-white px-2 text-center break-all">PDF<br />{f.name}</span>
            ) : (
              <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover" />
            )}
          </button>
        ))}
      </div>

      {current && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col" onClick={() => setOpen(null)}>
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white text-xs" onClick={e => e.stopPropagation()}>
            <div className="min-w-0">
              <div className="font-bold truncate">{current.name}</div>
              <div className="text-white/60">
                {open! + 1} of {files.length} • uploaded {dt(current.uploadedAt)} by {current.uploadedBy}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a href={current.dataUrl} download={current.name} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-bold">
                Download
              </a>
              <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer">
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 px-2 pb-4 min-h-0">
            <button
              type="button"
              disabled={open === 0}
              onClick={e => {
                e.stopPropagation();
                setOpen(i => Math.max(0, (i ?? 0) - 1));
              }}
              className="w-10 h-10 rounded-full bg-white/10 text-white text-lg disabled:opacity-20 cursor-pointer shrink-0"
              aria-label="Previous image"
            >
              ‹
            </button>
            <div className="flex-1 h-full flex items-center justify-center min-w-0" onClick={e => e.stopPropagation()}>
              {isPdf(current) ? (
                pdfUrl && <iframe src={pdfUrl} title={current.name} className="w-full h-full bg-white rounded" />
              ) : (
                <img src={current.dataUrl} alt={current.name} className="max-w-full max-h-full object-contain" />
              )}
            </div>
            <button
              type="button"
              disabled={open === files.length - 1}
              onClick={e => {
                e.stopPropagation();
                setOpen(i => Math.min(files.length - 1, (i ?? 0) + 1));
              }}
              className="w-10 h-10 rounded-full bg-white/10 text-white text-lg disabled:opacity-20 cursor-pointer shrink-0"
              aria-label="Next image"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </>
  );
}
