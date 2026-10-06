import { DiagnosticResult } from "../types";
import { hospitalDb } from "./db";
import { esc, printDocument } from "./print";
import { dt } from "./time";

const flagText = (f: string | null) => (f === "HH" ? "CRITICAL HIGH" : f === "LL" ? "CRITICAL LOW" : f === "H" ? "HIGH" : f === "L" ? "LOW" : "");

/** Prints a released lab or imaging report (imaging includes the images). Resolves to false if pop-ups are blocked. */
export async function printDiagnosticReport(lab: DiagnosticResult, hospitalName?: string): Promise<boolean> {
  const imaging = lab.category === "Radiology" || !!lab.findings;
  let images = "";
  if (lab.images?.length) {
    const files = await hospitalDb.getImagingFiles(lab.images.map(i => i.id)).catch(() => []);
    images = files
      .filter(f => f.type.startsWith("image/"))
      .map(f => `<img src="${f.dataUrl}" alt="${esc(f.name)}">`)
      .join("");
    if (images) images = `<h2>Images</h2>${images}`;
  }
  const header = `<table style="margin-bottom:8px"><tr><td><b>Patient</b><br>${esc(lab.patientName)} (${esc(lab.patientId)})</td>
<td><b>${imaging ? "Study" : "Test"}</b><br>${esc(lab.test)}</td><td><b>Requested by</b><br>${esc(lab.orderingPhysician)}</td>
<td><b>Ordered</b><br>${esc(dt(lab.orderedAt || lab.date))}</td><td><b>Released</b><br>${esc(dt(lab.releasedAt || lab.date))}</td></tr></table>`;
  const body = imaging
    ? `${header}<h2>Findings</h2><div class="box">${esc(lab.findings || "—")}</div><h2>Impression</h2><div class="box"><b>${esc(lab.summary || "—")}</b></div>${images}`
    : `${header}<h2>Results</h2><table><tr><th>Parameter</th><th>Result</th><th>Unit</th><th>Reference Range</th><th>Flag</th></tr>${lab.items
        .map(
          i =>
            `<tr><td>${esc(i.name)}</td><td class="${i.flag ? "flag" : ""}">${esc(i.value)}</td><td>${esc(i.unit || "")}</td><td>${esc(i.ref)}</td><td class="flag">${esc(flagText(i.flag))}</td></tr>`
        )
        .join("")}</table><h2>Interpretation</h2><div class="box">${esc(lab.summary || "—")}</div>`;
  return printDocument(
    imaging ? "Imaging Report" : "Laboratory Report",
    `${body}<div class="sign"><div>${esc(lab.releasedBy || "")}<br><span class="muted">${imaging ? "Radiologist" : "Medical Technologist"}</span></div></div>`,
    hospitalName
  );
}
