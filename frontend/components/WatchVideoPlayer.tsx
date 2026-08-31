"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Maximize, FileText, CheckCircle, Loader2, Award } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Card } from "@/components/ui";

interface WatchVideoPlayerProps {
  videoId: string;
  videoUrl: string;
  title: string;
  onCertificateClaimed?: () => void;
}

export function WatchVideoPlayer({ videoId, videoUrl, title, onCertificateClaimed }: WatchVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Watch-to-earn states
  const [maxWatched, setMaxWatched] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState<string | undefined>();
  const [isClaiming, setIsClaiming] = useState(false);
  const [message, setMessage] = useState("");

  const lastHeartbeatSent = useRef<number>(0);

  // Fetch initial progress
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const data = await apiClient.video.getProgress(videoId);
        setMaxWatched(data.maxWatchedTimestamp);
        setIsCompleted(data.status === 'COMPLETED');
        setHasCertificate(data.hasCertificate);
        setCertificateUrl(data.certificateUrl);
      } catch (err) {
        console.error("Failed to fetch progress", err);
      }
    };
    fetchProgress();
  }, [videoId]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = async () => {
    if (!videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    }

    // Send heartbeat every 5 seconds of playback
    if (currentTime - lastHeartbeatSent.current >= 5) {
      lastHeartbeatSent.current = currentTime;
      setMaxWatched(Math.max(maxWatched, currentTime));
      
      try {
        const response = await apiClient.video.heartbeat(videoId, currentTime);
        if (response.isCompleted && !isCompleted) {
          setIsCompleted(true);
          setMessage("Video completed! +100 Credits earned.");
        }
      } catch (err) {
        console.error("Heartbeat failed", err);
      }
    }
  };

  // Anti-cheat: prevent seeking past maxWatched + a small buffer
  const handleSeeked = () => {
    if (!videoRef.current) return;
    const buffer = 10; // allow seeking 10s ahead of what was already watched
    if (videoRef.current.currentTime > maxWatched + buffer) {
      videoRef.current.currentTime = maxWatched;
      setMessage("Please don't skip ahead! Watch the video to earn your certificate.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const claimCertificate = async () => {
    setIsClaiming(true);
    setMessage("");
    try {
      const response = await apiClient.video.claimCertificate(videoId);
      setHasCertificate(true);
      setCertificateUrl((response.certificate as any).certificateUrl);
      setMessage("Certificate claimed successfully!");
      if (onCertificateClaimed) onCertificateClaimed();
    } catch (err: any) {
      setMessage(err.message || "Failed to claim certificate. Make sure you have enough credits.");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Card className="overflow-hidden bg-slate-900 border-slate-800 text-white shadow-2xl">
      {/* Video Container */}
      <div className="relative aspect-video bg-black group">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onSeeked={handleSeeked}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          controls={false} // Custom controls below to enforce anti-cheat
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
        />
        
        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
            onClick={togglePlay}
          >
            <div className="w-16 h-16 rounded-full bg-blue-600/90 backdrop-blur flex items-center justify-center hover:bg-blue-500 hover:scale-110 transition-all shadow-xl">
              <Play size={32} className="text-white ml-2 fill-white" />
            </div>
          </div>
        )}

        {/* Custom Progress Bar (Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Control Bar & Watch-to-Earn Status */}
      <div className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={togglePlay} className="text-slate-300 hover:text-white transition-colors">
            {isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current" />}
          </button>
          
          <div>
            <h3 className="font-bold text-white leading-tight">{title}</h3>
            {isCompleted ? (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle size={12} /> Watched (100 pts earned)
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Watching... {Math.round(progress)}%
              </span>
            )}
          </div>
        </div>

        {/* Certificate Actions */}
        <div className="flex items-center gap-3">
          {message && (
            <span className="text-xs text-blue-300 mr-2 animate-pulse">
              {message}
            </span>
          )}

          {isCompleted && !hasCertificate && (
            <button 
              onClick={claimCertificate}
              disabled={isClaiming}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-bold rounded-lg shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isClaiming ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
              Claim Certificate (15 pts)
            </button>
          )}

          {hasCertificate && certificateUrl && (
            <a 
              href={certificateUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              <FileText size={16} />
              View Certificate
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
