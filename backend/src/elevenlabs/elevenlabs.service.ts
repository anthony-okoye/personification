import { Injectable, Logger } from '@nestjs/common';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { ConfigService } from '@nestjs/config';

export interface AudioResult {
  audioBuffer: Buffer;
  audioUrl?: string;
  duration: number;
}

@Injectable()
export class ElevenLabsService {
  private readonly logger = new Logger(ElevenLabsService.name);
  private readonly client: ElevenLabsClient;
  private readonly voiceId: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ELEVENLABS_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('ELEVENLABS_API_KEY not configured');
    }

    // Get voice ID from config, default to Rachel
    this.voiceId = this.configService.get<string>('ELEVENLABS_VOICE_ID') || 'EXAVITQu4vr4xnSDxMaL';
    this.logger.log(`Using voice ID: ${this.voiceId}`);

    this.client = new ElevenLabsClient({
      apiKey: apiKey || '',
    });
  }

  async synthesizeSpeech(script: string): Promise<AudioResult> {
    this.logger.log('Synthesizing speech with ElevenLabs');
    this.logger.log(`Script length: ${script.length} characters, ${script.split(/\s+/).length} words`);
    
    try {
      // Validate input
      if (!script || script.trim().length === 0) {
        throw new Error('Script cannot be empty');
      }

      // Use configured voice ID
      this.logger.log(`Using voice: ${this.voiceId}`);
      this.logger.log(`Calling ElevenLabs API...`);
      
      // Generate speech using ElevenLabs
      const audioStream = await this.client.textToSpeech.convert(this.voiceId, {
        text: script,
        modelId: 'eleven_turbo_v2', // Fast model for demo purposes
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
        },
      });

      this.logger.log(`Audio stream received, converting to buffer...`);

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(Buffer.from(chunk));
      }
      const audioBuffer = Buffer.concat(chunks);

      this.logger.log(`Buffer created. Size: ${audioBuffer.length} bytes`);

      // Estimate duration based on word count (average speaking rate: 150 words/minute)
      const wordCount = script.split(/\s+/).length;
      const estimatedDuration = Math.ceil((wordCount / 150) * 60); // in seconds

      this.logger.log(`Audio synthesis complete. Buffer size: ${audioBuffer.length} bytes, Estimated duration: ${estimatedDuration}s`);

      return {
        audioBuffer,
        duration: estimatedDuration,
      };
    } catch (error) {
      this.logger.error('Failed to synthesize speech with ElevenLabs');
      this.logger.error(`Error type: ${error.constructor.name}`);
      this.logger.error(`Error message: ${error.message}`);
      this.logger.error(`Full error:`, error);
      
      // Handle synthesis failures gracefully
      // Re-throw with a more user-friendly message
      if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        throw new Error('ElevenLabs rate limit exceeded. Please try again later.');
      } else if (error.message?.includes('authentication') || error.message?.includes('API key')) {
        throw new Error('ElevenLabs authentication failed. Please check API key configuration.');
      } else if (error.message?.includes('Script cannot be empty')) {
        throw error; // Re-throw validation errors as-is
      } else {
        throw new Error(`Audio synthesis failed: ${error.message || 'Unknown error'}`);
      }
    }
  }
}
