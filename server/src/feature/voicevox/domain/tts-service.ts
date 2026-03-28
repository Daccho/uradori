export interface TTSService {
  synthesize(text: string, speaker: number): Promise<ArrayBuffer>;
}
