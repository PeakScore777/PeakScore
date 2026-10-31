class OrbyAudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.pending = new Float32Array(0);
    this.position = 0;
    this.targetRate = 16000;
    this.pendingPcm = new Int16Array(0);
  }

  process(inputs) {
    const channels = inputs[0];
    if (!channels || channels.length === 0 || channels[0].length === 0) return true;

    const left = channels[0];
    const right = channels.length > 1 ? channels[1] : null;
    const incoming = new Float32Array(left.length);
    for (let i = 0; i < left.length; i += 1) {
      incoming[i] = right ? (left[i] + right[i]) * 0.5 : left[i];
    }

    const merged = new Float32Array(this.pending.length + incoming.length);
    merged.set(this.pending);
    merged.set(incoming, this.pending.length);

    const step = sampleRate / this.targetRate;
    const samples = [];
    while (this.position + 1 < merged.length) {
      const index = Math.floor(this.position);
      const fraction = this.position - index;
      samples.push(merged[index] * (1 - fraction) + merged[index + 1] * fraction);
      this.position += step;
    }

    // Keep the last source sample for the next render quantum. The
    // interpolation cursor may advance past the end by up to one resampling
    // step (for example 3 samples at 48 kHz); consuming that overshoot would
    // drop valid microphone frames and cause discontinuities in the PCM stream.
    const consumed = Math.min(Math.floor(this.position), Math.max(0, merged.length - 1));
    this.pending = merged.slice(consumed);
    this.position -= consumed;

    if (samples.length > 0) {
      // Gemini Live works more reliably with regular ~20 ms PCM packets.
      // The AudioWorklet render quantum is usually only 128 frames (~2.7 ms
      // at 48 kHz), so buffer resampled audio instead of flooding the socket
      // with tiny messages.
      const pending = this.pendingPcm || new Int16Array(0);
      const next = new Int16Array(pending.length + samples.length);
      next.set(pending);
      for (let i = 0; i < samples.length; i += 1) {
        const clamped = Math.max(-1, Math.min(1, samples[i]));
        next[pending.length + i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      }

      const packetSize = 1600; // 100 ms at 16 kHz, mono, signed 16-bit PCM.
      let offset = 0;
      while (offset + packetSize <= next.length) {
        const packet = next.slice(offset, offset + packetSize);
        this.port.postMessage(packet.buffer, [packet.buffer]);
        offset += packetSize;
      }
      this.pendingPcm = next.slice(offset);
    }

    return true;
  }
}

registerProcessor("orby-audio-capture", OrbyAudioCaptureProcessor);
