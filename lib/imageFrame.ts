import type { CSSProperties } from 'react';

/**
 * How a merch photo sits inside its frame, saved as one text value per photo (merchandise.image_positions).
 *
 * Two formats, so photos positioned before zoom existed keep looking exactly the same:
 *  - "30% 60%"            the photo fills the frame and is cropped; this is where it sits (CSS object-position)
 *  - "z0.5 40 60 1.778"   zoomed: zoom, then the middle of the frame as % across/down the photo, then the photo's
 *                         width / height. Zoom 0 = the whole photo fits inside the frame (black bars where needed),
 *                         1 = the photo fills the frame, above 1 = zoomed in closer.
 *
 * Zoom and the middle point mean the same thing in every frame, whatever its shape: the shop card is a square,
 * the homepage tiles are 3:4 and the cart thumbnail is a small portrait. Each frame works out its own placement.
 */

export interface ZoomedFrame {
  /** 0 = whole photo fits, 1 = fills the frame, above 1 = closer */
  zoom: number;
  /** Middle of the frame, as % across and down the photo */
  cx: number;
  cy: number;
  /** Photo width / height */
  photoAspect: number;
}

const NUMBER = '(-?\\d+(?:\\.\\d+)?)';
const ZOOMED = new RegExp(`^z${NUMBER}\\s+${NUMBER}\\s+${NUMBER}\\s+${NUMBER}$`);

export const MAX_ZOOM = 3;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function parseZoomed(position?: string | null): ZoomedFrame | null {
  const match = ZOOMED.exec((position || '').trim());
  if (!match) return null;
  const [zoom, cx, cy, photoAspect] = match.slice(1).map(parseFloat);
  if (!(photoAspect > 0)) return null;
  return { zoom, cx, cy, photoAspect };
}

export function formatZoomed({ zoom, cx, cy, photoAspect }: ZoomedFrame): string {
  const r = (n: number, digits: number) => (Math.round(n * 10 ** digits) / 10 ** digits).toString();
  return `z${r(zoom, 3)} ${r(cx, 1)} ${r(cy, 1)} ${r(photoAspect, 4)}`;
}

/** How the photo sits in a frame of a given shape (frameAspect = width / height) */
function placement(zoomed: ZoomedFrame, frameAspect: number) {
  const { photoAspect: ra } = zoomed;
  const wide = ra > frameAspect;
  // "Whole photo fits" is the smallest size; "fills the frame" is this much bigger
  const fillOverFit = wide ? ra / frameAspect : frameAspect / ra;
  // Size of the photo when it just fits, as a fraction of the frame
  const fitW = wide ? 1 : ra / frameAspect;
  const fitH = wide ? frameAspect / ra : 1;

  const t = clamp(zoomed.zoom, 0, MAX_ZOOM);
  const scale = t <= 1 ? 1 + (fillOverFit - 1) * t : fillOverFit * t;

  // How much of the photo the frame covers, in % of the photo (more than 100 means black bars)
  const width = 100 / (scale * fitW);
  const height = 100 / (scale * fitH);
  // A frame bigger than the photo stays centred (equal bars); otherwise it stays inside the photo
  const cx = width >= 100 ? 50 : clamp(zoomed.cx, width / 2, 100 - width / 2);
  const cy = height >= 100 ? 50 : clamp(zoomed.cy, height / 2, 100 - height / 2);

  return { fillOverFit, fitW, fitH, scale, width, height, cx, cy };
}

/** Inline style for the <img> that sits in a frame (see FramedImage) */
export function frameImageStyle(position?: string | null, frameAspect = 1): CSSProperties {
  const zoomed = parseZoomed(position);
  if (!zoomed) return { objectFit: 'cover', objectPosition: position || 'center' };

  const p = placement(zoomed, frameAspect);
  const shiftX = -(p.cx - 50) * p.scale * p.fitW;
  const shiftY = -(p.cy - 50) * p.scale * p.fitH;
  return {
    objectFit: 'contain',
    transform: `translate(${shiftX.toFixed(2)}%, ${shiftY.toFixed(2)}%) scale(${p.scale.toFixed(4)})`,
  };
}

// ---------------------------------------------------------------- editor
// The editor frame is a square (the shop card), so it works with frameAspect = 1.

export interface EditorView {
  zoom: number;
  cx: number;
  cy: number;
}

/** Lowest zoom the editor allows: 0 (whole photo) when the photo isn't already square, otherwise 1 */
export function minZoom(photoAspect: number): number {
  return Math.abs(photoAspect - 1) < 0.02 ? 1 : 0;
}

/** Where the editor's square frame sits over the photo, in % of the photo (its edges can stick out past it) */
export function frameOverPhoto(view: EditorView, photoAspect: number) {
  const p = placement({ ...view, photoAspect }, 1);
  return { width: p.width, height: p.height, cx: p.cx, cy: p.cy, left: p.cx - p.width / 2, top: p.cy - p.height / 2 };
}

export function viewFromPosition(position: string | null | undefined, photoAspect: number): EditorView {
  const zoomed = parseZoomed(position);
  if (zoomed) return { zoom: zoomed.zoom, cx: zoomed.cx, cy: zoomed.cy };

  // Old format: the photo fills the frame and slides to "x% y%"
  const [rawX, rawY] = (position || '').split(' ');
  const x = Number.isFinite(parseFloat(rawX)) ? parseFloat(rawX) : 50;
  const y = Number.isFinite(parseFloat(rawY)) ? parseFloat(rawY) : 50;
  const frame = frameOverPhoto({ zoom: 1, cx: 50, cy: 50 }, photoAspect);
  return {
    zoom: 1,
    cx: (x / 100) * (100 - frame.width) + frame.width / 2,
    cy: (y / 100) * (100 - frame.height) + frame.height / 2,
  };
}

export function positionFromView(view: EditorView, photoAspect: number): string {
  const zoom = clamp(view.zoom, minZoom(photoAspect), MAX_ZOOM);

  // Filling the frame exactly is saved the old way, so nothing changes for photos that were never zoomed
  if (Math.abs(zoom - 1) < 0.015) {
    const full = frameOverPhoto({ zoom: 1, cx: view.cx, cy: view.cy }, photoAspect);
    const px = full.width >= 100 ? 50 : (full.left / (100 - full.width)) * 100;
    const py = full.height >= 100 ? 50 : (full.top / (100 - full.height)) * 100;
    return `${Math.round(px)}% ${Math.round(py)}%`;
  }

  const frame = frameOverPhoto({ ...view, zoom }, photoAspect);
  return formatZoomed({ zoom, cx: frame.cx, cy: frame.cy, photoAspect });
}
