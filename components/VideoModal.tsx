'use client';

import { useEffect } from 'react';

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
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-black rounded-lg overflow-hidden w-full max-w-6xl flex flex-col"
        style={{ maxHeight: '90vh', height: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white truncate">{video.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors ml-4 flex-shrink-0"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video Player */}
        <div className="flex-1 min-h-0 bg-gray-900 overflow-hidden flex items-center justify-center">
          <div className="w-full h-full" style={{ aspectRatio: '16/9' }}>
            {video.video_type === 'self_hosted' ? (
              <video
                src={video.video_file_url}
                controls
                autoPlay
                className="w-full h-full object-contain"
                onError={(e) => console.error('Video playback error:', e)}
              />
            ) : (
              (() => {
                const embedUrl = getVideoEmbedUrl(video);
                if (!embedUrl) {
                  return (
                    <div className="flex items-center justify-center text-red-400 w-full h-full">
                      <p>Error loading video. Invalid URL.</p>
                    </div>
                  );
                }
                return (
                  <iframe
                    src={embedUrl}
                    title={video.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  />
                );
              })()
            )}
          </div>
        </div>

        {/* Description */}
        <div className="p-4 border-t border-gray-700 bg-gray-900 flex-shrink-0">
          <p className="text-gray-300 text-sm">{video.description}</p>
        </div>
      </div>
    </div>
  );
}
