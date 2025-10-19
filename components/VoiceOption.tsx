import React, { useState, useEffect } from 'react';
import { VoiceOption as VoiceOptionType } from '../types';
import { AudioService, AudioState } from '../services/audioService';
import Loader from './Loader';
import PlayIcon from './icons/PlayIcon';
import StopIcon from './icons/StopIcon';


interface VoiceOptionProps {
  voice: VoiceOptionType;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onPlaySample: (id: string) => Promise<void>;
  disabled: boolean;
  audioService: AudioService | null;
}

const VoiceOption: React.FC<VoiceOptionProps> = ({ voice, isSelected, onSelect, onPlaySample, disabled, audioService }) => {
  const [audioState, setAudioState] = useState<AudioState>({ status: 'idle' });

  useEffect(() => {
    if (!audioService) return;

    const subscription = (state: AudioState) => {
      if (state.id === voice.id) {
        setAudioState(state);
      } else {
        // If the global state is for another sample OR is idle, and this component's state is not already idle, reset it.
        if (audioState.status !== 'idle') {
          setAudioState({ status: 'idle' });
        }
      }
    };

    audioService.subscribeToSampleState(subscription);
    
    return () => {
      audioService.unsubscribeFromSampleState(subscription);
    };
  }, [audioService, voice.id, audioState.status]);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (audioState.status === 'playing' || audioState.status === 'loading') {
      audioService?.stopAndClear();
    } else {
      onPlaySample(voice.id);
    }
  };
  
  const isPlaying = audioState.status === 'playing';
  const isLoading = audioState.status === 'loading';

  const containerClasses = [
    'relative', 'flex', 'flex-col', 'p-4', 'rounded-xl', 'cursor-pointer', 'transition-all', 'duration-300',
    'bg-slate-800/60', 'border',
    disabled ? 'opacity-60 cursor-not-allowed' : '',
    isSelected && !isPlaying && !isLoading ? 'border-cyan-500/80 ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/20' : 'border-slate-700 hover:border-slate-600',
    isPlaying ? 'voice-card-playing' : '',
    isLoading ? 'voice-card-loading' : '',
  ].filter(Boolean).join(' ');

  const renderButtonIcon = () => {
    switch (audioState.status) {
      case 'loading':
        return <Loader />;
      case 'playing':
        return <StopIcon />;
      case 'idle':
      case 'finished':
      default:
        return <PlayIcon />;
    }
  };


  return (
    <div
      onClick={() => !disabled && onSelect(voice.id)}
      className={containerClasses}
    >
       <input
          type="radio"
          id={`voice-${voice.id}`}
          name="voice"
          value={voice.id}
          checked={isSelected}
          onChange={() => onSelect(voice.id)}
          disabled={disabled}
          className="sr-only"
        />
      <div className="flex items-center justify-between w-full">
         <div className={`flex-1 min-w-0 pr-3 transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
            <span className={`font-semibold transition-colors ${isPlaying ? 'text-cyan-300' : 'text-slate-200'}`}>{voice.name}</span>
             {voice.description && (
              <p className="text-xs text-slate-400 mt-1 truncate">{voice.description}</p>
            )}
         </div>
        <button
          type="button"
          onClick={handlePlayClick}
          disabled={disabled}
          className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 disabled:bg-slate-700/50 disabled:text-slate-500 transition-colors"
          aria-label={`Play sample for ${voice.name}`}
        >
          {renderButtonIcon()}
        </button>
      </div>
    </div>
  );
};

export default VoiceOption;
