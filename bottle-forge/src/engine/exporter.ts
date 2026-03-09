/**
 * Downloads binary data as a file.
 */
export function downloadBlob(
  data: ArrayBuffer | Blob,
  filename: string,
  mimeType: string = 'application/octet-stream'
): void {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Downloads bottle STL data with a formatted filename.
 */
export function downloadBottleSTL(
  stlData: ArrayBuffer,
  diameter: number,
  height: number,
  profileName: string
): void {
  const d = Math.round(diameter);
  const h = Math.round(height);
  const profile = profileName.toLowerCase().replace(/\s+/g, '-');
  const filename = `bottle-${d}x${h}-${profile}.stl`;

  downloadBlob(stlData, filename, 'application/sla');
}

/**
 * Downloads bottle 3MF data with a formatted filename.
 */
export function downloadBottle3MF(
  threemfData: ArrayBuffer,
  diameter: number,
  height: number,
  profileName: string
): void {
  const d = Math.round(diameter);
  const h = Math.round(height);
  const profile = profileName.toLowerCase().replace(/\s+/g, '-');
  const filename = `bottle-${d}x${h}-${profile}.3mf`;

  downloadBlob(threemfData, filename, 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
}

/**
 * Downloads lid STL data with a formatted filename.
 */
export function downloadLidSTL(
  stlData: ArrayBuffer,
  diameter: number,
  height: number,
  profileName: string
): void {
  const d = Math.round(diameter);
  const h = Math.round(height);
  const profile = profileName.toLowerCase().replace(/\s+/g, '-');
  const filename = `lid-${d}x${h}-${profile}.stl`;

  downloadBlob(stlData, filename, 'application/sla');
}

/**
 * Downloads lid 3MF data with a formatted filename.
 */
export function downloadLid3MF(
  threemfData: ArrayBuffer,
  diameter: number,
  height: number,
  profileName: string
): void {
  const d = Math.round(diameter);
  const h = Math.round(height);
  const profile = profileName.toLowerCase().replace(/\s+/g, '-');
  const filename = `lid-${d}x${h}-${profile}.3mf`;

  downloadBlob(threemfData, filename, 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
}

/**
 * Downloads a ZIP bundle of both bottle and lid.
 */
export function downloadAllZip(
  zipData: ArrayBuffer,
  diameter: number,
  height: number,
  profileName: string
): void {
  const d = Math.round(diameter);
  const h = Math.round(height);
  const profile = profileName.toLowerCase().replace(/\s+/g, '-');
  const filename = `bottle-${d}x${h}-${profile}-all.zip`;

  downloadBlob(zipData, filename, 'application/zip');
}
