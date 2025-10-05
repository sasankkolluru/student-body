declare module 'node-nlp' {
  export interface NlpManagerOptions {
    languages: string[];
    forceNER?: boolean;
  }

  export interface ProcessResult {
    intent: string;
    score: number;
    answer?: string;
    entities?: any[];
  }

  export class NlpManager {
    constructor(options: NlpManagerOptions);
    addDocument(language: string, text: string, intent: string): void;
    addAnswer(language: string, intent: string, answer: string): void;
    train(): Promise<void>;
    process(language: string, text: string): Promise<ProcessResult>;
  }
}
