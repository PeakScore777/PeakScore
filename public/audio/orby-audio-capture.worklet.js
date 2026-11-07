class OrbyAudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.pending = new Float32Array(0);
    this.position = 0;
    this.targetRate = 16000;
    this.mergedBuffer = new Float32Array(0);
    this.resampledBuffer = new Int16Array(0);
    this.pendingPcm = new Int16Array(640);
    this.pendingPcmLength = 0;
  }

  process(inputs) {
    const channels = inputs[0];
    if (!channels || channels.length === 0 || channels[0].length === 0) return true;

    const left = channels[0];
    const right = channels.length > 1 ? channels[1] : null;
    const requiredFrames = this.pending.length + left.length;

    // Reuse scratch storage between render quanta; grow only when a device
    // supplies a larger-than-usual block.
    if (this.mergedBuffer.length < requiredFrames) {
      const capacity = Math.max(requiredFrames, this.mergedBuffer.length * 2, 256);
      this.mergedBuffer = new Float32Array(capacity);
    }
    const merged = this.mergedBuffer;
    merged.set(this.pending, 0);
    if (right) {
      for (let i = 0; i < left.length; i += 1) {
        merged[this.pending.length + i] = (left[i] + right[i]) * 0.5;
      }
    } else {
      merged.set(left, this.pending.length);
    }

    const step = sampleRate / this.targetRate;
    const maxOutputSamples = Math.ceil(requiredFrames / step) + 2;
    if (this.resampledBuffer.length < maxOutputSamples) {
      const capacity = Math.max(maxOutputSamples, this.resampledBuffer.length * 2, 128);
      this.resampledBuffer = new Int16Array(capacity);
    }

    let outputLength = 0;
    while (this.position + 1 < requiredFrames) {
      const index = Math.floor(this.position);
      const fraction = this.position - index;
      const sample = merged[index] * (1 - fraction) + merged[index + 1] * fraction;
      const clamped = Math.max(-1, Math.min(1, sample));
      this.resampledBuffer[outputLength] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      outputLength += 1;
      this.position += step;
    }

    // Retain the final source frame and fractional cursor for interpolation
    // across render quanta; do not discard the resampler's overshoot.
    const consumed = Math.min(Math.floor(this.position), Math.max(0, requiredFrames - 1));
    this.pending = merged.slice(consumed, requiredFrames);
    this.position -= consumed;

    // Fill a fixed 40 ms packet directly. Transfer complete packets and
    // allocate the next staging buffer only once per emitted packet.
    for (let i = 0; i < outputLength; i += 1) {
      this.pendingPcm[this.pendingPcmLength] = this.resampledBuffer[i];
      this.pendingPcmLength += 1;
      if (this.pendingPcmLength === 640) {
        const packet = this.pendingPcm;
        this.port.postMessage(packet.buffer, [packet.buffer]);
        this.pendingPcm = new Int16Array(640);
        this.pendingPcmLength = 0;
      }
    }

    return true;
  }
}

registerProcessor("orby-audio-capture", OrbyAudioCaptureProcessor);
