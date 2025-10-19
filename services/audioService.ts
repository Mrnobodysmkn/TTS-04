import { generateSpeech } from './geminiService';
import { VOICE_SAMPLE_TEXT } from '../constants';

type AudioStatus = 'idle' | 'loading' | 'playing' | 'finished';
export interface AudioState {
  status: AudioStatus;
  id?: string | number; // voiceId for samples, chunkIndex for chunks
}
type StateSubscriber = (state: AudioState) => void;

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const numChannels = 1;
  const sampleRate = 24000;
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class AudioService {
  private audioContext: AudioContext;
  private currentSource: AudioBufferSourceNode | null = null;
  private sampleStateSubscribers: Set<StateSubscriber> = new Set();
  private chunkStateSubscribers: Set<StateSubscriber> = new Set();
  private singleStateSubscribers: Set<StateSubscriber> = new Set();
  private audioQueue: { index: number; audio: string }[] = [];
  private currentPlayingIndex: number | null = null;
  private isQueuePaused = false;


  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  private notify(subscribers: Set<StateSubscriber>, state: AudioState) {
    subscribers.forEach(cb => cb(state));
  }

  subscribeToSampleState(callback: StateSubscriber) {
    this.sampleStateSubscribers.add(callback);
    return () => this.unsubscribeFromSampleState(callback);
  }

  unsubscribeFromSampleState(callback: StateSubscriber) {
    this.sampleStateSubscribers.delete(callback);
  }
  
  subscribeToChunkState(callback: StateSubscriber) {
    this.chunkStateSubscribers.add(callback);
    return () => this.unsubscribeFromChunkState(callback);
  }

  unsubscribeFromChunkState(callback: StateSubscriber) {
    this.chunkStateSubscribers.delete(callback);
  }

  subscribeToSingleState(callback: StateSubscriber) {
    this.singleStateSubscribers.add(callback);
    return () => this.unsubscribeFromSingleState(callback);
  }

  unsubscribeFromSingleState(callback: StateSubscriber) {
    this.singleStateSubscribers.delete(callback);
  }
  
  private async playAudio(base64: string, onEnded: () => void = () => {}): Promise<AudioBufferSourceNode> {
    if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
    }
    this.stopCurrent();

    const decoded = decode(base64);
    const buffer = await decodeAudioData(decoded, this.audioContext);
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.onended = onEnded;
    source.start();
    
    this.currentSource = source;
    return source;
  }
  
  stopCurrent() {
     if (this.currentSource) {
      try {
        this.currentSource.onended = null; // Prevent onended from firing on manual stop
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {
        // May fail if already stopped
      }
      this.currentSource = null;
    }
  }

  stopAndClear() {
    this.stopCurrent();
    this.audioQueue = [];
    this.currentPlayingIndex = null;
    this.notify(this.sampleStateSubscribers, { status: 'idle' });
    this.notify(this.chunkStateSubscribers, { status: 'idle' });
    this.notify(this.singleStateSubscribers, { status: 'idle' });
  }

  // For single audio playback
  async play(base64: string) {
    this.stopAndClear();
    this.notify(this.singleStateSubscribers, { status: 'loading' });
    try {
        await this.playAudio(base64, () => {
            this.notify(this.singleStateSubscribers, { status: 'finished' });
        });
        this.notify(this.singleStateSubscribers, { status: 'playing' });
    } catch (e) {
        console.error("Failed to play audio", e);
        this.notify(this.singleStateSubscribers, { status: 'idle' });
    }
  }

  // Specifically for voice samples
  async playSample(voiceId: string) {
    this.stopAndClear();
    this.notify(this.sampleStateSubscribers, { status: 'loading', id: voiceId });

    try {
      const base64 = await generateSpeech(VOICE_SAMPLE_TEXT, voiceId);
      await this.playAudio(base64, () => {
        this.notify(this.sampleStateSubscribers, { status: 'finished', id: voiceId });
      });
      this.notify(this.sampleStateSubscribers, { status: 'playing', id: voiceId });
    } catch (e) {
      console.error("Failed to play sample", e);
      this.notify(this.sampleStateSubscribers, { status: 'idle', id: voiceId });
      // Re-throw the error for the UI to catch and display
      if (e instanceof Error) {
        throw new Error(`خطا در پخش نمونه صدا: ${e.message}`);
      }
      throw new Error("یک خطای ناشناخته در پخش نمونه صدا رخ داد.");
    }
  }
  
  playChunkQueue(chunks: { index: number; audio: string }[], startIndex = 0) {
    this.stopCurrent();
    this.audioQueue = chunks;
    this.currentPlayingIndex = startIndex;
    this.isQueuePaused = false;
    this.playNextInQueue();
  }

  private playNextInQueue() {
    if (this.currentPlayingIndex === null || this.isQueuePaused || this.currentPlayingIndex >= this.audioQueue.length) {
      if (this.currentPlayingIndex !== null) {
         this.notify(this.chunkStateSubscribers, { status: 'finished', id: this.audioQueue[this.audioQueue.length-1].index });
      }
      this.currentPlayingIndex = null;
      return;
    }

    const chunk = this.audioQueue[this.currentPlayingIndex];
    this.notify(this.chunkStateSubscribers, { status: 'playing', id: chunk.index });

    this.playAudio(chunk.audio, () => {
        this.notify(this.chunkStateSubscribers, { status: 'finished', id: chunk.index });
        if (this.currentPlayingIndex !== null) {
            this.currentPlayingIndex++;
            this.playNextInQueue();
        }
    });
  }


  closeContext() {
    this.audioContext.close();
  }
}
