import { Injectable, Logger } from '@nestjs/common';
import { VertexAI } from '@google-cloud/vertexai';
import { ConfigService } from '@nestjs/config';
import { LinkedInProfile } from '../linkedin/linkedin.service';

export interface ProfileAnalysis {
  professionalContext: {
    role: string;
    industry: string;
    seniority: string;
  };
  communicationStyle: {
    tone: string;
    verbosity: 'low' | 'medium' | 'high';
  };
  inferredDesignPreferences: {
    visualStyle: string;
    uxPriority: string;
  };
  inferredContentPreferences: {
    respondsTo: string[];
    avoids: string[];
  };
}

export interface PersonaResult {
  personaName: string;
  summary: string;
  professionalContext: {
    role: string;
    industry: string;
    seniority: string;
  };
  communicationStyle: {
    tone: string;
    verbosity: 'low' | 'medium' | 'high';
  };
  designBiases: {
    visualStyle: string;
    uxPriority: string;
  };
  contentBiases: {
    respondsTo: string[];
    avoids: string[];
  };
  briefConflicts: string[];
  designGuidance: {
    do: string[];
    avoid: string[];
  };
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly vertexAI: VertexAI;

  constructor(private configService: ConfigService) {
    const projectId = this.configService.get<string>('GOOGLE_CLOUD_PROJECT_ID');
    const location = this.configService.get<string>('GOOGLE_CLOUD_LOCATION') || 'us-central1';
    
    if (!projectId) {
      this.logger.warn('GOOGLE_CLOUD_PROJECT_ID not configured');
    }

    this.vertexAI = new VertexAI({
      project: projectId || '',
      location: location,
    });
  }

  async analyzeProfile(profile: LinkedInProfile): Promise<ProfileAnalysis> {
    this.logger.log('Analyzing LinkedIn profile with Gemini');
    
    try {
      // Get the generative model
      const model = this.vertexAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
      });

      // Construct the prompt for profile analysis
      const prompt = this.buildProfileAnalysisPrompt(profile);

      // Generate content with timeout handling
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Gemini API timeout')), 30000)
        ),
      ]) as any;

      const response = result.response;
      const text = response.candidates[0].content.parts[0].text;

      // Parse the JSON response
      const analysis = this.parseProfileAnalysis(text);
      
      this.logger.log('Successfully analyzed profile');
      return analysis;
      
    } catch (error) {
      this.logger.error(`Error analyzing profile with Gemini: ${error.message}`, error.stack);
      
      // Handle specific error cases
      if (error.message?.includes('timeout')) {
        throw new Error('Gemini API timeout. Please try again.');
      }
      
      if (error.message?.includes('API key') || error.message?.includes('authentication')) {
        throw new Error('Invalid Gemini API credentials. Please check your configuration.');
      }
      
      if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        throw new Error('Gemini API rate limit exceeded. Please try again later.');
      }
      
      // Re-throw with context
      throw new Error(`Failed to analyze profile: ${error.message}`);
    }
  }

  /**
   * Analyze article/writeup text to extract professional insights about the author
   * @param articleText The article or writeup text to analyze
   * @returns ProfileAnalysis with inferred professional context and preferences
   */
  async analyzeArticleText(articleText: string): Promise<ProfileAnalysis> {
    this.logger.log('Analyzing article text with Gemini');
    
    try {
      // Get the generative model
      const model = this.vertexAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
      });

      // Construct the prompt for article analysis
      const prompt = `Analyze this article/writeup and extract professional insights about the author.

Article Text:
${articleText}

Based on the writing style, content, topics, and tone, infer the following about the author:

1. Professional Role: What role/position does this person likely hold? (e.g., "Senior Product Designer", "Software Engineer", "Marketing Director")
2. Industry: What industry do they work in? (e.g., "Technology", "Healthcare", "Finance")
3. Seniority Level: What is their likely seniority? Choose from: "Junior", "Mid-level", "Senior", "Executive", "Expert"
4. Communication Style:
   - Tone: How do they communicate? (e.g., "Professional and formal", "Casual and conversational", "Technical and precise")
   - Verbosity: How detailed are they? Choose from: "low" (concise), "medium" (balanced), "high" (detailed)
5. Expertise Areas: What topics do they demonstrate expertise in? List 3-5 areas.
6. Design/Content Preferences (infer from their writing):
   - Visual style preferences: What design aesthetic might they prefer? (e.g., "Clean and minimal", "Bold and colorful")
   - UX priority: What UX aspects might they value? (e.g., "Simplicity and clarity", "Feature-rich functionality")
   - Content they likely engage with: What types of content would resonate? (e.g., "Data-driven insights", "Storytelling")
   - Topics they might avoid: What might not interest them? (e.g., "Overly technical jargon", "Superficial content")

IMPORTANT RULES:
- Base your analysis ONLY on what's evident in the writing
- Be specific and actionable
- For verbosity, use only: "low", "medium", or "high"
- Do not make psychological inferences or sensitive personal assessments

Return ONLY valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{
  "professionalContext": {
    "role": "string",
    "industry": "string",
    "seniority": "string"
  },
  "communicationStyle": {
    "tone": "string",
    "verbosity": "low" | "medium" | "high"
  },
  "inferredDesignPreferences": {
    "visualStyle": "string",
    "uxPriority": "string"
  },
  "inferredContentPreferences": {
    "respondsTo": ["string", "string", "string"],
    "avoids": ["string", "string"]
  }
}`;

      // Generate content with timeout handling
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Gemini API timeout')), 30000)
        ),
      ]) as any;

      const response = result.response;
      const text = response.candidates[0].content.parts[0].text;

      // Parse the JSON response
      const analysis = this.parseProfileAnalysis(text);
      
      this.logger.log('Successfully analyzed article text');
      return analysis;
      
    } catch (error) {
      this.logger.error(`Error analyzing article text with Gemini: ${error.message}`, error.stack);
      
      // Handle specific error cases
      if (error.message?.includes('timeout')) {
        throw new Error('Gemini API timeout. Please try again.');
      }
      
      if (error.message?.includes('API key') || error.message?.includes('authentication')) {
        throw new Error('Invalid Gemini API credentials. Please check your configuration.');
      }
      
      if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        throw new Error('Gemini API rate limit exceeded. Please try again later.');
      }
      
      // Re-throw with context
      throw new Error(`Failed to analyze article text: ${error.message}`);
    }
  }

  private buildProfileAnalysisPrompt(profile: LinkedInProfile): string {
    return `Analyze this LinkedIn profile and extract professional and communication characteristics.

LinkedIn Profile Data:
Name: ${profile.name}
Headline: ${profile.headline}
${profile.currentPosition ? `Current Position: ${profile.currentPosition.title} at ${profile.currentPosition.company}` : ''}
${profile.summary ? `Summary: ${profile.summary}` : ''}

Past Positions:
${profile.pastPositions.map(p => `- ${p.title} at ${p.company} (${p.duration})`).join('\n')}

Education:
${profile.education.map(e => `- ${e.degree} in ${e.field} from ${e.school}`).join('\n')}

Skills: ${profile.skills.join(', ')}

Full Profile Markdown:
${profile.rawMarkdown}

Extract the following information and return it as valid JSON:

1. Professional context (role, industry, seniority level)
2. Communication style indicators (formal/casual tone, concise/verbose verbosity)
3. Inferred design preferences (visual style, UX priority) - only if reasonably supported by profile data
4. Inferred content preferences (topics they likely engage with, topics they avoid) - only if reasonably supported

IMPORTANT RULES:
- Only infer what is reasonably supported by the profile data
- Do not make psychological inferences or sensitive personal assessments
- For verbosity, use only: "low", "medium", or "high"
- Be specific and actionable in your inferences

Return ONLY valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{
  "professionalContext": {
    "role": "string describing their primary role",
    "industry": "string describing their industry",
    "seniority": "string describing their seniority level (e.g., Junior, Mid-level, Senior, Executive)"
  },
  "communicationStyle": {
    "tone": "string describing their communication tone (e.g., formal, casual, professional)",
    "verbosity": "low" | "medium" | "high"
  },
  "inferredDesignPreferences": {
    "visualStyle": "string describing inferred visual style preferences",
    "uxPriority": "string describing inferred UX priorities"
  },
  "inferredContentPreferences": {
    "respondsTo": ["array", "of", "topics", "they", "engage", "with"],
    "avoids": ["array", "of", "topics", "they", "avoid"]
  }
}`;
  }

  private parseProfileAnalysis(text: string): ProfileAnalysis {
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      const parsed = JSON.parse(cleanText);
      
      // Validate the structure
      if (!parsed.professionalContext || !parsed.communicationStyle || 
          !parsed.inferredDesignPreferences || !parsed.inferredContentPreferences) {
        throw new Error('Invalid profile analysis structure');
      }
      
      // Validate verbosity value
      const validVerbosity = ['low', 'medium', 'high'];
      if (!validVerbosity.includes(parsed.communicationStyle.verbosity)) {
        parsed.communicationStyle.verbosity = 'medium'; // Default fallback
      }
      
      return parsed as ProfileAnalysis;
      
    } catch (error) {
      this.logger.error(`Error parsing profile analysis: ${error.message}`);
      throw new Error(`Failed to parse Gemini response: ${error.message}`);
    }
  }

  private buildPersonaGenerationPrompt(analysis: ProfileAnalysis, designBrief: string): string {
    return `Given this profile analysis and design brief, generate a single actionable persona for designers.

Profile Analysis:
${JSON.stringify(analysis, null, 2)}

Design Brief:
${designBrief}

Generate a persona that:
1. Aligns the person's preferences with the design brief
2. Explicitly surfaces any conflicts between preferences and brief
3. Provides specific, actionable design guidance (do/avoid lists)
4. Focuses on helping designers make immediate decisions

IMPORTANT RULES:
- Create a descriptive persona name (e.g., "The Pragmatic Enterprise Leader", "The Creative Startup Founder")
- Write a concise summary (2-3 sentences) that captures the essence of this persona
- In briefConflicts, list any tensions between the person's preferences and the design brief requirements
- In designGuidance.do, provide 4-6 specific actionable recommendations
- In designGuidance.avoid, provide 4-6 specific things to avoid
- Be specific and actionable - designers should be able to use this immediately

Return ONLY valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{
  "personaName": "string - descriptive persona name",
  "summary": "string - 2-3 sentence summary of this persona",
  "professionalContext": {
    "role": "string",
    "industry": "string",
    "seniority": "string"
  },
  "communicationStyle": {
    "tone": "string",
    "verbosity": "low" | "medium" | "high"
  },
  "designBiases": {
    "visualStyle": "string",
    "uxPriority": "string"
  },
  "contentBiases": {
    "respondsTo": ["array", "of", "topics"],
    "avoids": ["array", "of", "topics"]
  },
  "briefConflicts": ["array", "of", "conflicts", "between", "preferences", "and", "brief"],
  "designGuidance": {
    "do": ["specific", "actionable", "recommendations"],
    "avoid": ["specific", "things", "to", "avoid"]
  }
}`;
  }

  private parsePersonaResult(text: string): PersonaResult {
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      const parsed = JSON.parse(cleanText);
      
      // Validate the structure - ensure all required fields are present
      const requiredFields = [
        'personaName',
        'summary',
        'professionalContext',
        'communicationStyle',
        'designBiases',
        'contentBiases',
        'briefConflicts',
        'designGuidance'
      ];
      
      for (const field of requiredFields) {
        if (!parsed[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      // Validate nested structures
      if (!parsed.professionalContext.role || !parsed.professionalContext.industry || !parsed.professionalContext.seniority) {
        throw new Error('Invalid professionalContext structure');
      }
      
      if (!parsed.communicationStyle.tone || !parsed.communicationStyle.verbosity) {
        throw new Error('Invalid communicationStyle structure');
      }
      
      if (!parsed.designBiases.visualStyle || !parsed.designBiases.uxPriority) {
        throw new Error('Invalid designBiases structure');
      }
      
      if (!Array.isArray(parsed.contentBiases.respondsTo) || !Array.isArray(parsed.contentBiases.avoids)) {
        throw new Error('Invalid contentBiases structure');
      }
      
      if (!Array.isArray(parsed.briefConflicts)) {
        throw new Error('briefConflicts must be an array');
      }
      
      if (!parsed.designGuidance.do || !parsed.designGuidance.avoid) {
        throw new Error('Invalid designGuidance structure');
      }
      
      if (!Array.isArray(parsed.designGuidance.do) || !Array.isArray(parsed.designGuidance.avoid)) {
        throw new Error('designGuidance.do and designGuidance.avoid must be arrays');
      }
      
      // Ensure do and avoid arrays are non-empty
      if (parsed.designGuidance.do.length === 0) {
        throw new Error('designGuidance.do must contain at least one item');
      }
      
      if (parsed.designGuidance.avoid.length === 0) {
        throw new Error('designGuidance.avoid must contain at least one item');
      }
      
      // Validate verbosity value
      const validVerbosity = ['low', 'medium', 'high'];
      if (!validVerbosity.includes(parsed.communicationStyle.verbosity)) {
        parsed.communicationStyle.verbosity = 'medium'; // Default fallback
      }
      
      return parsed as PersonaResult;
      
    } catch (error) {
      this.logger.error(`Error parsing persona result: ${error.message}`);
      throw new Error(`Failed to parse Gemini response: ${error.message}`);
    }
  }

  async generatePersona(
    analysis: ProfileAnalysis,
    designBrief: string,
  ): Promise<PersonaResult> {
    this.logger.log('Generating persona with Gemini');
    
    try {
      // Get the generative model
      const model = this.vertexAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
      });

      // Construct the prompt for persona generation
      const prompt = this.buildPersonaGenerationPrompt(analysis, designBrief);

      // Generate content with timeout handling
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Gemini API timeout')), 30000)
        ),
      ]) as any;

      const response = result.response;
      const text = response.candidates[0].content.parts[0].text;

      // Parse the JSON response
      const persona = this.parsePersonaResult(text);
      
      this.logger.log('Successfully generated persona');
      return persona;
      
    } catch (error) {
      this.logger.error(`Error generating persona with Gemini: ${error.message}`, error.stack);
      
      // Handle specific error cases
      if (error.message?.includes('timeout')) {
        throw new Error('Gemini API timeout. Please try again.');
      }
      
      if (error.message?.includes('API key') || error.message?.includes('authentication')) {
        throw new Error('Invalid Gemini API credentials. Please check your configuration.');
      }
      
      if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        throw new Error('Gemini API rate limit exceeded. Please try again later.');
      }
      
      // Re-throw with context
      throw new Error(`Failed to generate persona: ${error.message}`);
    }
  }

  async generateAudioScript(persona: PersonaResult): Promise<string> {
    this.logger.log('Generating audio script with Gemini');
    
    try {
      // Get the generative model
      const model = this.vertexAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
      });

      // Construct the prompt for audio script generation
      const prompt = this.buildAudioScriptPrompt(persona);

      // Generate content with timeout handling
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Gemini API timeout')), 30000)
        ),
      ]) as any;

      const response = result.response;
      const text = response.candidates[0].content.parts[0].text;

      // Clean up the script (remove any markdown or extra formatting)
      const script = this.cleanAudioScript(text);
      
      // Validate script length (110-150 words for 45-60 seconds)
      const wordCount = this.countWords(script);
      const charCount = script.length;
      
      this.logger.log(`Generated script: ${wordCount} words, ${charCount} characters`);
      
      // ElevenLabs has a character limit - enforce max 800 characters to be safe
      if (charCount > 800) {
        this.logger.warn(`Script too long (${charCount} chars). Truncating to 800 characters...`);
        const truncated = script.substring(0, 800).trim();
        // Try to end at a sentence
        const lastPeriod = truncated.lastIndexOf('.');
        const finalScript = lastPeriod > 600 ? truncated.substring(0, lastPeriod + 1) : truncated;
        this.logger.log(`Truncated script: ${this.countWords(finalScript)} words, ${finalScript.length} characters`);
        return finalScript;
      }
      
      if (wordCount < 110 || wordCount > 150) {
        this.logger.warn(`Generated script has ${wordCount} words, expected 110-150. Regenerating...`);
        
        // Try one more time with explicit word count instruction
        const retryPrompt = this.buildAudioScriptPrompt(persona, wordCount);
        const retryResult = await Promise.race([
          model.generateContent(retryPrompt),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Gemini API timeout')), 30000)
          ),
        ]) as any;
        
        const retryResponse = retryResult.response;
        const retryText = retryResponse.candidates[0].content.parts[0].text;
        const retryScript = this.cleanAudioScript(retryText);
        const retryWordCount = this.countWords(retryScript);
        const retryCharCount = retryScript.length;
        
        this.logger.log(`Retry generated script with ${retryWordCount} words, ${retryCharCount} characters`);
        
        // Check character limit on retry too
        if (retryCharCount > 800) {
          this.logger.warn(`Retry script too long (${retryCharCount} chars). Truncating...`);
          const truncated = retryScript.substring(0, 800).trim();
          const lastPeriod = truncated.lastIndexOf('.');
          const finalRetryScript = lastPeriod > 600 ? truncated.substring(0, lastPeriod + 1) : truncated;
          return finalRetryScript;
        }
        
        // Use retry script if it's better, otherwise use original
        const finalScript = (retryWordCount >= 110 && retryWordCount <= 150) ? retryScript : script;
        const finalWordCount = this.countWords(finalScript);
        
        this.logger.log(`Successfully generated audio script with ${finalWordCount} words`);
        return finalScript;
      }
      
      this.logger.log(`Successfully generated audio script with ${wordCount} words`);
      return script;
      
    } catch (error) {
      this.logger.error(`Error generating audio script with Gemini: ${error.message}`, error.stack);
      
      // Handle specific error cases
      if (error.message?.includes('timeout')) {
        throw new Error('Gemini API timeout. Please try again.');
      }
      
      if (error.message?.includes('API key') || error.message?.includes('authentication')) {
        throw new Error('Invalid Gemini API credentials. Please check your configuration.');
      }
      
      if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        throw new Error('Gemini API rate limit exceeded. Please try again later.');
      }
      
      // Re-throw with context
      throw new Error(`Failed to generate audio script: ${error.message}`);
    }
  }

  private buildAudioScriptPrompt(persona: PersonaResult, previousWordCount?: number): string {
    const wordCountGuidance = previousWordCount 
      ? `\nIMPORTANT: Your previous attempt had ${previousWordCount} words. Please adjust to be between 110-130 words exactly.`
      : '';

    return `Convert this persona into a 45-60 second spoken briefing for a designer.

Persona:
${JSON.stringify(persona, null, 2)}

CRITICAL Requirements:
- MAXIMUM 130 words (strictly enforce this limit!)
- MAXIMUM 700 characters total
- Write in second person (address the designer as "you")
- Use plain language without jargon
- Be action-oriented (focus on what the designer should do)
- Highlight the most important design considerations
- Mention any conflicts between the person's preferences and the brief
- Keep it conversational and natural for speech
- Target length: 110-130 words (for 45-60 seconds of speech at normal pace)
- Start with who this persona is, then move to actionable guidance${wordCountGuidance}

Return ONLY the script text with no additional formatting, markdown, or code blocks. Just the raw script that will be spoken.

REMEMBER: Keep it under 130 words and 700 characters!`;
  }

  private cleanAudioScript(text: string): string {
    // Remove markdown code blocks if present
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```[a-z]*\n?/g, '').replace(/```\n?/g, '');
    }
    
    // Remove any leading/trailing quotes
    cleanText = cleanText.replace(/^["']|["']$/g, '');
    
    // Normalize whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    return cleanText;
  }

  private countWords(text: string): number {
    // Split by whitespace and filter out empty strings
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
}
