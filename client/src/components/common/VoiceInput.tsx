import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, AlertCircle, RefreshCw, Check, Globe, X } from 'lucide-react';
import { apiClient } from '../../api/client';

export interface VoiceInputProps {
  onTranscript: (text: string) => void;
  currentValue?: string;
  disabled?: boolean;
  onTranscribingChange?: (isTranscribing: boolean) => void;
}

type VoiceStatus = 'idle' | 'recording' | 'transcribing' | 'success';

interface LanguageOption {
  code: string;
  label: string;
  native: string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'unknown', label: 'Auto-Detect', native: '🌐 Auto-Detect' },
  { code: 'gu-IN', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'hi-IN', label: 'Hindi', native: 'हिन्दी' },
  { code: 'en-IN', label: 'English (India)', native: 'English' },
];

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  currentValue = '',
  disabled = false,
  onTranscribingChange,
}) => {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('unknown');
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [useBrowserFallback, setUseBrowserFallback] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // Sync transcribing state to parent component
  useEffect(() => {
    if (onTranscribingChange) {
      onTranscribingChange(status === 'transcribing');
    }
  }, [status, onTranscribingChange]);

  // Cleanup all media streams, timers, and recognizers on unmount
  const cleanupStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_e) {}
    }
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanupStream();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_e) {}
      }
    };
  }, [cleanupStream]);

  // Format recording seconds to mm:ss
  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to pick best supported mime type
  const getSupportedMimeType = (): string => {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
      return '';
    }
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/wav',
    ];
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  };

  // Append new transcript to current text without overwriting existing input
  const appendTranscript = (newTranscript: string) => {
    const cleanNew = newTranscript.trim();
    if (!cleanNew) return;

    const existing = (currentValue || '').trim();
    const merged = existing ? `${existing} ${cleanNew}` : cleanNew;
    onTranscript(merged);
  };

  // Send recorded audio to backend Sarvam STT endpoint
  const sendAudioToBackend = async (blob: Blob, mimeType: string) => {
    setStatus('transcribing');
    setErrorMessage(null);

    try {
      const formData = new FormData();
      const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('wav') ? 'wav' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      formData.append('audio', blob, `complaint_voice.${ext}`);
      formData.append('language_code', selectedLanguage);

      const response = await apiClient.post('/customer-portal/voice/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success && response.data.data) {
        const { transcript, language_code } = response.data.data;

        if (transcript && transcript.trim().length > 0) {
          appendTranscript(transcript);
          setStatus('success');
          setSuccessInfo(
            language_code && language_code !== 'unknown'
              ? `Transcribed in ${language_code}: "${transcript.length > 50 ? transcript.substring(0, 50) + '...' : transcript}"`
              : `Transcribed: "${transcript.length > 50 ? transcript.substring(0, 50) + '...' : transcript}"`
          );

          // Clear success status after 4 seconds
          setTimeout(() => {
            setStatus('idle');
            setSuccessInfo(null);
          }, 4000);
        } else {
          // HTTP 200 but transcript is empty: DO NOT report as success
          setStatus('idle');
          setErrorMessage('No speech was detected in your recording. Please speak closer to your microphone or type your complaint.');
        }
      } else {
        // Backend returned success: false (e.g. EMPTY_TRANSCRIPT)
        setStatus('idle');
        const errorMsg =
          response.data?.error?.message ||
          'No speech was detected in your recording. Please speak closer to your microphone or type your complaint.';
        setErrorMessage(errorMsg);
      }
    } catch (err: any) {
      setStatus('idle');
      const backendError = err.response?.data?.error?.message || err.message;
      setErrorMessage(
        backendError || 'Voice transcription service is temporarily unavailable. You can type your request directly or try again.'
      );
    }
  };

  // Fallback to browser SpeechRecognition if Sarvam fails or is preferred
  const startBrowserSpeechFallback = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage("Voice recognition isn't supported in this browser. Please type your request directly.");
      return;
    }

    try {
      setErrorMessage(null);
      setStatus('recording');

      const recognition = new SpeechRecognition();
      recognition.lang = selectedLanguage === 'unknown' ? 'gu-IN' : selectedLanguage;
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onresult = (event: any) => {
        const transcriptChunk = event.results?.[0]?.[0]?.transcript || '';
        if (transcriptChunk) {
          appendTranscript(transcriptChunk);
          setStatus('success');
          setSuccessInfo(`Added: "${transcriptChunk}"`);
          setTimeout(() => {
            setStatus('idle');
            setSuccessInfo(null);
          }, 3500);
        }
      };

      recognition.onerror = (event: any) => {
        setStatus('idle');
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access was denied. Please allow microphone permission in your browser.');
        } else if (event.error === 'no-speech') {
          setErrorMessage('No speech detected. Please try speaking again.');
        } else {
          setErrorMessage(`Speech recognition error (${event.error}). You can type directly.`);
        }
      };

      recognition.onend = () => {
        setStatus('idle');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (_err) {
      setStatus('idle');
      setErrorMessage('Browser speech recognition failed to start. You can type your complaint.');
    }
  };

  // Primary: Record with MediaRecorder and transcribe using Sarvam AI
  const startRecording = async () => {
    if (useBrowserFallback) {
      startBrowserSpeechFallback();
      return;
    }

    // Check MediaRecorder and getUserMedia support
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      // Automatic fallback to browser Web Speech API
      setUseBrowserFallback(true);
      startBrowserSpeechFallback();
      return;
    }

    try {
      setErrorMessage(null);
      setSuccessInfo(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        clearInterval(timerRef.current);
        const resolvedMime = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: resolvedMime });

        // Clean up hardware microphone stream immediately
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (audioBlob.size < 100) {
          setStatus('idle');
          setErrorMessage('Recording was too short or empty. Please speak your complaint and press stop.');
          return;
        }

        sendAudioToBackend(audioBlob, resolvedMime);
      };

      // Start recording with 250ms timeslices
      mediaRecorder.start(250);
      setStatus('recording');
      setRecordSeconds(0);

      // Start recording timer
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          // Safety cutoff at 28 seconds (Sarvam REST API maximum duration is 30 seconds)
          if (prev >= 28) {
            stopRecording();
            return 28;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      cleanupStream();
      setStatus('idle');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser to record your complaint.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No microphone was detected on this device. You can type your complaint directly.');
      } else {
        setErrorMessage(`Microphone error: ${err.message || 'Unable to access microphone'}. You can type directly.`);
      }
    }
  };

  const stopRecording = () => {
    if (useBrowserFallback && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_e) {}
      setStatus('idle');
      return;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        // Request any remaining buffer slice before stopping
        if (typeof mediaRecorderRef.current.requestData === 'function') {
          mediaRecorderRef.current.requestData();
        }
        mediaRecorderRef.current.stop();
      } catch (_e) {
        cleanupStream();
        setStatus('idle');
      }
    }
  };

  return (
    <div className="w-full space-y-2.5 mt-2.5">
      {/* Voice controls and language selection */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {status === 'idle' && (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Speak your complaint in Gujarati, Hindi, or English"
            >
              <Mic className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              <span>🎙️ Speak complaint (Sarvam AI)</span>
            </button>
          )}

          {status === 'recording' && (
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-all shadow-xs active:scale-95 animate-pulse"
              title="Stop recording and transcribe"
            >
              <Square className="w-3 h-3 fill-white" />
              <span>Stop & Transcribe ({formatTimer(recordSeconds)})</span>
            </button>
          )}

          {status === 'transcribing' && (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl shadow-2xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Transcribing with Sarvam AI...</span>
            </span>
          )}

          {status === 'success' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl animate-fadeIn">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Transcript added!</span>
            </span>
          )}

          {/* Recording live indicator */}
          {status === 'recording' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
              Recording...
            </span>
          )}
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={status === 'recording' || status === 'transcribing' || disabled}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
            title="Choose language for Sarvam AI speech recognition"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.native} {lang.code !== 'unknown' ? `(${lang.label})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Success info banner */}
      {successInfo && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900 flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successInfo}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessInfo(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs p-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Dismissible error message */}
      {errorMessage && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-900 text-xs p-2.5 rounded-xl animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p>{errorMessage}</p>
            {!useBrowserFallback && (
              <button
                type="button"
                onClick={() => {
                  setUseBrowserFallback(true);
                  setErrorMessage(null);
                  startBrowserSpeechFallback();
                }}
                className="text-[11px] font-semibold text-indigo-700 hover:underline"
              >
                Try browser speech recognition fallback →
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-amber-700 hover:text-amber-900 text-xs p-1"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
