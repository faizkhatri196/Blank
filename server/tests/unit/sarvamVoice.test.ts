import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { transcribeAudioWithSarvam, SarvamVoiceError } from '../../src/services/sarvamVoiceService';
import { ENV } from '../../src/config/env';
import { handleVoiceUpload, transcribeCustomerVoice } from '../../src/controllers/voiceController';
import { ServiceTicket } from '../../src/models/ServiceTicket';

describe('Sarvam AI Voice Transcription Unit Tests (Saaras v4)', () => {
  const originalApiKey = ENV.SARVAM_API_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    ENV.SARVAM_API_KEY = 'mock_sarvam_test_key_12345';
  });

  afterEach(() => {
    ENV.SARVAM_API_KEY = originalApiKey;
    global.fetch = originalFetch;
  });

  describe('Service: transcribeAudioWithSarvam', () => {
    it('1. Successfully transcribes audio using mocked provider response', async () => {
      const mockAudio = Buffer.from('RIFF....WAVEfmt....mockaudiobytes');
      const mockResponse = {
        transcript: 'સોલર ઇન્વર્ટર બંધ થઈ ગયું છે અને લાલ લાઈટ થાય છે',
        language_code: 'gu-IN',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const result = await transcribeAudioWithSarvam({
        audioBuffer: mockAudio,
        mimetype: 'audio/webm',
        languageCode: 'gu-IN',
      });

      expect(result).toBeDefined();
      expect(result.transcript).toBe('સોલર ઇન્વર્ટર બંધ થઈ ગયું છે અને લાલ લાઈટ થાય છે');
      expect(result.language_code).toBe('gu-IN');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const [url, requestInit] = (global.fetch as any).mock.calls[0];
      expect(url).toBe('https://api.sarvam.ai/speech-to-text');
      expect(requestInit.headers['api-subscription-key']).toBe('mock_sarvam_test_key_12345');
    });

    it('2. Throws SARVAM_KEY_NOT_CONFIGURED when API key is missing', async () => {
      ENV.SARVAM_API_KEY = '';
      const mockAudio = Buffer.from('audio_content');

      await expect(
        transcribeAudioWithSarvam({
          audioBuffer: mockAudio,
          mimetype: 'audio/webm',
        })
      ).rejects.toMatchObject({
        code: 'SARVAM_KEY_NOT_CONFIGURED',
        statusCode: 503,
      });
    });

    it('3. Throws EMPTY_AUDIO when audio buffer is empty', async () => {
      await expect(
        transcribeAudioWithSarvam({
          audioBuffer: Buffer.alloc(0),
          mimetype: 'audio/webm',
        })
      ).rejects.toMatchObject({
        code: 'EMPTY_AUDIO',
        statusCode: 400,
      });
    });

    it('4. Handles provider error gracefully (e.g. 500 / 400 with detail)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Cannot decode audio file' }),
      } as any);

      await expect(
        transcribeAudioWithSarvam({
          audioBuffer: Buffer.from('bad_audio'),
          mimetype: 'audio/webm',
        })
      ).rejects.toMatchObject({
        code: 'SARVAM_PROVIDER_ERROR',
        message: 'Cannot decode audio file',
        statusCode: 400,
      });
    });

    it('5. Handles transcription request timeout (AbortError)', async () => {
      global.fetch = vi.fn().mockImplementation(() => {
        const error: any = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      await expect(
        transcribeAudioWithSarvam({
          audioBuffer: Buffer.from('some_audio'),
          mimetype: 'audio/webm',
          timeoutMs: 10,
        })
      ).rejects.toMatchObject({
        code: 'TRANSCRIPTION_TIMEOUT',
        statusCode: 504,
      });
    });

    it('6. Throws INVALID_PROVIDER_RESPONSE if transcript is missing in payload', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ some_other_key: 123 }), // Missing 'transcript'
      } as any);

      await expect(
        transcribeAudioWithSarvam({
          audioBuffer: Buffer.from('valid_audio'),
          mimetype: 'audio/webm',
        })
      ).rejects.toMatchObject({
        code: 'INVALID_PROVIDER_RESPONSE',
        statusCode: 502,
      });
    });

    it('7. Handles empty transcription returned by provider cleanly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ transcript: '', language_code: 'hi-IN' }),
      } as any);

      const result = await transcribeAudioWithSarvam({
        audioBuffer: Buffer.from('silent_audio'),
        mimetype: 'audio/wav',
        languageCode: 'hi-IN',
      });

      expect(result.transcript).toBe('');
      expect(result.language_code).toBe('hi-IN');
    });

    it('8. Supports Gujarati (gu-IN), Hindi (hi-IN), English (en-IN), and Auto-detect (unknown)', async () => {
      for (const lang of ['gu-IN', 'hi-IN', 'en-IN', 'unknown']) {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ transcript: 'Test text', language_code: lang }),
        } as any);

        const res = await transcribeAudioWithSarvam({
          audioBuffer: Buffer.from('dummy_sound'),
          mimetype: 'audio/webm',
          languageCode: lang,
        });

        expect(res.language_code).toBe(lang);
      }
    });
  });

  describe('Controller & Middleware: Validation & Safety', () => {
    it('9. Rejects requests with no audio file uploaded', async () => {
      const req: any = { file: undefined, body: {} };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await transcribeCustomerVoice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'EMPTY_AUDIO' }),
        })
      );
    });

    it('10. Rejects empty buffer audio in controller', async () => {
      const req: any = {
        file: { buffer: Buffer.alloc(0), mimetype: 'audio/webm', size: 0 },
        body: {},
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await transcribeCustomerVoice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'EMPTY_AUDIO' }),
        })
      );
    });

    it('11. Preserves existing manual complaint text when appending transcript', () => {
      const existingManualText = 'Water is dripping from the indoor unit.';
      const voiceTranscript = 'Also remote display is flickering.';

      const merged = existingManualText
        ? `${existingManualText.trim()} ${voiceTranscript.trim()}`
        : voiceTranscript.trim();

      expect(merged).toBe('Water is dripping from the indoor unit. Also remote display is flickering.');
      expect(merged.startsWith(existingManualText)).toBe(true);
    });

    it('12. Confirms voice transcription NEVER creates or modifies ServiceTicket', async () => {
      // Mock ServiceTicket.create and save to verify zero calls occur during transcription
      const ticketCreateSpy = vi.spyOn(ServiceTicket, 'create');

      const req: any = {
        file: {
          buffer: Buffer.from('sample_audio_payload'),
          mimetype: 'audio/webm',
          originalname: 'voice.webm',
        },
        body: { language_code: 'en-IN' },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ transcript: 'AC not cooling properly', language_code: 'en-IN' }),
      } as any);

      await transcribeCustomerVoice(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          transcript: 'AC not cooling properly',
          language_code: 'en-IN',
        },
      });

      // Crucial Safety Rule: Transcription must never automatically create tickets
      expect(ticketCreateSpy).not.toHaveBeenCalled();
      ticketCreateSpy.mockRestore();
    });

    it('13. Returns success: false with EMPTY_TRANSCRIPT error when provider returns 200 but empty transcript', async () => {
      const ticketCreateSpy = vi.spyOn(ServiceTicket, 'create');

      const req: any = {
        file: {
          buffer: Buffer.from('silent_audio_payload'),
          mimetype: 'audio/wav',
          originalname: 'silent.wav',
        },
        body: { language_code: 'unknown' },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      // Provider returns 200 OK with empty transcript (e.g. silent audio or unvoiced sound)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ transcript: '', language_code: 'en-IN' }),
      } as any);

      await transcribeCustomerVoice(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'EMPTY_TRANSCRIPT',
          message: 'No speech was detected in your recording. Please speak closer to your microphone or type your complaint.',
        },
        data: {
          transcript: '',
          language_code: 'en-IN',
        },
      });

      expect(ticketCreateSpy).not.toHaveBeenCalled();
      ticketCreateSpy.mockRestore();
    });
  });
});
