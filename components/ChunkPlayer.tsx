import React, { useState, useEffect } from 'react';
import { AudioService, AudioState } from '../services/audioService';
import { createWavBlob } from '../utils/audioUtils';
import Button from './Button';
import PlayIcon from './icons/PlayIcon';
import StopIcon from './icons/StopIcon';
import DownloadIcon from './icons/DownloadIcon';
import Loader from './Loader';
import ClockIcon from './icons/ClockIcon';


interface ChunkPlayerProps {
    chunks: string[];
    processedChunks: { index: number; audio: string }[];
    audioService: AudioService | null;
    currentProcessingChunk: number | null;
}

const ChunkPlayer: React.FC<ChunkPlayerProps> = ({ chunks, processedChunks, audioService, currentProcessingChunk }) => {
    const [playingState, setPlayingState] = useState<AudioState>({ status: 'idle' });

    useEffect(() => {
        if (!audioService) return;

        const subscription = (state: AudioState) => {
            setPlayingState(state);
        };
        audioService.subscribeToChunkState(subscription);

        return () => {
            audioService.unsubscribeFromChunkState(subscription);
        };
    }, [audioService]);

    const handlePlayAll = () => {
        if (playingState.status === 'playing') {
            audioService?.stopAndClear();
        } else {
            audioService?.playChunkQueue(processedChunks);
        }
    };

    const handlePlayChunk = (chunkIndex: number) => {
         if (playingState.status === 'playing' && playingState.id === chunkIndex) {
            audioService?.stopAndClear();
        } else {
           const chunkToPlay = processedChunks.find(p => p.index === chunkIndex);
           if (chunkToPlay) {
               audioService?.playChunkQueue([chunkToPlay]);
           }
        }
    };

    const handleDownload = (audioData: string, index: number) => {
      const blob = createWavBlob(audioData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speech_chunk_${index + 1}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    
    return (
        <div className="space-y-4 pt-6 mt-6 border-t border-slate-700">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-200">
                    بخش‌های صوتی آماده
                </h3>
                <Button onClick={handlePlayAll} disabled={processedChunks.length === 0} variant="secondary">
                    {playingState.status === 'playing' ? <StopIcon /> : <PlayIcon />}
                    {playingState.status === 'playing' ? 'توقف' : 'پخش همه'}
                </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-slate-900/50 rounded-lg shadow-inner">
                {chunks.map((chunkText, index) => {
                    const processed = processedChunks.find(p => p.index === index);
                    const isPlaying = playingState.status === 'playing' && playingState.id === index;
                    const isProcessing = currentProcessingChunk === index;

                    return (
                        <div key={index} className={`flex items-center gap-3 bg-slate-800/70 p-3 rounded-lg transition-all duration-300 ${isPlaying ? 'ring-2 ring-cyan-500' : ''} ${isProcessing ? 'bg-slate-700/90 ring-2 ring-sky-500/60' : ''}`}>
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                                {isProcessing ? (
                                    <Loader />
                                ) : processed ? (
                                    <button
                                        onClick={() => handlePlayChunk(index)}
                                        className="w-full h-full flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                                    >
                                        {isPlaying ? <StopIcon /> : <PlayIcon />}
                                    </button>
                                ) : (
                                    <ClockIcon />
                                )}
                            </div>
                            <p className="text-sm text-slate-400 truncate flex-grow text-right">
                                <span className="font-semibold text-slate-200">بخش {index + 1}: </span>
                                {chunkText}
                            </p>
                            <div className="w-8 h-8 flex-shrink-0">
                                {processed && (
                                    <button
                                        onClick={() => handleDownload(processed.audio, index)}
                                        className="w-full h-full flex items-center justify-center p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-cyan-400 transition-colors"
                                        aria-label={`دانلود بخش ${index + 1}`}
                                    >
                                        <DownloadIcon />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChunkPlayer;
