export interface TTSCache {
  get(key: string): Promise<ArrayBuffer | null>;
  put(key: string, data: ArrayBuffer): Promise<string>;
}
