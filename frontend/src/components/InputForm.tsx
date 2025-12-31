'use client';

import { useState, FormEvent } from 'react';

interface InputFormProps {
  onSubmit: (articleText: string, designBrief: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  initialArticleText?: string;
  initialDesignBrief?: string;
}

interface ValidationErrors {
  articleText?: string;
  designBrief?: string;
}

export default function InputForm({ 
  onSubmit, 
  isLoading, 
  error,
  initialArticleText = '',
  initialDesignBrief = ''
}: InputFormProps) {
  const [articleText, setArticleText] = useState(initialArticleText);
  const [designBrief, setDesignBrief] = useState(initialDesignBrief);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Calculate word count
  const wordCount = articleText.trim().split(/\s+/).filter(word => word.length > 0).length;
  const minWords = 100; // Approximately 500 characters
  const maxWords = 10000;

  const validateArticleText = (text: string): string | undefined => {
    if (!text.trim()) {
      return 'Article text is required';
    }

    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;

    if (words < minWords) {
      return `Article text must be at least ${minWords} words (currently ${words} words)`;
    }

    if (words > maxWords) {
      return `Article text must not exceed ${maxWords} words (currently ${words} words)`;
    }

    return undefined;
  };

  const validateDesignBrief = (brief: string): string | undefined => {
    if (!brief.trim()) {
      return 'Design brief is required';
    }

    if (brief.trim().length < 10) {
      return 'Design brief must be at least 10 characters';
    }

    return undefined;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate inputs
    const errors: ValidationErrors = {};
    const textError = validateArticleText(articleText);
    const briefError = validateDesignBrief(designBrief);

    if (textError) {
      errors.articleText = textError;
    }
    if (briefError) {
      errors.designBrief = briefError;
    }

    setValidationErrors(errors);

    // If there are validation errors, don't submit
    if (Object.keys(errors).length > 0) {
      return;
    }

    // Submit the form
    await onSubmit(articleText, designBrief);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* API error message - more prominent display */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 border-l-4 border-red-500 shadow-sm animate-shake">
          <div className="flex items-start">
            <div className="shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <p className="mt-2 text-xs text-red-600">
                Your form data has been preserved. You can modify it and try again.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Article Text Input */}
      <div className="group">
        <label
          htmlFor="articleText"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Article or Writeup Text
        </label>
        <textarea
          id="articleText"
          value={articleText}
          onChange={(e) => {
            setArticleText(e.target.value);
            // Clear validation error when user starts typing
            if (validationErrors.articleText) {
              setValidationErrors((prev) => ({ ...prev, articleText: undefined }));
            }
          }}
          disabled={isLoading}
          placeholder="Paste an article, blog post, or writeup by the person (minimum 100 words)..."
          rows={12}
          className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-y transition-all duration-200 ${
            validationErrors.articleText 
              ? 'border-red-500 bg-red-50' 
              : 'border-gray-300 hover:border-gray-400 focus:shadow-lg'
          }`}
        />
        
        {/* Word count indicator */}
        <div className="mt-2 flex justify-between items-center text-sm">
          <span className={`font-medium ${
            wordCount >= minWords 
              ? 'text-green-600' 
              : wordCount > 0 
              ? 'text-amber-600' 
              : 'text-gray-500'
          }`}>
            {wordCount} words
            {wordCount >= minWords && (
              <svg className="inline w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </span>
          <span className="text-gray-400">
            Minimum: {minWords} words
          </span>
        </div>

        {validationErrors.articleText && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-slide-down">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {validationErrors.articleText}
          </p>
        )}
        
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Paste an article, blog post, or any written content by the person you want to create a persona for.
        </p>
      </div>

      {/* Design Brief Textarea */}
      <div className="group">
        <label
          htmlFor="designBrief"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Design Brief
        </label>
        <textarea
          id="designBrief"
          value={designBrief}
          onChange={(e) => {
            setDesignBrief(e.target.value);
            // Clear validation error when user starts typing
            if (validationErrors.designBrief) {
              setValidationErrors((prev) => ({ ...prev, designBrief: undefined }));
            }
          }}
          disabled={isLoading}
          placeholder="Describe your design problem, goals, constraints, and medium..."
          rows={6}
          className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-y transition-all duration-200 ${
            validationErrors.designBrief 
              ? 'border-red-500 bg-red-50' 
              : 'border-gray-300 hover:border-gray-400 focus:shadow-lg'
          }`}
        />
        {validationErrors.designBrief && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-slide-down">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {validationErrors.designBrief}
          </p>
        )}
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Minimum 10 characters. Be specific about your design goals and constraints.
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Persona...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate Persona
          </span>
        )}
      </button>

      {/* About and Contact Sections */}
      <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
        {/* About Section */}
        <div className="group">
          <button
            type="button"
            onClick={() => {
              const aboutSection = document.getElementById('about-section');
              if (aboutSection) {
                aboutSection.classList.toggle('hidden');
              }
            }}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            About Personification
          </button>
          <div id="about-section" className="hidden mt-3 pl-7 text-sm text-gray-600 space-y-2 animate-slide-down">
            <p>
              Personification transforms written content into actionable designer personas using AI. 
              By analyzing articles, blog posts, or any written work, we extract professional insights 
              and communication patterns to help you design better experiences.
            </p>
            <p className="font-medium text-gray-700">
              How it works:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Paste an article or writeup by your target user</li>
              <li>Describe your design brief and goals</li>
              <li>Get an AI-generated persona with design guidance</li>
              <li>Listen to an audio briefing for quick insights</li>
            </ul>
          </div>
        </div>

        {/* Contact Section */}
        <div className="group">
          <button
            type="button"
            onClick={() => {
              const contactSection = document.getElementById('contact-section');
              if (contactSection) {
                contactSection.classList.toggle('hidden');
              }
            }}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact & Support
          </button>
          <div id="contact-section" className="hidden mt-3 pl-7 text-sm text-gray-600 space-y-2 animate-slide-down">
            <p>
              Have questions, feedback, or need help? We'd love to hear from you!
            </p>
            <div className="space-y-2">
              <a 
                href="mailto:support@personification.ai" 
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                support@personification.ai
              </a>
              <a 
                href="https://github.com/yourusername/personification" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                GitHub Repository
              </a>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
