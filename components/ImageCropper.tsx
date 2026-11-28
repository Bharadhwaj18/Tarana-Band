'use client';

import { useEffect, useRef, useState } from 'react';
import FramedImage from '@/components/FramedImage';
import { MAX_ZOOM, frameOverPhoto, minZoom, positionFromView, viewFromPosition } from '@/lib/imageFrame';

interface ImageCropperProps {
  src: string;
  /** Where the photo sits and how zoomed it is, in the format described in lib/imageFrame.ts */
  position: string;
  onChange: (position: string) => void;
  alt?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Shows the whole photo with a bright box marking the part the shop will show; the rest is dimmed.
 * Drag the box (or tap/click anywhere on the photo) to choose what stays in view, and use the zoom to
 * fit the whole photo inside the frame (black bars) or to move in closer.
 * The small preview underneath is drawn exactly the way the shop draws it.
 */
export default function ImageCropper({ src, position, onChange, alt = '' }: ImageCropperProps) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  // Distance between the pointer and the box centre when the drag started, so the box doesn't jump under the finger
  const grabOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setNatural(null);
    const probe = new Image();
    probe.onload = () => setNatural({ w: probe.naturalWidth, h: probe.naturalHeight });
    probe.src = src;
  }, [src]);

  const photoAspect = natural ? natural.w / natural.h : 1;
  const view = viewFromPosition(position, photoAspect);
  const frame = frameOverPhoto(view, photoAspect);
  const lowest = minZoom(photoAspect);
  const canZoomOut = lowest < 1;

  // The stage is the photo plus any part of the frame that sticks out past it (the black bars)
  const minX = Math.min(0, frame.left);
  const maxX = Math.max(100, frame.left + frame.width);
  const minY = Math.min(0, frame.top);
  const maxY = Math.max(100, frame.top + frame.height);
  const stageW = maxX - minX;
  const stageH = maxY - minY;
  const toStageX = (photoX: number) => ((photoX - minX) / stageW) * 100;
  const toStageY = (photoY: number) => ((photoY - minY) / stageH) * 100;

  // Does the frame have anywhere to move? Zoomed out so far that it covers the whole photo, it doesn't.
  const canMove = frame.width < 99.5 || frame.height < 99.5;

  const update = (next: Partial<{ zoom: number; cx: number; cy: number }>) => {
    if (!natural) return;
    onChange(positionFromView({ ...view, ...next }, photoAspect));
  };

  /** Pointer position as % across/down the photo (can be outside 0-100 over the black bars) */
  const pointerOnPhoto = (e: React.PointerEvent) => {
    const rect = stageRef.current!.getBoundingClientRect();
    return {
      x: minX + ((e.clientX - rect.left) / rect.width) * stageW,
      y: minY + ((e.clientY - rect.top) / rect.height) * stageH,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!natural || !canMove) return;
    const p = pointerOnPhoto(e);
    const insideBox = p.x >= frame.left && p.x <= frame.left + frame.width && p.y >= frame.top && p.y <= frame.top + frame.height;
    // Grabbing the box keeps it where it is; clicking elsewhere centres it on that spot
    grabOffset.current = insideBox ? { x: p.x - frame.cx, y: p.y - frame.cy } : { x: 0, y: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    update({ cx: p.x - grabOffset.current.x, cy: p.y - grabOffset.current.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const p = pointerOnPhoto(e);
    update({ cx: p.x - grabOffset.current.x, cy: p.y - grabOffset.current.y });
  };

  const stopDragging = () => setDragging(false);

  // Arrow keys nudge the box, for keyboard use
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = delta[e.key];
    if (!move) return;
    e.preventDefault();
    update({ cx: frame.cx + move[0], cy: frame.cy + move[1] });
  };

  const zoomLabel =
    Math.abs(view.zoom - 1) < 0.015
      ? 'Fills the frame'
      : view.zoom < 1
        ? view.zoom < 0.015
          ? 'Whole photo, black bars'
          : 'Zoomed out'
        : `Zoomed in ${view.zoom.toFixed(1)}×`;

  return (
    <div className="space-y-2">
      <div
        ref={stageRef}
        className="relative w-full overflow-hidden rounded-lg bg-black select-none"
        style={{
          aspectRatio: natural ? `${natural.w * stageW} / ${natural.h * stageH}` : '1 / 1',
          cursor: canMove ? 'crosshair' : 'default',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="absolute pointer-events-none"
          style={{
            left: `${toStageX(0)}%`,
            top: `${toStageY(0)}%`,
            width: `${(100 / stageW) * 100}%`,
            height: `${(100 / stageH) * 100}%`,
          }}
        />
        {natural && (
          <div
            tabIndex={0}
            role="slider"
            aria-label="Part of the photo that will be shown. Use the arrow keys to move it."
            aria-valuetext={`${Math.round(frame.cx)}% across, ${Math.round(frame.cy)}% down`}
            onKeyDown={handleKeyDown}
            className="absolute border-2 border-white focus:outline-none focus:ring-2 focus:ring-gold"
            style={{
              left: `${toStageX(frame.left)}%`,
              top: `${toStageY(frame.top)}%`,
              width: `${(frame.width / stageW) * 100}%`,
              height: `${(frame.height / stageH) * 100}%`,
              // Everything outside the box is dimmed
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
              cursor: canMove ? (dragging ? 'grabbing' : 'grab') : 'default',
              touchAction: canMove ? 'none' : 'auto',
              backgroundImage:
                'linear-gradient(to right, transparent 33%, rgba(255,255,255,0.35) 33%, rgba(255,255,255,0.35) calc(33% + 1px), transparent calc(33% + 1px), transparent 66%, rgba(255,255,255,0.35) 66%, rgba(255,255,255,0.35) calc(66% + 1px), transparent calc(66% + 1px)),' +
                'linear-gradient(to bottom, transparent 33%, rgba(255,255,255,0.35) 33%, rgba(255,255,255,0.35) calc(33% + 1px), transparent calc(33% + 1px), transparent 66%, rgba(255,255,255,0.35) 66%, rgba(255,255,255,0.35) calc(66% + 1px), transparent calc(66% + 1px))',
            }}
          />
        )}
      </div>

      {natural ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="shrink-0 text-center">
              <FramedImage src={src} alt="" position={position} className="w-16 h-16 border border-gray-500 rounded-sm" />
              <p className="text-[10px] text-gray-400 mt-1">Shop</p>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={`zoom-${src}`} className="text-xs font-semibold text-gray-300">Zoom</label>
                <span className="text-[11px] text-gold truncate">{zoomLabel}</span>
              </div>
              <input
                id={`zoom-${src}`}
                type="range"
                min={lowest}
                max={MAX_ZOOM}
                step={0.01}
                value={clamp(view.zoom, lowest, MAX_ZOOM)}
                onChange={(e) => update({ zoom: parseFloat(e.target.value) })}
                className="w-full accent-yellow-500"
              />
              <div className="flex gap-1.5">
                {canZoomOut && (
                  <button
                    type="button"
                    onClick={() => update({ zoom: 0 })}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-[11px]"
                  >
                    Fit whole photo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => update({ zoom: 1 })}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-[11px]"
                >
                  Fill frame
                </button>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 leading-snug">
            {canMove ? 'Drag the box to choose what shows. The dark part is cropped out.' : 'The whole photo is showing, so there is nothing to move.'}
          </p>
        </div>
      ) : (
        <p className="text-[11px] text-gray-400">Loading photo…</p>
      )}
    </div>
  );
}
