# Personification Backend

NestJS backend service for AI-powered persona generation. Transforms articles and writeups into actionable designer personas with audio briefings.

## Features

- 🤖 AI-powered persona generation using Google Vertex AI (Gemini)
- 🎙️ Audio briefing generation with ElevenLabs
- 📝 Article text analysis and professional insights extraction
- 📊 Design guidance and recommendations
- 🐳 Docker support with Cloud Run deployment
- ☁️ CI/CD ready with automatic deployments

## Tech Stack

- **Framework**: NestJS (Node.js)
- **AI**: Google Vertex AI (Gemini 1.5 Flash)
- **Audio**: ElevenLabs Text-to-Speech
- **Web Scraping**: Firecrawl (optional)
- **Runtime**: Node.js 20
- **Deployment**: Docker + Google Cloud Run

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Configure environment variables (see below)
# Edit backend/.env with your API keys

# Start development server
npm run start:dev

# Server runs on http://localhost:3001
```

### Docker

```bash
# From project root
docker-compose up --build

# Test
curl http://localhost:3001/health
```

## Environment Variables

Create or edit `backend/.env`:

```env
# Google Cloud / Vertex AI
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# ElevenLabs API
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# Firecrawl API
FIRECRAWL_API_KEY=your-firecrawl-api-key

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Health Check
```bash
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2025-12-31T...",
  "uptime": 123.45
}
```

### Generate Persona
```bash
POST /persona/generate
Content-Type: application/json

{
  "articleText": "Article or writeup text (minimum 100 words)...",
  "designBrief": "Design brief description..."
}

Response:
{
  "persona": {
    "personaName": "The Pragmatic Enterprise Leader",
    "summary": "...",
    "professionalContext": { ... },
    "communicationStyle": { ... },
    "designBiases": { ... },
    "contentBiases": { ... },
    "briefConflicts": [...],
    "designGuidance": {
      "do": [...],
      "avoid": [...]
    }
  },
  "audioUrl": "https://...",
  "audioScript": "..."
}
```

## Project Structure

```
backend/
├── src/
│   ├── app.module.ts              # Main application module
│   ├── main.ts                    # Application entry point
│   ├── gemini/                    # Vertex AI integration
│   │   └── gemini.service.ts      # Gemini API client
│   ├── elevenlabs/                # Audio generation
│   │   └── elevenlabs.service.ts  # ElevenLabs TTS client
│   ├── linkedin/                  # Web scraping (optional)
│   │   └── linkedin.service.ts    # Firecrawl integration
│   └── persona-pipeline/          # Main persona generation logic
│       ├── persona-pipeline.controller.ts
│       ├── persona-pipeline.service.ts
│       └── dto/                   # Data Transfer Objects
├── test/                          # E2E tests
├── Dockerfile                     # Production Docker image
└── .env                          # Environment configuration
```

## Development

```bash
# Run in development mode (hot reload)
npm run start:dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build

# Run production build
npm run start:prod

# Lint code
npm run lint

# Format code
npm run format
```

## Docker

### Build Image
```bash
# From backend folder
docker build -t personification-backend .

# Or from project root with docker-compose
docker-compose build backend
```

### Run Container
```bash
docker run -p 3001:3001 \
  --env-file .env \
  personification-backend
```

## Deployment

### Cloud Run (Recommended)

See the root project README for complete deployment instructions.

**Quick deploy:**
```bash
# From project root
# Windows
.\setup-cloud-run.ps1

# Linux/Mac
./setup-cloud-run.sh
```

**Manual deployment:**
```bash
# Build and push
docker build -t gcr.io/$PROJECT_ID/personification-backend .
docker push gcr.io/$PROJECT_ID/personification-backend

# Deploy to Cloud Run
gcloud run deploy personification-backend \
  --image gcr.io/$PROJECT_ID/personification-backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated
```

### CI/CD

Automatic deployment is configured via `cloudbuild.yaml` in the project root. 

Every push to `main` that changes files in `backend/` triggers:
1. Docker image build
2. Push to Container Registry
3. Deploy to Cloud Run

See `DEPLOYMENT_GUIDE.md` for setup instructions.

## Monitoring

### Local Logs
```bash
npm run start:dev
```

### Cloud Run Logs
```bash
# Recent logs
gcloud run services logs read personification-backend --region us-central1 --limit 50

# Stream logs
gcloud run services logs tail personification-backend --region us-central1
```

### Health Check
```bash
# Local
curl http://localhost:3001/health

# Cloud Run
curl https://your-service-url.run.app/health
```

## Troubleshooting

### Gemini API Timeout
- Timeout is set to 30 seconds in `gemini.service.ts`
- Check network connectivity
- Verify service account permissions for Vertex AI

### ElevenLabs API Errors
- Verify API key is valid
- Check quota limits in ElevenLabs dashboard
- Ensure voice ID is correct

### Docker Build Issues
- Clear Docker cache: `docker system prune -a`
- Check `.dockerignore` file
- Verify all dependencies are in `package.json`

### Cloud Run Deployment Issues
- Check service logs: `gcloud run services logs read personification-backend`
- Verify secrets are created in Secret Manager
- Ensure service account has proper IAM roles

## API Rate Limits

- **Vertex AI (Gemini)**: Based on your GCP quota
- **ElevenLabs**: Based on your subscription plan
- **Firecrawl**: Based on your subscription plan

## Cost Optimization

- Cloud Run scales to zero when idle (no cost)
- Use `--min-instances 0` to minimize costs
- Monitor usage in GCP Console
- Set up budget alerts

## Support

For deployment help, see:
- **../DEPLOYMENT_GUIDE.md** - Comprehensive deployment guide
- **../CLOUD_RUN_QUICK_START.md** - Quick reference commands
- **../DEPLOYMENT_SUMMARY.md** - Quick start guide

## License

UNLICENSED
