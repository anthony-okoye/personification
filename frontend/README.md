# Personification Frontend

Next.js frontend for AI-powered persona generation. Beautiful, responsive interface for transforming articles into actionable designer personas.

## Features

- 📝 Article text input with validation (minimum 100 words)
- 🎯 Design brief input
- 🎨 Beautiful, responsive UI with Tailwind CSS
- 🔄 Real-time loading indicators with pipeline progress
- 🎭 Persona card with professional insights
- 📋 Design guidance (do's and don'ts)
- 🎙️ Audio briefing with playback controls
- ℹ️ About and Contact sections
- ✨ Auto-play audio on completion
- 🚨 Comprehensive error handling

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (recommended)

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Configure environment (see below)
# Create frontend/.env

# Start development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables

Create `frontend/.env`:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# For production, use your Cloud Run URL:
# NEXT_PUBLIC_API_URL=https://your-backend-url.run.app
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main persona generator page
│   │   ├── layout.tsx         # Root layout with metadata
│   │   └── globals.css        # Global styles and Tailwind
│   ├── components/
│   │   ├── InputForm.tsx      # Article & brief input form
│   │   ├── LoadingIndicator.tsx    # Pipeline progress indicator
│   │   ├── PersonaCard.tsx    # Persona display card
│   │   ├── DesignGuidance.tsx # Design do's and don'ts
│   │   └── AudioBriefing.tsx  # Audio player with controls
│   ├── lib/
│   │   └── api-client.ts      # Backend API client
│   └── types/
│       └── persona.ts         # TypeScript type definitions
├── public/                    # Static assets
└── .env                      # Environment configuration
```

## Components

### InputForm
Article text and design brief input with validation.

**Features:**
- Word count indicator (minimum 100 words)
- Real-time validation
- Inline error messages
- About and Contact sections (collapsible)

### LoadingIndicator
Visual progress through the AI pipeline.

**Pipeline Steps:**
1. Scraping - Analyzing article text
2. Analyzing - Extracting professional insights
3. Generating - Creating persona
4. Synthesizing - Generating audio briefing

### PersonaCard
Displays the generated persona with professional context.

**Sections:**
- Persona name and summary
- Professional context (role, industry, seniority)
- Communication style (tone, verbosity)
- Design biases (visual style, UX priority)
- Content biases (responds to, avoids)
- Brief conflicts

### DesignGuidance
Actionable design recommendations.

**Sections:**
- Do: Specific recommendations
- Avoid: Things to avoid

### AudioBriefing
Audio player with transcript.

**Features:**
- Play/pause controls
- Progress bar with seek
- Replay button
- Transcript toggle
- Auto-play on completion

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Deployment

### Vercel (Recommended)

1. **Connect GitHub repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Select the `frontend` folder as root directory

2. **Configure environment variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.run.app
   ```

3. **Deploy**
   - Vercel automatically deploys on push to main
   - Preview deployments for pull requests

### Manual Deployment

```bash
# Build
npm run build

# The output is in .next/ folder
# Deploy to any static hosting service
```

## API Integration

The frontend communicates with the backend via REST API:

```typescript
// src/lib/api-client.ts
export async function generatePersona(
  articleText: string,
  designBrief: string
): Promise<GeneratePersonaResponse>
```

**Error Handling:**
- Network errors
- API errors with user-friendly messages
- Validation errors
- Timeout handling

## Validation Rules

### Article Text
- Minimum 100 words
- Maximum 10,000 words
- Cannot be empty or whitespace-only

### Design Brief
- Minimum 10 characters
- Cannot be empty or whitespace-only

## Styling

Built with Tailwind CSS for responsive, modern design.

**Key Features:**
- Responsive layout (mobile-first)
- Gradient backgrounds
- Smooth animations
- Accessible color contrast
- Loading states
- Error states

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Server-side rendering with Next.js
- Optimized images
- Code splitting
- Fast page loads

## Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast compliance

## Troubleshooting

### API Connection Issues
- Check `NEXT_PUBLIC_API_URL` in `.env`
- Verify backend is running
- Check CORS configuration in backend

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (18+ required)

### Styling Issues
- Ensure Tailwind CSS is properly configured
- Check `tailwind.config.ts`
- Verify `globals.css` imports Tailwind directives

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001` |

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Support

For issues or questions:
- Check the main project README
- Review deployment guides in project root
- Check Next.js documentation: https://nextjs.org/docs

## License

UNLICENSED
