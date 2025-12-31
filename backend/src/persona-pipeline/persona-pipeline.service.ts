import { Injectable, Logger } from '@nestjs/common';
import { LinkedInService } from '../linkedin/linkedin.service';
import { GeminiService, PersonaResult } from '../gemini/gemini.service';
import { ElevenLabsService } from '../elevenlabs/elevenlabs.service';

export interface PersonaGenerationResult {
  persona: PersonaResult;
  audioUrl: string;
  audioScript: string;
  processingTime: number;
}

@Injectable()
export class PersonaPipelineService {
  private readonly logger = new Logger(PersonaPipelineService.name);

  constructor(
    private linkedInService: LinkedInService,
    private geminiService: GeminiService,
    private elevenLabsService: ElevenLabsService,
  ) {}

  async generatePersona(
    articleText: string,
    designBrief: string,
  ): Promise<PersonaGenerationResult> {
    this.logger.log('Starting persona generation pipeline');
    const startTime = Date.now();

    try {
      // Step 1: Analyze article text with Gemini (replaces LinkedIn scraping + analysis)
      this.logger.log('Step 1/4: Analyzing article text with Gemini');
      const analysis = await this.retryWithBackoff(
        () => this.geminiService.analyzeArticleText(articleText),
        'Article text analysis',
      );
      this.logger.log('Article analysis complete');

      // Step 2: Generate persona with Gemini
      this.logger.log('Step 2/4: Generating persona with Gemini');
      const persona = await this.retryWithBackoff(
        () => this.geminiService.generatePersona(analysis, designBrief),
        'Persona generation',
      );
      this.logger.log(`Persona generated: ${persona.personaName}`);

      // Step 3: Generate audio script with Gemini
      this.logger.log('Step 3/4: Generating audio script with Gemini');
      const audioScript = await this.retryWithBackoff(
        () => this.geminiService.generateAudioScript(persona),
        'Audio script generation',
      );
      this.logger.log(`Audio script generated (${audioScript.split(/\s+/).length} words)`);

      // Step 4: Synthesize audio with ElevenLabs
      this.logger.log('Step 4/4: Synthesizing audio with ElevenLabs');
      let audioUrl = '';
      
      try {
        this.logger.log('Calling ElevenLabs service...');
        const audioResult = await this.retryWithBackoff(
          () => this.elevenLabsService.synthesizeSpeech(audioScript),
          'Audio synthesis',
        );
        
        this.logger.log(`Audio result received. Buffer size: ${audioResult.audioBuffer.length} bytes`);
        
        // Convert audio buffer to base64 data URL for immediate playback
        const base64Audio = audioResult.audioBuffer.toString('base64');
        this.logger.log(`Base64 conversion complete. Length: ${base64Audio.length} characters`);
        
        audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
        this.logger.log(`Audio URL created. Length: ${audioUrl.length} characters`);
        
        this.logger.log('Audio synthesis complete');
      } catch (audioError) {
        // If audio synthesis fails, log the error but continue
        // The text script will still be returned to the user
        this.logger.error(`Audio synthesis failed: ${audioError.message}`, audioError.stack);
        this.logger.error(`Full error object:`, JSON.stringify(audioError, null, 2));
        this.logger.warn('Continuing without audio - text script will be provided');
        audioUrl = ''; // Empty URL indicates audio synthesis failed
      }

      // Calculate total processing time
      const processingTime = Date.now() - startTime;
      this.logger.log(`Pipeline complete in ${processingTime}ms`);

      return {
        persona,
        audioUrl,
        audioScript,
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `Pipeline failed after ${processingTime}ms: ${error.message}`,
        error.stack,
      );
      
      // Re-throw with context about which step failed
      throw new Error(`Persona generation failed: ${error.message}`);
    }
  }

  /**
   * Retry a function with exponential backoff for transient errors
   * @param fn Function to retry
   * @param operationName Name of the operation for logging
   * @param maxRetries Maximum number of retries (default: 2)
   * @returns Result of the function
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    operationName: string,
    maxRetries: number = 2,
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Check if error is transient (worth retrying)
        const isTransient = this.isTransientError(error);
        
        // Don't retry on last attempt or if error is not transient
        if (attempt === maxRetries || !isTransient) {
          this.logger.error(
            `${operationName} failed after ${attempt + 1} attempt(s): ${error.message}`,
          );
          throw error;
        }
        
        // Calculate backoff delay: 1s, 2s, 4s, etc.
        const delay = Math.pow(2, attempt) * 1000;
        
        this.logger.warn(
          `${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}. Retrying in ${delay}ms...`,
        );
        
        // Wait before retrying
        await this.sleep(delay);
      }
    }
    
    // This should never be reached, but TypeScript needs it
    throw lastError || new Error(`${operationName} failed after all retries`);
  }

  /**
   * Determine if an error is transient and worth retrying
   * @param error The error to check
   * @returns true if the error is transient
   */
  private isTransientError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Transient errors that are worth retrying
    const transientPatterns = [
      'timeout',
      'network',
      'connection',
      'econnrefused',
      'enotfound',
      'etimedout',
      'socket hang up',
      'temporarily unavailable',
    ];
    
    // Check if error message contains any transient pattern
    const isTransient = transientPatterns.some(pattern => message.includes(pattern));
    
    // Don't retry rate limit errors, authentication errors, or validation errors
    const nonRetryablePatterns = [
      'rate limit',
      'quota',
      'authentication',
      'api key',
      'invalid',
      'not found',
      'private',
      'inaccessible',
      'validation',
    ];
    
    const isNonRetryable = nonRetryablePatterns.some(pattern => message.includes(pattern));
    
    return isTransient && !isNonRetryable;
  }

  /**
   * Sleep for a specified duration
   * @param ms Duration in milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
