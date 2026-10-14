import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { transcribeAudioWithSarvam, SarvamVoiceError } from '../services/sarvamVoiceService';

const ALLOWED_AUDIO_MIMES = [
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/m4a',
  'audio/x-m4a',
  'audio/ogg',
  'audio/opus',
  'audio/aac',
  'audio/flac',
  'audio/mp4',
  'video/webm', // Some mobile browsers report webm recording as video/webm
  'application/octet-stream',
];

const memoryStorage = multer.memoryStorage();

const audioUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit for voice clips
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    // Check if MIME type is an allowed audio format
    const cleanMime = file.mimetype.toLowerCase().split(';')[0].trim();
    const isAllowed = ALLOWED_AUDIO_MIMES.some((m) => m.toLowerCase().split(';')[0].trim() === cleanMime);

    if (isAllowed || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_MIME_TYPE: Only audio recordings (WebM, WAV, MP3, M4A, OGG, AAC, FLAC) are supported.'));
    }
  },
});

export const handleVoiceUpload = (req: Request, res: Response, next: NextFunction): void => {
  audioUpload.single('audio')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'Audio recording exceeds the 10 MB limit. Please submit a shorter voice note.',
          },
        });
        return;
      }
      if (err.message && err.message.includes('INVALID_MIME_TYPE')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_AUDIO_FORMAT',
            message: 'Unsupported audio format. Please provide a standard audio recording.',
          },
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: err.message || 'Audio upload failed',
        },
      });
      return;
    }
    next();
  });
};

/**
 * Handles voice transcription requests from customer complaint form.
 * Does NOT create or alter any tickets.
 */
export async function transcribeCustomerVoice(req: Request, res: Response): Promise<void> {
  try {
    const file = req.file;

    if (!file || !file.buffer || file.buffer.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_AUDIO',
          message: 'No audio data received or the recording is empty.',
        },
      });
      return;
    }

    const languageCode = (req.body.language_code || req.body.language || 'unknown').toString();

    const result = await transcribeAudioWithSarvam({
      audioBuffer: file.buffer,
      mimetype: file.mimetype,
      originalFilename: file.originalname,
      languageCode,
    });

    // If provider returned 200 OK but transcript contains no recognized speech words
    if (!result.transcript || result.transcript.trim().length === 0) {
      res.status(200).json({
        success: false,
        error: {
          code: 'EMPTY_TRANSCRIPT',
          message: 'No speech was detected in your recording. Please speak closer to your microphone or type your complaint.',
        },
        data: {
          transcript: '',
          language_code: result.language_code,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        transcript: result.transcript,
        language_code: result.language_code,
      },
    });
  } catch (err: any) {
    if (err instanceof SarvamVoiceError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'TRANSCRIPTION_FAILED',
        message: 'Unable to transcribe voice recording at this moment.',
      },
    });
  }
}
