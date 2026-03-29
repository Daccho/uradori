export interface TTSService {
  synthesize(text: string, speaker: string): Promise<ArrayBuffer>;
}
