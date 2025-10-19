import React, { useState, useEffect } from 'react';
import { AudioService, AudioState } from '../services/audioService';
import { createWavBlob } from '../utils/audioUtils';
import Button from './Button';
import PlayIcon from './icons/PlayIcon';
import StopIcon from './icons/StopIcon';
import DownloadIcon from './icons/DownloadIcon';


interface SinglePlayerProps {
    audioData: string;
    audioService: AudioService | null;
}

const SinglePlayer: React.FC<SinglePlayerProps> = ({ audioData, audioService }) => {
    const [playingState, setPlayingState] = useState<AudioState>({ status: 'idle' });

    useEffect(() => {
        if (!audioService) return;

        const subscription = (state: AudioState) => {
            // This component is for single audio, which has no ID.
            if (state.id === undefined) { 
                setPlayingState(state);
            } else {
                // If a sample or chunk is playing (which has an ID), reset single player state.
                setPlayingState({ status: 'idle' });
            }
        };
        const unsubscribe = audioService.subscribeToSingleState(subscription);

        return () => {
            unsubscribe();
        };
    }, [audioService]);
    
    const handlePlay = () => {
        if (playingState.status === 'playing') {
            audioService?.stopAndClear();
        } else {
            audioService?.play(audioData);
        }
    };

    const handleDownload = () => {
      const blob = createWavBlob(audioData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'speech_output.wav';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4 pt-6 mt-6 border-t border-slate-700">
            <div className="flex justify-between items-center bg-slate-800/70 p-3 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-slate-200">
                    آوای شما آماده است
                </h3>
                <div className="flex items-center gap-3">
                    <Button onClick={handleDownload} variant="secondary" aria-label="دانلود فایل صوتی">
                        <DownloadIcon />
                    </Button>
                    <Button onClick={handlePlay} variant="primary" className="w-32">
                        {playingState.status === 'playing' ? <StopIcon /> : <PlayIcon />}
                        <span>{playingState.status === 'playing' ? 'توقف' : 'پخش'}</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SinglePlayer;
