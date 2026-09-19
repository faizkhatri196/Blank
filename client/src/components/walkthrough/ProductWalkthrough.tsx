import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Clock,
  CheckCircle2,
  Video,
  Sparkles,
  Layers,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { WALKTHROUGH_CONFIG, WalkthroughChapter } from '../../config/walkthroughConfig';

interface ProductWalkthroughProps {
  videoUrl?: string;
  posterUrl?: string;
  showChapters?: boolean;
  className?: string;
}

export const ProductWalkthrough: React.FC<ProductWalkthroughProps> = ({
  videoUrl = WALKTHROUGH_CONFIG.videoUrl,
  posterUrl = WALKTHROUGH_CONFIG.posterUrl,
  showChapters = true,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeChapterId, setActiveChapterId] = useState<string>(WALKTHROUGH_CONFIG.chapters[0].id);

  // Update active chapter as video time advances
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Find latest chapter whose timestamp is <= current time
    const chapters = WALKTHROUGH_CONFIG.chapters;
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (time >= chapters[i].seconds) {
        setActiveChapterId(chapters[i].id);
        break;
      }
    }
  };

  // Seek video to specific chapter
  const handleSeekChapter = (chapter: WalkthroughChapter) => {
    setActiveChapterId(chapter.id);
    if (videoRef.current) {
      videoRef.current.currentTime = chapter.seconds;
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback
      });
      setIsPlaying(true);
    }
  };

  const hasRealVideo = Boolean(videoUrl && videoUrl.trim().length > 0);

  return (
    <div className={`w-full flex flex-col gap-6 ${className}`}>
      {/* Video Container */}
      <div className="relative w-full aspect-video bg-slate-950 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center">
        {hasRealVideo ? (
          /* REAL NATIVE VIDEO PLAYER */
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl || undefined}
            controls
            playsInline
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full object-contain"
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          /* CONTROLLED CLEAN PLACEHOLDER (NOT FAKE FOOTAGE) */
          <div className="w-full h-full flex flex-col justify-between p-6 sm:p-10 text-center relative overflow-hidden bg-radial from-slate-900 to-slate-950">
            {/* Top Status Header */}
            <div className="flex items-center justify-between w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span>Production Screen Walkthrough</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline-block">
                Duration: ~4 mins
              </span>
            </div>

            {/* Center Content */}
            <div className="max-w-xl mx-auto space-y-3.5 my-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                <Video className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  SERVORA Product Walkthrough
                </h3>
                <p className="text-sm font-semibold text-indigo-400 mt-0.5">
                  Real application walkthrough coming soon.
                </p>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                This area will host the official screen-recorded walkthrough of the deployed SERVORA application, demonstrating the live workflow across customer, manager, and technician roles.
              </p>
            </div>

            {/* Bottom Status Footer */}
            <div className="w-full pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Recorded 100% from live deployed software (no mockups)
              </span>
              <span className="font-mono text-slate-400">
                Resolution: 1080p / 60 FPS
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Chapters Navigation */}
      {showChapters && (
        <div className="bg-slate-900/80 rounded-2xl sm:rounded-3xl border border-slate-800/80 p-5 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-white tracking-tight">
                Video Chapters
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">
              {hasRealVideo ? 'Click timestamp to jump' : 'Sequence in upcoming recording'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {WALKTHROUGH_CONFIG.chapters.map((chapter) => {
              const isActive = hasRealVideo && activeChapterId === chapter.id;
              return (
                <button
                  type="button"
                  key={chapter.id}
                  onClick={() => hasRealVideo && handleSeekChapter(chapter)}
                  disabled={!hasRealVideo}
                  className={`text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                    isActive
                      ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-sm'
                      : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                  } ${!hasRealVideo ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold shrink-0 mt-0.5 ${
                      isActive
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {chapter.timestamp}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white truncate">
                        {chapter.title}
                      </p>
                      {hasRealVideo && (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {chapter.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
