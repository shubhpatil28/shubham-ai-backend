import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config/api';

/**
 * useStreamingChat – custom hook to stream AI responses from the backend.
 * Returns the current streamed text, loading flag, error, and a `start` function.
 * The hook uses the Fetch API with readable streams to handle SSE data.
 */
export default function useStreamingChat() {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const start = async (message) => {
    setStreamedText('');
    setIsStreaming(true);
    setError(null);
    // Abort controller to cancel previous streams if needed
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();
    try {
      const response = await fetch(`${API_URL}/api/stream-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: controllerRef.current.signal,
      });
      if (!response.body) {
        throw new Error('Readable stream not supported by the browser');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // Process SSE formatted lines (data: ...\n\n)
        const parts = buffer.split('\n\n');
        // Keep the last incomplete part in buffer
        buffer = parts.pop();
        for (const part of parts) {
          if (part.startsWith('data: ')) {
            const data = part.replace(/^data: /, '');
            setStreamedText((prev) => prev + data);
          } else if (part.startsWith('event: error')) {
            // Next line should contain the error message
            const errMsg = part.split('\n')[1]?.replace(/^data: /, '') || 'Unknown error';
            setError(errMsg);
          }
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        setError(e.message);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  return { streamedText, isStreaming, error, start };
}
