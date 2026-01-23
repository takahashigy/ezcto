/**
 * 播放成功通知声音
 * 使用Web Audio API生成愉悦的通知音效
 */
export function playSuccessSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // 创建三个音符的和弦（C大调和弦）
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const duration = 0.3;
    const now = audioContext.currentTime;

    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      // 音量包络（ADSR）
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01); // Attack
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Decay & Release

      oscillator.start(now + index * 0.05);
      oscillator.stop(now + duration + index * 0.05);
    });
  } catch (error) {
    console.warn('[NotificationSound] Failed to play sound:', error);
  }
}
