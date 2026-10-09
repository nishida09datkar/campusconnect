/**
 * Pre-generated audible WAV chime data URI for initial demo doubts and chat voice notes.
 * Generates valid PCM WAV data that all browser HTML5 audio elements can play without external network requests.
 */
function createWavDataUri(frequency = 440, durationSeconds = 2.5): string {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Pleasant musical decay chime
    const sample = Math.sin(2 * Math.PI * frequency * t) * 0.4 * Math.exp(-t * 1.2) +
                   Math.sin(2 * Math.PI * (frequency * 1.5) * t) * 0.2 * Math.exp(-t * 2);
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  // Convert buffer to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

export const SAMPLE_AUDIO_DOUBT_URL = createWavDataUri(523.25, 3); // High C chime (3s)
export const SAMPLE_AUDIO_REPLY_URL = createWavDataUri(392.00, 4); // G note explanation (4s)
export const SAMPLE_AUDIO_CHAT_URL = createWavDataUri(440.00, 2.5); // A440 voice note (2.5s)
