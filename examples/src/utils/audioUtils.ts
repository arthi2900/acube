import { ttsApi } from './api';

export class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;

  async playText(text: string): Promise<void> {
    try {

      const res = await ttsApi.synthesizeShort(text);
      const blob = res as Blob; // axios responseType: 'blob' 返回的就是 Blob
      const audioUrl = URL.createObjectURL(blob);

      // 播放
      await this.playAudio(audioUrl);

      // 播放完释放 URL
      URL.revokeObjectURL(audioUrl);
    } catch (error) {
      console.error('播放语音失败:', error);
      throw error;
    }
  }

  private async playAudio(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }

      const audio = new Audio(url);
      this.currentAudio = audio;

      audio.onended = () => {
        this.currentAudio = null;
        resolve();
      };

      audio.onerror = err => {
        console.log(err)
        this.currentAudio = null;
        reject(new Error('音频播放失败'));
      };

      audio.muted = true;
      audio.play()
        .then(() => { audio.muted = false; })
        .catch(reject);
    });
  }

  stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }
}

export const audioManager = new AudioManager();