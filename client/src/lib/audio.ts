export class AudioNotificationService {
  private context: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();

  constructor() {
    // Initialize audio context on user interaction
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.context = new AudioContext();
    }
  }

  private async createBeepSound(frequency: number, duration: number, type: OscillatorType = 'sine'): Promise<AudioBuffer> {
    if (!this.context) return null as any;

    const sampleRate = this.context.sampleRate;
    const frameCount = sampleRate * duration;
    const buffer = this.context.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
          break;
        case 'triangle':
          sample = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t));
          break;
      }
      
      // Apply envelope to avoid clicks
      const envelope = Math.exp(-t * 2);
      channelData[i] = sample * envelope * 0.3; // Reduced volume
    }

    return buffer;
  }

  async initializeSounds() {
    if (!this.context) return;

    try {
      // Create different sounds for different notification types
      const taskCreatedSound = await this.createBeepSound(800, 0.3, 'sine');
      const taskAcceptedSound = await this.createBeepSound(600, 0.2, 'sine');
      const taskRejectedSound = await this.createBeepSound(300, 0.5, 'square');
      const taskCompletedSound = await this.createBeepSound(1000, 0.4, 'triangle');
      const generalSound = await this.createBeepSound(700, 0.2, 'sine');

      this.sounds.set('task_created', taskCreatedSound);
      this.sounds.set('task_accepted', taskAcceptedSound);
      this.sounds.set('task_rejected', taskRejectedSound);
      this.sounds.set('task_completed', taskCompletedSound);
      this.sounds.set('general', generalSound);
    } catch (error) {
      console.warn('Failed to initialize audio notifications:', error);
    }
  }

  async playNotification(type: string = 'general') {
    if (!this.context || !this.sounds.has(type)) {
      // Fallback to default sound if type not found
      if (type !== 'general' && this.sounds.has('general')) {
        return this.playNotification('general');
      }
      return;
    }

    try {
      // Resume audio context if suspended
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }

      const buffer = this.sounds.get(type);
      if (!buffer) return;

      const source = this.context.createBufferSource();
      const gainNode = this.context.createGain();
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.context.destination);
      
      // Set volume
      gainNode.gain.value = 0.1; // Low volume
      
      source.start();
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  // Initialize sounds on first user interaction
  async enableAudio() {
    if (!this.context) {
      this.initializeAudioContext();
    }
    
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
    
    if (this.sounds.size === 0) {
      await this.initializeSounds();
    }
  }
}

export const audioService = new AudioNotificationService();
