'use client';

import { useEffect, useRef } from 'react';

interface VideoModalProps {
  video: {
    title: string;
    description: string;
    video_file_url: string;
    video_type: 'self_hosted' | 'youtube' | 'vimeo' | 'drive';
  } | null;
  isOpen: boolean;
  onClose: () => void;
  getVideoEmbedUrl: (video: any) => string;
}

export default function VideoModal({ video, isOpen, onClose, getVideoEmbedUrl }: VideoModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Close on Escape, lock page scroll and move focus into the player
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      closeRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !video) return null;

  const embedUrl = video.video_type === 'self_hosted' ? '' : getVideoEmbedUrl(video);

  return (
    <div
      className="fixed inset-0 bg-ink/90 z-50 flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
    >
      <div
        className="bg-paper border-[3px] border-ink shadow-hard-red w-full max-w-6xl max-h-[92vh] flex flex-col font-archivo text-ink"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3 border-b-[3px] border-ink">
          <h2 className="font-poster uppercase text-lg sm:text-2xl truncate">{video.title}</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            className="gp-btn gp-btn-ink min-h-[44px] px-4 gp-mono text-sm uppercase flex-shrink-0"
          >
            Close ✕
          </button>
        </div>

        <div className="bg-ink w-full aspect-video max-h-[70vh]">
          {video.video_type === 'self_hosted' ? (
            <video src={video.video_file_url} controls autoPlay className="w-full h-full object-contain" />
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              title={video.title}
              className="w-full h-full"
              frameBorder="0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            />
          ) : (
            <div className="flex items-center justify-center text-paper w-full h-full gp-mono">
              This video couldn&apos;t be loaded.
            </div>
          )}
        </div>

        {video.description && (
          <div className="px-4 sm:px-5 py-4 overflow-y-auto">
            <p className="text-[15px] leading-relaxed whitespace-pre-line">{video.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
