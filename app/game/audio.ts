// A bright two-note ring pickup chime, synthesized without external audio files.
export function playRingSound(audio: AudioContext) {
  const now = audio.currentTime
  for (const [frequency, delay] of [
    [1567.98, 0],
    [2093, 0.055],
  ] as const) {
    for (const [harmonic, volume, duration] of [
      [1, 0.04, 0.36],
      [2.76, 0.009, 0.16],
    ] as const) {
      const oscillator = audio.createOscillator()
      const envelope = audio.createGain()
      const start = now + delay
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency * harmonic, start)
      envelope.gain.setValueAtTime(0.0001, start)
      envelope.gain.exponentialRampToValueAtTime(volume, start + 0.003)
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      oscillator.connect(envelope)
      envelope.connect(audio.destination)
      oscillator.onended = () => {
        oscillator.disconnect()
        envelope.disconnect()
      }
      oscillator.start(start)
      oscillator.stop(start + duration)
    }
  }
}
