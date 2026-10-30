class OrbyAudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.pending = new Float32Array(0);
    this.position = 0;
    this.targetRate = 16000;
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

    const consumed = Math.floor(this.position);
    this.pending = merged.slice(consumed);
    this.position -= consumed;

    if (samples.length > 0) {
      const pcm = new Int16Array(samples.length);
      for (let i = 0; i < samples.length; i += 1) {
        const clamped = Math.max(-1, Math.min(1, samples[i]));
        pcm[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      }
      this.port.postMessage(pcm.buffer, [pcm.buffer]);
    }

    return true;
  }
}

registerProcessor("orby-audio-capture", OrbyAudioCaptureProcessor);
