import { ENV } from '../config/env';

export interface SarvamTranscribeOptions {
  audioBuffer: Buffer;
  mimetype: string;
  originalFilename?: string;
  languageCode?: string;
  timeoutMs?: number;
}

export interface SarvamTranscribeResult {
  transcript: string;
  language_code: string;
}

export class SarvamVoiceError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code = 'SARVAM_ERROR', statusCode = 500) {
    super(message);
    this.name = 'SarvamVoiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

const SUPPORTED_LANGUAGES: Record<string, string> = {
  'gu-IN': 'gu-IN',
  'hi-IN': 'hi-IN',
  'en-IN': 'en-IN',
  'unknown': 'unknown',
};

const DEFAULT_TIMEOUT_MS = 25000;
const SARVAM_STT_ENDPOINT = 'https://api.sarvam.ai/speech-to-text';

/**
 * Transcribes audio buffer using Sarvam AI Saaras v4 model.
 * Never logs API keys, audio buffers, or sensitive voice data.
 */
export async function transcribeAudioWithSarvam(
  options: SarvamTranscribeOptions
): Promise<SarvamTranscribeResult> {
  const apiKey = ENV.SARVAM_API_KEY?.trim();
  if (!apiKey) {
    throw new SarvamVoiceError(
      'Sarvam voice transcription is not configured on this server.',
      'SARVAM_KEY_NOT_CONFIGURED',
      503
    );
  }

  const { audioBuffer, mimetype, originalFilename, languageCode, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  if (!audioBuffer || audioBuffer.length === 0) {
    throw new SarvamVoiceError('Empty audio recording provided.', 'EMPTY_AUDIO', 400);
  }

  // Map and validate language code; default to 'unknown' for auto-detection
  const normalizedLang = languageCode && SUPPORTED_LANGUAGES[languageCode]
    ? SUPPORTED_LANGUAGES[languageCode]
    : 'unknown';

  // Clean MIME type and assign correct extension
  const cleanMime = (mimetype || 'audio/webm').toLowerCase().split(';')[0].trim();
  let ext = 'webm';
  if (cleanMime.includes('wav')) ext = 'wav';
  else if (cleanMime.includes('mp3') || cleanMime.includes('mpeg')) ext = 'mp3';
  else if (cleanMime.includes('ogg') || cleanMime.includes('opus')) ext = 'ogg';
  else if (cleanMime.includes('mp4') || cleanMime.includes('m4a')) ext = 'mp4';
  else if (cleanMime.includes('flac')) ext = 'flac';
  else if (cleanMime.includes('aac')) ext = 'aac';

  const formData = new FormData();
  const audioBlob = new Blob([audioBuffer], { type: cleanMime });
  const filename = originalFilename && originalFilename.includes('.')
    ? originalFilename
    : `voice_complaint.${ext}`;

  formData.append('file', audioBlob, filename);
  formData.append('model', 'saaras:v4');
  formData.append('mode', 'transcribe');
  formData.append('language_code', normalizedLang);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(SARVAM_STT_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      let errorMessage = `Sarvam API returned error status ${response.status}`;
      try {
        const errorJson: any = await response.json();
        if (errorJson?.message) {
          errorMessage = errorJson.message;
        } else if (errorJson?.detail) {
          errorMessage = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch (_jsonErr) {
        // Fallback to generic message
      }

      throw new SarvamVoiceError(
        errorMessage,
        'SARVAM_PROVIDER_ERROR',
        response.status >= 500 ? 502 : response.status
      );
    }

    const data: any = await response.json().catch(() => null);

    if (!data || typeof data.transcript !== 'string') {
      throw new SarvamVoiceError(
        'Invalid or malformed response returned by voice transcription provider.',
        'INVALID_PROVIDER_RESPONSE',
        502
      );
    }

    return {
      transcript: data.transcript.trim(),
      language_code: data.language_code || normalizedLang,
    };
  } catch (err: any) {
    clearTimeout(timer);

    if (err instanceof SarvamVoiceError) {
      throw err;
    }

    if (err?.name === 'AbortError' || err?.code === 'ABORT_ERR') {
      throw new SarvamVoiceError(
        'Voice transcription request timed out. Please try a shorter voice message or type manually.',
        'TRANSCRIPTION_TIMEOUT',
        504
      );
    }

    throw new SarvamVoiceError(
      err?.message || 'Network error communicating with speech recognition service.',
      'NETWORK_ERROR',
      502
    );
  }
}
