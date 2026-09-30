import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, AlertCircle, RefreshCw, Check, Globe } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  currentValue?: string;
  disabled?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  currentValue = '',
  disabled = false,
}) => {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [interimText, setInterimText] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('gu-IN');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const baseValueRef = useRef<string>(currentValue);

  const languages = [
    { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)' },
    { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
    { code: 'en-IN', label: 'English (India)' },
  ];

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const startListening = () => {
    if (!isSupported) {
      setErrorMessage("Voice input isn't available on this device. You can type your request instead.");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      setErrorMessage(null);
      setInterimText('');
      baseValueRef.current = currentValue ? currentValue.trim() : '';

      const recognition = new SpeechRecognition();
      recognition.lang = selectedLanguage;
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setIsProcessing(false);
      };

      recognition.onresult = (event: any) => {
        let finalSegment = '';
        let interimSegment = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalSegment += transcriptChunk;
          } else {
            interimSegment += transcriptChunk;
          }
        }

        if (interimSegment) {
          setInterimText(interimSegment);
        }

        if (finalSegment) {
          setIsProcessing(true);
          const prefix = baseValueRef.current ? `${baseValueRef.current} ` : '';
          const updatedValue = `${prefix}${finalSegment}`.trim();
          baseValueRef.current = updatedValue;
          onTranscript(updatedValue);
          setInterimText('');
          setIsProcessing(false);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setIsProcessing(false);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access was denied. Please allow microphone permission in your browser to use voice input.');
        } else if (event.error === 'no-speech') {
          setErrorMessage('No speech detected. Please tap the microphone and try speaking again.');
        } else if (event.error === 'network') {
          setErrorMessage('Network connection issue for voice recognition. You can type your request instead.');
        } else {
          setErrorMessage(`Voice recognition note: ${event.error || 'Stopped'}. You can type directly.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setIsProcessing(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setIsProcessing(false);
      setErrorMessage("Voice input isn't available on this device. You can type your request instead.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_e) {
        // Safe catch
      }
      setIsListening(false);
      setIsProcessing(false);
      setInterimText('');
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_e) {}
      }
    };
  }, []);

  return (
    <div className="w-full space-y-2 mt-2">
      {/* Header controls: Microphone button + Language selector */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!isListening ? (
            <button
              type="button"
              onClick={startListening}
              disabled={disabled}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Speak your complaint using microphone"
            >
              <Mic className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              <span>🎙️ Speak instead</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopListening}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-all shadow-xs active:scale-95 animate-pulse"
            >
              <Square className="w-3 h-3 fill-white" />
              <span>Stop Recording</span>
            </button>
          )}

          {/* Active Listening indicator */}
          {isListening && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
              Listening...
            </span>
          )}

          {isProcessing && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
              Transcribing...
            </span>
          )}
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedLanguage}
            onChange={(e) => {
              setSelectedLanguage(e.target.value);
              if (isListening) {
                stopListening();
              }
            }}
            disabled={isListening || disabled}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            title="Select speech recognition language"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Interim Transcript display while speaking */}
      {isListening && interimText && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-2.5 text-xs text-indigo-900 animate-fadeIn flex items-start gap-2">
          <span className="font-semibold text-indigo-700 shrink-0">Hearing:</span>
          <span className="italic">"{interimText}"</span>
        </div>
      )}

      {/* Unsupported device or permission error fallback */}
      {errorMessage && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-900 text-xs p-2.5 rounded-xl animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-amber-700 hover:text-amber-900 text-xs font-semibold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {!isSupported && (
        <p className="text-[11px] text-slate-500 italic">
          Voice input isn't available on this device. You can type your request instead.
        </p>
      )}
    </div>
  );
};
