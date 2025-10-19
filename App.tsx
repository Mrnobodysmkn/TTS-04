import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateSpeech, enhanceTextForTTS, setApiKey } from './services/geminiService';
import { AudioService } from './services/audioService';
import { chunkText } from './utils/textUtils';
import { AVAILABLE_VOICES, CHUNK_SIZE } from './constants';
import Button from './components/Button';
import Loader from './components/Loader';
import ErrorMessage from './components/ErrorMessage';
import SpeakerIcon from './components/icons/SpeakerIcon';
import GithubIcon from './components/icons/GithubIcon';
import UploadIcon from './components/icons/UploadIcon';
import VoiceOption from './components/VoiceOption';
import ChunkPlayer from './components/ChunkPlayer';
import SinglePlayer from './components/SinglePlayer';
import ApiKeyModal from './components/ApiKeyModal';

const INITIAL_TEXT = 'متن خود را در این بخش قرار دهید.';

const App: React.FC = () => {
  const [text, setText] = useState<string>(INITIAL_TEXT);
  const [isPristine, setIsPristine] = useState<boolean>(true);
  const [selectedVoice, setSelectedVoice] = useState<string>(AVAILABLE_VOICES[0].id);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [enhanceWithPro, setEnhanceWithPro] = useState<boolean>(true);
  const [generationComplete, setGenerationComplete] = useState<boolean>(false);
  
  const [chunks, setChunks] = useState<string[]>([]);
  const [processedChunks, setProcessedChunks] = useState<{ index: number; audio: string }[]>([]);
  const [currentProcessingChunk, setCurrentProcessingChunk] = useState<number | null>(null);
  const [singleAudioResult, setSingleAudioResult] = useState<string | null>(null);

  const [isKeySet, setIsKeySet] = useState<boolean>(false);

  const audioServiceRef = useRef<AudioService | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = sessionStorage.getItem('gemini-api-key');
    if (key) {
      setApiKey(key);
      setIsKeySet(true);
    }
    audioServiceRef.current = new AudioService();
    return () => {
      audioServiceRef.current?.stopAndClear();
      audioServiceRef.current?.closeContext();
    };
  }, []);
  
  useEffect(() => {
    if (generationComplete) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [generationComplete]);

  const handleKeySubmit = (key: string) => {
    setApiKey(key);
    sessionStorage.setItem('gemini-api-key', key);
    setIsKeySet(true);
  };

  const stopAllAudio = useCallback(() => {
    audioServiceRef.current?.stopAndClear();
  }, []);

  const processInChunks = useCallback(async (textChunks: string[], voice: string, enhance: boolean) => {
    setProcessedChunks([]);
    let allProcessed = [];

    for (let i = 0; i < textChunks.length; i++) {
      setCurrentProcessingChunk(i);
      try {
        let textToSynthesize = textChunks[i];
        if (enhance) {
          textToSynthesize = await enhanceTextForTTS(textToSynthesize);
        }
        const base64Audio = await generateSpeech(textToSynthesize, voice);
        const newChunk = { index: i, audio: base64Audio };
        allProcessed.push(newChunk);
        setProcessedChunks([...allProcessed]);
      } catch (err) {
        throw err;
      }
    }
    setCurrentProcessingChunk(null);
  }, []);

  const handleGenerateSpeech = useCallback(async () => {
    if (!text.trim() || isPristine) {
      setError('لطفا برای آواسازی، متنی را وارد کنید.');
      return;
    }
    stopAllAudio();
    setIsLoading(true);
    setError(null);
    setGenerationComplete(false);
    setChunks([]);
    setProcessedChunks([]);
    setSingleAudioResult(null);

    try {
      if (text.length > CHUNK_SIZE) {
        const textChunks = chunkText(text, CHUNK_SIZE);
        setChunks(textChunks);
        await processInChunks(textChunks, selectedVoice, enhanceWithPro);
      } else {
        let textToSynthesize = text;
        if (enhanceWithPro) {
          textToSynthesize = await enhanceTextForTTS(text);
        }
        const base64Audio = await generateSpeech(textToSynthesize, selectedVoice);
        setSingleAudioResult(base64Audio);
      }
      setGenerationComplete(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطای غیرمنتظره‌ای رخ داد.';
      setError(errorMessage);
       setGenerationComplete(false);
    } finally {
      setIsLoading(false);
      setCurrentProcessingChunk(null);
    }
  }, [text, selectedVoice, enhanceWithPro, isPristine, stopAllAudio, processInChunks]);

  const handlePlaySample = useCallback(async (voiceId: string) => {
    setError(null);
    try {
      await audioServiceRef.current?.playSample(voiceId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در پخش نمونه صدا.';
      setError(errorMessage);
    }
  }, []);

  const handleTextFocus = () => {
    if (isPristine) {
      setText('');
      setIsPristine(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      setGenerationComplete(false);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result;
        if (arrayBuffer) {
          try {
            // @ts-ignore
            const result = await mammoth.extractRawText({ arrayBuffer });
            setText(result.value);
            setIsPristine(false);
          } catch (err) {
            console.error('Error parsing DOCX file:', err);
            setError('فایل Word قابل پردازش نبود. لطفا از یک فایل .docx معتبر استفاده کنید.');
          }
        }
      };
      reader.onerror = () => {
        setError('خطا در خواندن فایل.');
      }
      reader.readAsArrayBuffer(file);
    }
    event.target.value = '';
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const isBusy = isLoading || currentProcessingChunk !== null;
  const isGeneratingSingle = isLoading && currentProcessingChunk === null;

  if (!isKeySet) {
    return <ApiKeyModal onSubmit={handleKeySubmit} />;
  }

  return (
    <div className="min-h-screen w-full bg-transparent bg-fixed font-sans">
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4 z-10">
        <div className="w-full max-w-4xl bg-slate-900/40 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 space-y-8 border border-slate-700/80 shadow-2xl shadow-cyan-500/10">
          <header className="text-center pb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text pb-2 bg-gradient-to-r from-cyan-300 via-sky-400 to-fuchsia-500">
              آوای پارسی
            </h1>
            <p className="text-lg text-slate-400 mt-2">
              متن فارسی را با هوش مصنوعی جمینای به صدایی رسا و دلنشین تبدیل کنید.
            </p>
          </header>

          <main className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-slate-200 mb-3 text-right">
                انتخاب آوا
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {AVAILABLE_VOICES.map((voice) => (
                  <VoiceOption
                    key={voice.id}
                    voice={voice}
                    isSelected={selectedVoice === voice.id}
                    onSelect={setSelectedVoice}
                    onPlaySample={handlePlaySample}
                    disabled={isBusy}
                    audioService={audioServiceRef.current}
                  />
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="text-input" className="block text-lg font-semibold text-slate-200 mb-3 text-right">
                متن پارسی
              </label>
              <textarea
                id="text-input"
                className="w-full h-48 p-4 bg-slate-800/60 border border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 resize-none placeholder-slate-500 text-lg text-slate-200 shadow-inner"
                placeholder="متن پارسی خود را برای آواسازی، اینجا وارد یا جای‌گذاری کنید..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={handleTextFocus}
                disabled={isBusy}
              />
            </div>

            <div className="flex items-center justify-center">
              <label htmlFor="enhance-toggle" className="flex items-center gap-3 cursor-pointer text-slate-400">
                  <span className="text-sm font-medium select-none">
                      بهبود بیان و حس متن با Gemini 2.5 Pro
                  </span>
                  <div className="relative">
                      <input 
                          type="checkbox"
                          id="enhance-toggle"
                          checked={enhanceWithPro}
                          onChange={(e) => setEnhanceWithPro(e.target.checked)}
                          disabled={isBusy}
                          className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 peer-checked:bg-cyan-600"></div>
                      <div className="absolute right-1 top-1 bg-white rounded-full h-5 w-5 transition-transform duration-300 ease-in-out peer-checked:-translate-x-5"></div>
                  </div>
              </label>
            </div>
            
            <div className="text-center px-4">
              {error && <ErrorMessage message={error} onRetry={handleGenerateSpeech} />}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".docx" className="hidden" />
              <Button onClick={triggerFileSelect} disabled={isBusy} variant="secondary">
                <UploadIcon />
                بارگذاری فایل Word
              </Button>
              <Button onClick={handleGenerateSpeech} disabled={isBusy || !text.trim() || isPristine} >
                {isGeneratingSingle ? (
                  <>
                    <Loader />
                    {enhanceWithPro ? 'در حال بهینه‌سازی و آواسازی...' : 'در حال آواسازی...'}
                  </>
                ) : currentProcessingChunk !== null ? (
                  <>
                    <Loader />
                    {`پردازش بخش ${currentProcessingChunk + 1} از ${chunks.length}`}
                  </>
                ) : (
                  <>
                    <SpeakerIcon />
                    {generationComplete ? 'آواسازی دوباره' : 'آواسازی'}
                  </>
                )}
              </Button>
            </div>
            
            <div ref={resultsRef} className={`transition-all duration-700 ease-in-out ${(chunks.length > 0 || singleAudioResult) ? 'opacity-100 max-h-[1000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                {chunks.length > 0 && (
                   <ChunkPlayer 
                     chunks={chunks} 
                     processedChunks={processedChunks}
                     audioService={audioServiceRef.current}
                     currentProcessingChunk={currentProcessingChunk}
                   />
                )}
                {singleAudioResult && (
                    <SinglePlayer 
                        audioData={singleAudioResult}
                        audioService={audioServiceRef.current}
                    />
                )}
            </div>

          </main>
        </div>
        <footer className="text-center mt-8 text-slate-500">
          <p>ساخته شده با Google Gemini</p>
          <a href="https://github.com/google/genai-js" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-cyan-400 transition-colors">
              <GithubIcon />
              مشاهده در گیت‌هاب
          </a>
        </footer>
      </div>
    </div>
  );
};

export default App;
