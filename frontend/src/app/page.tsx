'use client';

import { useState } from 'react';
import InputForm from '@/components/InputForm';
import LoadingIndicator from '@/components/LoadingIndicator';
import PersonaCard from '@/components/PersonaCard';
import DesignGuidance from '@/components/DesignGuidance';
import AudioBriefing from '@/components/AudioBriefing';
import { GeneratePersonaResponse, PipelineStep } from '@/types/persona';
import { generatePersona, ApiError } from '@/lib/api-client';

interface PageState {
  articleText: string;
  designBrief: string;
  isLoading: boolean;
  currentStep: PipelineStep;
  persona: GeneratePersonaResponse | null;
  error: string | null;
}

export default function PersonaGeneratorPage() {
  const [state, setState] = useState<PageState>({
    articleText: '',
    designBrief: '',
    isLoading: false,
    currentStep: 'idle',
    persona: null,
    error: null,
  });

  const handleSubmit = async (articleText: string, designBrief: string) => {
    // Reset state and start loading
    setState({
      articleText,
      designBrief,
      isLoading: true,
      currentStep: 'scraping',
      persona: null,
      error: null,
    });

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Simulate progress through pipeline steps
      // In a real implementation, you might use WebSockets or polling for real-time updates
      progressInterval = setInterval(() => {
        setState((prev) => {
          if (prev.currentStep === 'scraping') return { ...prev, currentStep: 'analyzing' };
          if (prev.currentStep === 'analyzing') return { ...prev, currentStep: 'generating' };
          if (prev.currentStep === 'generating') return { ...prev, currentStep: 'synthesizing' };
          return prev;
        });
      }, 3000);

      // Call the API
      const result = await generatePersona(articleText, designBrief);

      // Clear the progress interval
      clearInterval(progressInterval);

      // Update state with result
      setState({
        articleText,
        designBrief,
        isLoading: false,
        currentStep: 'complete',
        persona: result,
        error: null,
      });
    } catch (error) {
      // Clear the progress interval on error
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      // Handle errors with user-friendly messages
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error instanceof ApiError) {
        // Use the API error message directly (already user-friendly from backend)
        errorMessage = error.message;
        
        // Add additional context for specific error codes
        if (error.code === 'NETWORK_ERROR') {
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
          errorMessage = 'Rate limit exceeded. Please wait a few minutes and try again.';
        } else if (error.code === 'SERVICE_UNAVAILABLE' || error.code === 'SERVICE_AUTH_FAILED') {
          errorMessage = 'AI service temporarily unavailable. Please try again in a few moments.';
        } else if (error.code === 'VALIDATION_ERROR') {
          errorMessage = 'Please ensure your article text is at least 500 characters and your design brief is at least 10 characters.';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Preserve form data on error for retry
      setState((prev) => ({
        ...prev,
        articleText, // Preserve the submitted text
        designBrief, // Preserve the submitted brief
        isLoading: false,
        currentStep: 'idle',
        error: errorMessage,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8 sm:mb-12 text-center animate-fade-in">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-3 sm:mb-4">
            Personification
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Transform articles and writeups into actionable designer personas with AI-powered insights
          </p>
        </header>

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl">
          {/* Input Form */}
          {state.currentStep === 'idle' || state.isLoading ? (
            <div className="animate-slide-up">
              <InputForm
                onSubmit={handleSubmit}
                isLoading={state.isLoading}
                error={state.error}
                initialArticleText={state.articleText}
                initialDesignBrief={state.designBrief}
              />

              {/* Loading Indicator */}
              {state.isLoading && state.currentStep !== 'idle' && (
                <div className="animate-fade-in">
                  <LoadingIndicator currentStep={state.currentStep as 'scraping' | 'analyzing' | 'generating' | 'synthesizing'} />
                </div>
              )}
            </div>
          ) : null}

          {/* Results */}
          {state.currentStep === 'complete' && state.persona && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                    Persona Generated
                  </h2>
                  <p className="text-sm text-gray-500">
                    Ready to guide your design decisions
                  </p>
                </div>
                <button
                  onClick={() =>
                    setState({
                      articleText: '',
                      designBrief: '',
                      isLoading: false,
                      currentStep: 'idle',
                      persona: null,
                      error: null,
                    })
                  }
                  className="px-5 py-2.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300 hover:shadow-sm"
                >
                  ← Generate Another
                </button>
              </div>

              {/* Persona Card */}
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <PersonaCard persona={state.persona.persona} />
              </div>

              {/* Design Guidance */}
              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <DesignGuidance guidance={state.persona.persona.designGuidance} />
              </div>

              {/* Audio Briefing */}
              <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <AudioBriefing
                  audioUrl={state.persona.audioUrl}
                  transcript={state.persona.audioScript}
                  autoPlay={true}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500 animate-fade-in">
          <p className="flex items-center justify-center gap-2 flex-wrap">
            <span>Powered by</span>
            <span className="font-medium text-blue-600">Google Vertex AI (Gemini)</span>
            <span>and</span>
            <span className="font-medium text-purple-600">ElevenLabs</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
