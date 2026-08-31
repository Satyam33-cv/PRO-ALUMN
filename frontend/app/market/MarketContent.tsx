"use client";

import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui";
import { Video, Plus, CheckCircle2, Lock, Play, Flame, User as UserIcon, Coins, X, ShieldCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { WatchVideoPlayer } from "@/components/WatchVideoPlayer";
import { submitVideoAction, unlockVideoAction } from "../actions/market";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export interface MarketVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  priceInCredits: number;
  duration?: string | null;
  thumbnailUrl?: string | null;
  uploader?: {
    name?: string | null;
    currentCompany?: string | null;
    batchYear?: number | null;
    avatarUrl?: string | null;
  } | null;
  createdAt?: string | Date;
}

export function MarketContent({ 
  initialVideos, 
  balance, 
  unlockedIds 
}: { 
  initialVideos: MarketVideo[]; 
  balance: number; 
  unlockedIds: string[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [playingVideo, setPlayingVideo] = useState<MarketVideo | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    const file = formData.get("videoFile") as File;
    
    if (!file || file.size === 0) {
      setErrorMsg("Please select a video file to upload.");
      return;
    }
    
    // Check 150MB limit (150 * 1024 * 1024 bytes)
    if (file.size > 150 * 1024 * 1024) {
      setErrorMsg("File size exceeds the 150MB limit. Please compress your video.");
      return;
    }

    startTransition(async () => {
      try {
        // 1. Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(filePath);

        // 3. Submit to our Backend Action
        formData.delete("videoFile"); // Remove file from formData to save payload size
        formData.append("videoUrl", publicUrl);

        await submitVideoAction(formData);
        
        setSuccessMsg("Video uploaded successfully and is pending admin approval!");
        setShowForm(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to submit video";
        setErrorMsg(message);
      }
    });
  };

  const handleUnlock = (videoId: string) => {
    setErrorMsg("");
    setSuccessMsg("");
    
    startTransition(async () => {
      try {
        await unlockVideoAction(videoId);
        setSuccessMsg("Premium video unlocked successfully! Let's start learning.");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to unlock video";
        setErrorMsg(message);
      }
    });
  };

  return (
    <RoleShell>
      <div className="max-w-7xl mx-auto space-y-8 font-sans pb-16">
        
        {/* HERO BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-12 text-white flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Flame size={14} className="text-orange-500" />
                Premium Library
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
              Master New Skills with Alumni Experts
            </h1>
            <p className="text-lg text-slate-300 max-w-xl leading-relaxed">
              Unlock exclusive tutorials, career insights, and deep-dive technical talks using your earned Gamification Points.
            </p>
            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
              >
                <Plus size={18} />
                Submit Video
              </button>
            </div>
          </div>

          <div className="relative z-10 hidden md:flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm min-w-[200px]">
            <Coins size={36} className="text-amber-400 mb-2" />
            <p className="text-xs text-slate-300 font-mono uppercase tracking-widest font-bold mb-1">Your Balance</p>
            <p className="text-4xl font-extrabold font-mono text-white flex items-baseline gap-1">
              {balance} <span className="text-base text-slate-400 font-semibold">pts</span>
            </p>
          </div>
        </div>

        {/* ALERTS */}
        {successMsg && (
          <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-3 font-semibold shadow-sm">
            <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
            {successMsg}
          </div>
        )}
        
        {errorMsg && (
          <div className="p-4 bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-3 font-semibold shadow-sm">
            <Lock size={20} className="text-rose-500 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* UPLOAD FORM */}
        {showForm && (
          <Card padding="lg" className="border border-blue-200 dark:border-blue-900 bg-white/50 dark:bg-slate-900/50 shadow-lg">
            <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Submit a Video</h3>
                <p className="text-sm text-slate-500 mt-1">Share your knowledge with the community.</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Video Title</label>
                <input required name="title" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Master React in 2026" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <textarea required name="description" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 h-28 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" placeholder="What will students learn from this video?" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Video File (.mp4)</label>
                <input required name="videoFile" type="file" accept="video/mp4,video/x-m4v,video/*" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                <p className="text-xs text-slate-500 mt-1.5">Max file size: 150MB.</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                <button disabled={isPending} type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50 transition-colors flex items-center gap-2">
                  {isPending ? "Submitting..." : "Submit for Moderation"}
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* CATEGORIZED DISPLAY */}
        {initialVideos.length === 0 ? (
          <Card padding="lg" className="text-center py-20 text-slate-500 border-dashed">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video size={40} className="text-slate-400" />
            </div>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-300">The library is currently empty</p>
            <p className="text-sm mt-2 max-w-sm mx-auto">Be the first alumni to submit a premium masterclass or technical talk.</p>
          </Card>
        ) : (
          <div className="space-y-12">
            
            {/* FREE VIDEOS */}
            {initialVideos.filter(v => v.priceInCredits === 0).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <Play size={24} className="text-blue-500" />
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Trending Free Skills</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {initialVideos.filter(v => v.priceInCredits === 0).map((video) => (
                    <VideoCard key={video.id} video={video} isUnlocked={true} isFree={true} handleUnlock={handleUnlock} isPending={isPending} setPlayingVideo={setPlayingVideo} />
                  ))}
                </div>
              </div>
            )}

            {/* PREMIUM VIDEOS */}
            {initialVideos.filter(v => v.priceInCredits > 0).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <Flame size={24} className="text-orange-500" />
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Premium Deep Dives</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {initialVideos.filter(v => v.priceInCredits > 0).map((video) => (
                    <VideoCard 
                      key={video.id} 
                      video={video} 
                      isUnlocked={unlockedIds.includes(video.id)} 
                      isFree={false} 
                      handleUnlock={handleUnlock} 
                      isPending={isPending} 
                      setPlayingVideo={setPlayingVideo}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {playingVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-xl">
          <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-500" /> Secure Watch-to-Earn Player
              </h2>
              <button 
                onClick={() => setPlayingVideo(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <WatchVideoPlayer 
                videoId={playingVideo.id} 
                videoUrl={playingVideo.videoUrl} 
                title={playingVideo.title} 
              />
              
              <div className="p-6 bg-slate-900">
                <h3 className="text-lg font-bold text-white mb-2">About this video</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{playingVideo.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </RoleShell>
  );
}

// Helper Component for Video Card
function VideoCard({ 
  video, 
  isUnlocked, 
  isFree, 
  handleUnlock, 
  isPending,
  setPlayingVideo
}: { 
  video: MarketVideo, 
  isUnlocked: boolean, 
  isFree: boolean, 
  handleUnlock: (id: string) => void, 
  isPending: boolean 
}) {
  const gradientIndex = video.title.charCodeAt(0) % 5;
  const gradients = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-purple-500 to-fuchsia-600"
  ];
  const gradient = gradients[gradientIndex];

  return (
    <div className="group flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-xl transition-all duration-300">
      
      {/* THUMBNAIL */}
      <div className={`aspect-video w-full relative bg-gradient-to-br ${gradient} p-6 flex flex-col justify-end overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
        
        <h3 className="relative z-10 font-display text-white text-lg font-bold leading-tight line-clamp-2 drop-shadow-md">
          {video.title}
        </h3>
        
        {/* OVERLAYS */}
        {isUnlocked ? (
          <button onClick={() => setPlayingVideo(video)} className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer border-none outline-none w-full h-full">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
              <Play size={32} className="text-white ml-1.5 fill-white" />
            </div>
          </button>
        ) : (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 text-center">
            <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mb-3 shadow-lg border border-slate-700">
              <Lock size={24} className="text-slate-400" />
            </div>
            <p className="text-sm font-bold text-white mb-3">Premium Content</p>
            <button
              onClick={() => handleUnlock(video.id)}
              disabled={isPending}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {video.priceInCredits === 0 ? "Free" : `Unlock for ${video.priceInCredits} pts`}
            </button>
          </div>
        )}

        {/* BADGES */}
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
          {!isFree && !isUnlocked && (
            <div className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-bold rounded-md flex items-center gap-1 border border-white/10 shadow-sm">
              <Coins size={12} className="text-amber-400" /> {video.priceInCredits} pts
            </div>
          )}
          {isFree && (
            <div className="px-2.5 py-1 bg-blue-500/80 backdrop-blur-md text-white text-xs font-bold rounded-md flex items-center gap-1 shadow-sm">
              Free Skill
            </div>
          )}
          {isUnlocked && !isFree && (
            <div className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-bold rounded-md flex items-center gap-1 shadow-sm">
              <CheckCircle2 size={12} /> Unlocked
            </div>
          )}
        </div>
      </div>

      {/* DETAILS */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
          {video.description}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
          <div className="flex items-center gap-2 min-w-0">
            {video.uploader?.avatarUrl ? (
              <Image src={video.uploader.avatarUrl} alt={video.uploader.name || "Expert"} width={28} height={28} className="w-7 h-7 rounded-full object-cover shrink-0 bg-slate-200" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 border border-slate-200 dark:border-slate-700">
                <UserIcon size={14} />
              </div>
            )}
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
              {video.uploader?.name || "Expert"}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {video.createdAt ? new Date(video.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : "Recently"}
          </span>
        </div>
      </div>
    </div>
  );
}
