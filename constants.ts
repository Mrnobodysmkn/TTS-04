import { VoiceOption } from './types';

export const AVAILABLE_VOICES: VoiceOption[] = [
  { id: 'kore', name: 'آوا (زن)', description: 'صدایی واضح و استاندارد زنانه.' },
  { id: 'zephyr', name: 'ماندانا (زن)', description: 'صدایی گرم و دوستانه زنانه.' },
  { id: 'vindemiatrix', name: 'رویا (زن)', description: 'صدایی آرام و روایی زنانه.' },
  { id: 'puck', name: 'فرهاد (مرد)', description: 'صدایی استاندارد و رسا مردانه.' },
  { id: 'charon', name: 'پرویز (مرد)', description: 'صدایی پخته و عمیق مردانه.' },
  { id: 'rasalgethi', name: 'آرمان (مرد)', description: 'صدایی جوان و پرانرژی مردانه.' },
  { id: 'fenrir', name: 'کوروش (مرد)', description: 'عمیق‌ترین صدا (basso profundo)، با تُن کامل و تیره.' },
  { id: 'zubenelgenubi', name: 'بهرام (مرد)', description: 'صدایی قدرتمند و حماسی مردانه.' },
];

export const VOICE_SAMPLE_TEXT = 'در سکوت شب، صدای ستارگان را می‌شنوم.';

export const CHUNK_SIZE = 4500;
