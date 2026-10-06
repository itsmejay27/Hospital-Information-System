import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { DiagnosticResult, ImagingFile, ImagingFileMeta } from "../types";
import { timestamp, uid } from "../services/ids";
import { hospitalDb } from "../services/db";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ImagingGallery from "../components/ImagingGallery";
import { PrintReportButton } from "../components/LabResultsTable";
import * as ui from "../components/tableStyles";
import { Scan, Search, X } from "../components/Icons";
import { dt } from "../services/time";

type Tab = "todo" | "imaging" | "reading" | "released" | "all";
type Stage = Exclude<Tab, "all">;

/** Ordered → Imaging (technologist) → For Reading (radiologist) → Released. */
export function imagingStage(l: DiagnosticResult): Stage {
  if (l.status === "Ready") return "released";
  if (l.status === "Pending Analysis") return "todo";
  return l.acquiredAt ? "reading" : "imaging";
}

const stageLabel: Record<Stage, string> = {
  todo: "Ordered",
  imaging: "Imaging",
  reading: "For Reading",
  released: "Released",
};
const stageStyle: Record<Stage, string> = {
  todo: "bg-sky-50 text-sky-700 border-sky-200",
  imaging: "bg-amber-50 text-amber-700 border-amber-200",
  reading: "bg-violet-50 text-violet-700 border-violet-200",
  released: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
const priorityRank = { STAT: 0, Urgent: 1, Routine: 2 } as const;

const MAX_PDF_BYTES = 4 * 1024 * 1024;
const MAX_IMAGE_SIDE = 2000;

/** Reads an image or PDF; images are resized to at most 2000 px and saved as JPEG to keep the database small. */
async function readImagingFile(file: File): Promise<{ dataUrl: string; type: string; size: number }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  if (file.type === "application/pdf") {
    if (file.size > MAX_PDF_BYTES) throw new Error(`${file.name} is larger than 4 MB.`);
    return { dataUrl, type: file.type, size: file.size };
  }
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image or PDF.`);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`${file.name} could not be opened. Export DICOM images as JPEG or PNG first.`));
    el.src = dataUrl;
  });
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const out = canvas.toDataURL("image/jpeg", 0.88);
  return { dataUrl: out, type: "image/jpeg", size: Math.round((out.length * 3) / 4) };
}

/**
 * Imaging (radiology) worklist.
 * - Radiologic Technologist: performs the study, uploads the images, sends it for reading.
 * - Radiologist: reads the images, writes findings and impression, signs and releases the report.
 * - Doctor: follows progress and reads released reports.
 */
export default function ImagingWorklistView() {
  const { user } = useAuth();
  const { labResults, updateLabResult } = useOpdData();
  const isTech = user?.role === "radtech";
  const isRadiologist = user?.role === "radiologist";

  const [tab, setTab] = useState<Tab>(isTech ? "todo" : isRadiologist ? "reading" : "all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [viewing, setViewing] = useState<DiagnosticResult | null>(null);

  // Technologist: upload dialog
  const [uploading, setUploading] = useState<DiagnosticResult | null>(null);
  const [pending, setPending] = useState<{ key: string; name: string; dataUrl: string; type: string; size: number }[]>([]);
  const [techNotes, setTechNotes] = useState("");

  // Radiologist: report dialog
  const [reporting, setReporting] = useState<DiagnosticResult | null>(null);
  const [findings, setFindings] = useState("");
  const [impression, setImpression] = useState("");

  const [modalError, setModalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const studies = useMemo(() => labResults.filter(l => l.category === "Radiology"), [labResults]);
  const counts: Record<Tab, number> = {
    todo: studies.filter(l => imagingStage(l) === "todo").length,
    imaging: studies.filter(l => imagingStage(l) === "imaging").length,
    reading: studies.filter(l => imagingStage(l) === "reading").length,
    released: studies.filter(l => imagingStage(l) === "released").length,
    all: studies.length,
  };

  const rows = studies
    .filter(l => {
      if (tab !== "all" && imagingStage(l) !== tab) return false;
      const q = search.toLowerCase();
      return !q || [l.patientName, l.patientId, l.test, l.orderingPhysician].some(v => v.toLowerCase().includes(q));
    })
    .sort((a, b) =>
      tab === "released" || tab === "all"
        ? (b.releasedAt || b.acquiredAt || b.orderedAt || b.date).localeCompare(a.releasedAt || a.acquiredAt || a.orderedAt || a.date)
        : priorityRank[a.priority || "Routine"] - priorityRank[b.priority || "Routine"] ||
          (a.acquiredAt || a.orderedAt || a.date).localeCompare(b.acquiredAt || b.orderedAt || b.date)
    );

  if (!user) return null;
  const signature = user.licenseNumber ? `${user.name} (${user.licenseNumber})` : user.name;

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(n => (n === msg ? null : n)), 4000);
  };

  const startStudy = async (l: DiagnosticResult) => {
    setError(null);
    try {
      await updateLabResult({ ...l, status: "In-Progress", performedBy: signature }, `Started imaging study: ${l.test}`);
    } catch {
      setError("Could not update the request. Please try again.");
    }
  };

  // ---- Technologist: upload images ----
  const openUpload = (l: DiagnosticResult) => {
    setModalError(null);
    setPending([]);
    setTechNotes(l.techNotes || "");
    setUploading(l);
  };

  const addFiles = async (list: FileList | null) => {
    if (!list) return;
    setModalError(null);
    for (const file of Array.from(list)) {
      try {
        const read = await readImagingFile(file);
        setPending(p => [...p, { key: uid(), name: file.name, ...read }]);
      } catch (err) {
        setModalError((err as Error).message);
      }
    }
  };

  const saveUpload = async (send: boolean) => {
    if (!uploading) return;
    const existing = uploading.images || [];
    if (send && existing.length + pending.length === 0) return setModalError("Upload at least one image before sending for reading.");
    setBusy(true);
    setModalError(null);
    try {
      const added: ImagingFileMeta[] = [];
      for (const p of pending) {
        const file: ImagingFile = {
          id: `IMG-${uid()}`,
          resultId: uploading.id,
          patientId: uploading.patientId,
          name: p.name,
          type: p.type,
          size: p.size,
          dataUrl: p.dataUrl,
          uploadedBy: signature,
          uploadedAt: timestamp().slice(0, 16),
        };
        await hospitalDb.addImagingFile(file);
        added.push({ id: file.id, name: file.name, type: file.type, size: file.size });
      }
      const updated: DiagnosticResult = {
        ...uploading,
        images: [...existing, ...added],
        techNotes: techNotes.trim() || undefined,
        performedBy: uploading.performedBy || signature,
        ...(send ? { acquiredBy: signature, acquiredAt: timestamp().slice(0, 16) } : {}),
      };
      await updateLabResult(
        updated,
        send
          ? `Sent ${uploading.test} for radiologist reading (${updated.images!.length} image${updated.images!.length === 1 ? "" : "s"})`
          : `Uploaded ${added.length} image${added.length === 1 ? "" : "s"}: ${uploading.test}`
      );
      setUploading(null);
      flash(send ? `${uploading.test} sent to the radiologist.` : "Images saved.");
    } catch (err) {
      const msg = (err as { message?: string })?.message || "";
      setModalError(msg.includes("row-level security") ? "Your account is not allowed to upload images." : `Could not upload: ${msg || "please try again."}`);
    } finally {
      setBusy(false);
    }
  };

  // ---- Radiologist: read and report ----
  const openReport = (l: DiagnosticResult) => {
    setModalError(null);
    setFindings(l.findings || "");
    setImpression(l.summary || "");
    setReporting(l);
  };

  const saveReport = async (release: boolean) => {
    if (!reporting) return;
    if (release && !findings.trim()) return setModalError("Enter the findings before releasing.");
    if (release && !impression.trim()) return setModalError("Enter the impression before releasing.");
    setBusy(true);
    setModalError(null);
    try {
      await updateLabResult(
        {
          ...reporting,
          findings: findings.trim(),
          summary: impression.trim(),
          ...(release ? { status: "Ready" as const, releasedBy: signature, releasedAt: timestamp().slice(0, 16) } : {}),
        },
        `${release ? "Signed and released" : "Saved draft of"} imaging report: ${reporting.test}`
      );
      setReporting(null);
      flash(release ? `Report for ${reporting.patientName} released to ${reporting.orderingPhysician}.` : "Draft saved.");
    } catch {
      setModalError("Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const tabs: [Tab, string][] = [
    ["todo", "Ordered"],
    ["imaging", "Imaging"],
    ["reading", "For Reading"],
    ["released", "Released"],
    ["all", "All"],
  ];

  const studyHeader = (l: DiagnosticResult) =>
    `${l.patientName} (${l.patientId}) • ordered ${dt(l.orderedAt || l.date)} by ${l.orderingPhysician}${l.indication ? ` • for ${l.indication}` : ""}`;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <PageHeader
        icon={<Scan size={20} />}
        title={isRadiologist ? "Imaging Reading List" : "Imaging Worklist"}
        description={
          isRadiologist
            ? "Studies the technologists have imaged. Open the images, write the findings and impression, then sign and release the report."
            : "X-ray, ultrasound and CT requests from doctors. The technologist performs the study and uploads the images; the radiologist reads them and releases the report."
        }
      />

      {error && <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{error}</div>}
      {notice && <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">{notice}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex flex-wrap gap-1 shadow-2xs">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
              tab === id ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === id ? "bg-white/25" : "bg-slate-100 text-slate-600"}`}>{counts[id]}</span>
          </button>
        ))}
      </div>

      <div className={ui.tableWrap}>
        <div className={ui.toolbar}>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient, study, doctor..." className={`${ui.input} pl-8`} />
          </div>
          {!isTech && !isRadiologist && <span className="text-[11px] text-slate-500">View only</span>}
        </div>
        <div className={ui.tableScroll}>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>Ordered</th>
                <th className={ui.th}>Priority</th>
                <th className={ui.th}>Patient</th>
                <th className={ui.th}>Study</th>
                <th className={ui.th}>Ordering Doctor</th>
                <th className={ui.th}>Images</th>
                <th className={ui.th}>Status</th>
                <th className={`${ui.th} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className={ui.emptyCell}>
                    {tab === "reading" ? "No studies waiting to be read." : tab === "todo" ? "No new imaging requests." : "Nothing here."}
                  </td>
                </tr>
              )}
              {rows.map(l => {
                const stage = imagingStage(l);
                return (
                  <tr key={l.id} className={ui.tr}>
                    <td className={`${ui.td} font-mono whitespace-nowrap`}>{dt(l.orderedAt || l.date)}</td>
                    <td className={ui.td}>
                      <span
                        className={`${ui.badge} ${
                          l.priority === "STAT"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : l.priority === "Urgent"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {l.priority || "Routine"}
                      </span>
                    </td>
                    <td className={ui.td}>
                      <div className="font-bold text-slate-900 whitespace-nowrap">{l.patientName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{l.patientId}</div>
                    </td>
                    <td className={ui.td}>
                      <div className="font-semibold text-slate-900">{l.test}</div>
                      {l.indication && <div className="text-[10px] text-slate-500">For: {l.indication}</div>}
                    </td>
                    <td className={`${ui.td} whitespace-nowrap`}>{l.orderingPhysician}</td>
                    <td className={ui.td}>{l.images?.length ? `${l.images.length}` : <span className="text-slate-300">—</span>}</td>
                    <td className={ui.td}>
                      <span className={`${ui.badge} ${stageStyle[stage]}`}>{stageLabel[stage]}</span>
                      <div className="text-[10px] text-slate-400 mt-1 whitespace-nowrap">
                        {stage === "released" ? l.releasedBy : stage === "reading" ? `Imaged by ${l.acquiredBy}` : l.performedBy}
                      </div>
                    </td>
                    <td className={`${ui.td} text-right whitespace-nowrap`}>
                      {isTech && stage === "todo" ? (
                        <button onClick={() => startStudy(l)} className={ui.primaryBtn}>
                          Start Study
                        </button>
                      ) : isTech && stage === "imaging" ? (
                        <button onClick={() => openUpload(l)} className={ui.primaryBtn}>
                          Upload Images
                        </button>
                      ) : isRadiologist && stage === "reading" ? (
                        <button onClick={() => openReport(l)} className={ui.primaryBtn}>
                          Read &amp; Report
                        </button>
                      ) : (
                        <button onClick={() => setViewing(l)} className="text-emerald-700 font-bold hover:underline cursor-pointer">
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technologist: upload images and send for reading */}
      {uploading && (
        <Modal
          wide
          title={`Upload Images — ${uploading.test}`}
          subtitle={studyHeader(uploading)}
          onClose={() => !busy && setUploading(null)}
          footer={
            <>
              <button type="button" onClick={() => setUploading(null)} disabled={busy} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="button" onClick={() => saveUpload(false)} disabled={busy || pending.length === 0} className={ui.secondaryBtn}>
                Save Images
              </button>
              <button type="button" onClick={() => saveUpload(true)} disabled={busy} className={ui.primaryBtn}>
                {busy ? "Uploading..." : "Send to Radiologist"}
              </button>
            </>
          }
        >
          {modalError && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{modalError}</div>}
          <p className="text-slate-600">
            Export the images from the X-ray / CT / ultrasound machine (or the PACS) as <b>JPEG or PNG</b>, or a <b>PDF</b> of the films, and add them
            here. Images are resized to 2000 px.
          </p>
          {(uploading.images?.length ?? 0) > 0 && (
            <div>
              <div className={ui.label}>Already uploaded</div>
              <ImagingGallery images={uploading.images!} />
            </div>
          )}
          <div>
            <label className={ui.label}>Add images</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={e => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
              className="block w-full text-xs file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-bold file:cursor-pointer"
            />
          </div>
          {pending.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {pending.map(p => (
                <div key={p.key} className="relative aspect-square rounded-lg border border-slate-200 bg-slate-900 overflow-hidden flex items-center justify-center">
                  {p.type === "application/pdf" ? (
                    <span className="text-[11px] font-bold text-white px-2 text-center break-all">PDF<br />{p.name}</span>
                  ) : (
                    <img src={p.dataUrl} alt={p.name} className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => setPending(list => list.filter(x => x.key !== p.key))}
                    aria-label={`Remove ${p.name}`}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div>
            <label className={ui.label}>Technologist notes (optional)</label>
            <textarea
              value={techNotes}
              onChange={e => setTechNotes(e.target.value)}
              rows={2}
              placeholder="e.g. PA and lateral views; patient could not hold breath fully"
              className={ui.input}
            />
          </div>
          <p className="text-slate-500">
            Recorded as <span className="font-bold text-slate-700">{signature}</span>
          </p>
        </Modal>
      )}

      {/* Radiologist: read images and write the report */}
      {reporting && (
        <Modal
          wide
          title={`Imaging Report — ${reporting.test}`}
          subtitle={studyHeader(reporting)}
          onClose={() => !busy && setReporting(null)}
          footer={
            <>
              <button type="button" onClick={() => setReporting(null)} disabled={busy} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="button" onClick={() => saveReport(false)} disabled={busy} className={ui.secondaryBtn}>
                Save Draft
              </button>
              <button type="button" onClick={() => saveReport(true)} disabled={busy} className={ui.primaryBtn}>
                {busy ? "Saving..." : "Sign & Release"}
              </button>
            </>
          }
        >
          {modalError && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{modalError}</div>}
          <div>
            <div className={ui.label}>Images ({reporting.images?.length ?? 0}) — click to enlarge</div>
            <ImagingGallery images={reporting.images || []} />
          </div>
          <PriorStudies current={reporting} studies={studies} />
          {reporting.techNotes && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold">Technologist notes ({reporting.acquiredBy}):</span> {reporting.techNotes}
            </div>
          )}
          <div>
            <label className={ui.label}>Findings *</label>
            <textarea
              value={findings}
              onChange={e => setFindings(e.target.value)}
              rows={5}
              placeholder="Describe what the study shows, region by region."
              className={ui.input}
            />
          </div>
          <div>
            <label className={ui.label}>Impression *</label>
            <textarea value={impression} onChange={e => setImpression(e.target.value)} rows={2} placeholder="e.g. No acute cardiopulmonary findings." className={ui.input} />
          </div>
          <p className="text-slate-500">
            Signed as <span className="font-bold text-slate-700">{signature}</span>
          </p>
        </Modal>
      )}

      {viewing && (
        <Modal
          wide
          title={`${viewing.test} — ${viewing.patientName}`}
          subtitle={`${stageLabel[imagingStage(viewing)]} • ordered ${dt(viewing.orderedAt || viewing.date)} by ${viewing.orderingPhysician}`}
          onClose={() => setViewing(null)}
        >
          <div>
            <div className={ui.label}>Images ({viewing.images?.length ?? 0})</div>
            <ImagingGallery images={viewing.images || []} />
          </div>
          {viewing.techNotes && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold">Technologist notes:</span> {viewing.techNotes}
            </div>
          )}
          {viewing.status === "Ready" ? (
            <>
              <div>
                <div className={ui.label}>Findings</div>
                <p className="whitespace-pre-line text-slate-800">{viewing.findings || "—"}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-700">Impression: </span>
                {viewing.summary || "—"}
              </div>
              <p className="text-slate-500 flex justify-between gap-2">
                <span>
                  Reported by {viewing.releasedBy} • {dt(viewing.releasedAt)}
                </span>
                <PrintReportButton lab={viewing} />
              </p>
            </>
          ) : (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
              The radiologist's report is not released yet.
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

/** Earlier released imaging of the same patient, so the radiologist can compare. */
function PriorStudies({ current, studies }: { current: DiagnosticResult; studies: DiagnosticResult[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const prior = studies
    .filter(s => s.patientId === current.patientId && s.id !== current.id && s.status === "Ready")
    .sort((a, b) => (b.releasedAt || b.date).localeCompare(a.releasedAt || a.date));
  if (prior.length === 0) return <p className="text-slate-400 italic">No prior imaging for this patient.</p>;
  return (
    <div>
      <div className={ui.label}>Prior studies ({prior.length}) — compare</div>
      <div className="space-y-1.5">
        {prior.map(p => (
          <div key={p.id} className="rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setOpen(o => (o === p.id ? null : p.id))}
              className="w-full text-left px-3 py-2 flex justify-between gap-2 cursor-pointer hover:bg-slate-50"
            >
              <span>
                <span className="font-mono">{dt(p.releasedAt || p.date)}</span> • <b>{p.test}</b> — {p.summary || "no impression"}
              </span>
              <span className="text-emerald-700 font-bold shrink-0">{open === p.id ? "Hide" : "Show"}</span>
            </button>
            {open === p.id && (
              <div className="px-3 pb-3 space-y-2">
                <ImagingGallery images={p.images || []} />
                {p.findings && <p className="whitespace-pre-line text-slate-700">{p.findings}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
