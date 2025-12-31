# Personification

AI-powered persona generator that transforms articles and writeups into actionable designer personas with audio briefings.

## Overview

Personification analyzes written content to extract professional insights and communication patterns, helping designers create better user experiences. Simply paste an article or writeup, describe your design brief, and get:

- 🎭 **AI-Generated Persona** - Professional context, communication style, and preferences
- 📋 **Design Guidance** - Specific do's and don'ts for your design
- 🎙️ **Audio Briefing** - 45-60 second spoken summary for quick insights
- ⚡ **Fast Results** - Complete analysis in under 30 seconds

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    (Next.js + Vercel)                        │
│                                                              │
│  • Article text input                                       │
│  • Design brief input                                       │
│  • Persona display                                          │
│  • Audio player                                             │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│                  (NestJS + Cloud Run)                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Persona Pipeline Service                    │  │
│  │                                                        │  │
│  │  1. Analyze article text                             │  │
│  │  2. Generate persona                                  │  │
│  │  3. Create audio script                              │  │
│  │  4. Synthesize speech                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Services:                                                  │
│  • Gemini Service (Vertex AI)                              │
│  • ElevenLabs Service (TTS)                                │
│  • Firecrawl Service (Web scraping)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│                                                              │
│  • Google Vertex AI (Gemini 1.5 Flash)                     │
│  • ElevenLabs Text-to-Speech                               │
│  • Firecrawl Web Scraping                                  │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **AI**: Google Vertex AI (Gemini)
- **Audio**: ElevenLabs
- **Deployment**: Docker + Google Cloud Run

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Cloud account (for backend)
- API keys:
  - Google Cloud service account (Vertex AI)
  - ElevenLabs API key
  - Firecrawl API key

### Local Development

#### 1. Clone the repository

```bash
git clone https://github.com/your-username/personification.git
cd personification
```

#### 2. Set up Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run start:dev

# Backend runs on http://localhost:3001
```

#### 3. Set up Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env

# Start development server
npm run dev

# Frontend runs on http://localhost:3000
```

#### 4. Test the Application

Open http://localhost:3000 and:
1. Paste an article (minimum 100 words)
2. Enter a design brief
3. Click "Generate Persona"
4. View results and listen to audio briefing

## Docker Setup

### Local Testing with Docker Compose

```bash
# From project root
docker-compose up --build

# Test
curl http://localhost:3001/health
```

### Build for Production

```bash
# Build backend image
cd backend
docker build -t personification-backend .

# Or use docker-compose
docker-compose build backend
```

## Deployment

### Backend (Google Cloud Run)

#### Option 1: Automated Setup (Recommended)

**Windows:**
```powershell
.\setup-cloud-run.ps1
```

**Linux/Mac:**
```bash
chmod +x setup-cloud-run.sh
./setup-cloud-run.sh
```

#### Option 2: Manual Setup

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

**Quick commands:**
```bash
# 1. Set project
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# 2. Enable APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com

# 3. Create secrets
echo -n "your-key" | gcloud secrets create ELEVENLABS_API_KEY --data-file=-
echo -n "your-key" | gcloud secrets create FIRECRAWL_API_KEY --data-file=-

# 4. Deploy
gcloud run deploy personification-backend \
  --image gcr.io/$PROJECT_ID/personification-backend \
  --region us-central1
```

### Frontend (Vercel)

1. **Connect GitHub repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Set root directory to `frontend`

2. **Configure environment**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.run.app
   ```

3. **Deploy**
   - Automatic deployment on push to main

## CI/CD Setup

### Backend Auto-Deployment

1. **Push cloudbuild.yaml to GitHub**
   ```bash
   git add cloudbuild.yaml
   git commit -m "Add CI/CD configuration"
   git push origin main
   ```

2. **Create Cloud Build Trigger**
   - Go to: https://console.cloud.google.com/cloud-build/triggers
   - Click "Create Trigger"
   - Configure:
     - Name: `backend-deploy`
     - Event: Push to branch
     - Branch: `^main$`
     - Build config: `cloudbuild.yaml`
     - Included files: `backend/**`

3. **Test**
   ```bash
   # Make a backend change
   echo "// test" >> backend/src/main.ts
   git add backend/src/main.ts
   git commit -m "test: trigger deployment"
   git push origin main
   
   # Watch build
   gcloud builds list --limit=5
   ```

### Frontend Auto-Deployment

Vercel automatically deploys on push to main. No additional setup needed!

## Project Structure

```
personification/
├── backend/                    # NestJS backend
│   ├── src/
│   │   ├── gemini/            # Vertex AI integration
│   │   ├── elevenlabs/        # Text-to-speech
│   │   ├── linkedin/          # Web scraping
│   │   └── persona-pipeline/  # Main orchestration
│   ├── Dockerfile             # Production Docker image
│   └── .env                   # Environment config
│
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/               # Pages and layouts
│   │   ├── components/        # React components
│   │   ├── lib/               # API client
│   │   └── types/             # TypeScript types
│   └── .env                   # Environment config
│
├── docker-compose.yml          # Local development
├── cloudbuild.yaml            # CI/CD configuration
├── setup-cloud-run.ps1        # Automated setup (Windows)
├── setup-cloud-run.sh         # Automated setup (Linux/Mac)
├── DEPLOYMENT_GUIDE.md        # Comprehensive deployment guide
├── CLOUD_RUN_QUICK_START.md   # Quick reference
└── README.md                  # This file
```

## Environment Variables

### Backend (`backend/.env`)

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

### Frontend (`frontend/.env`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## API Documentation

### POST /persona/generate

Generate a persona from article text and design brief.

**Request:**
```json
{
  "articleText": "Article or writeup text (minimum 100 words)...",
  "designBrief": "Design brief description..."
}
```

**Response:**
```json
{
  "persona": {
    "personaName": "The Pragmatic Enterprise Leader",
    "summary": "...",
    "professionalContext": {
      "role": "Senior Product Designer",
      "industry": "Technology",
      "seniority": "Senior"
    },
    "communicationStyle": {
      "tone": "Professional and direct",
      "verbosity": "medium"
    },
    "designBiases": {
      "visualStyle": "Clean and minimal",
      "uxPriority": "Simplicity and clarity"
    },
    "contentBiases": {
      "respondsTo": ["Data-driven insights", "User research"],
      "avoids": ["Overly technical jargon", "Buzzwords"]
    },
    "briefConflicts": [
      "Prefers minimal design but brief requires rich visuals"
    ],
    "designGuidance": {
      "do": [
        "Use clean, minimal layouts",
        "Prioritize clarity over complexity"
      ],
      "avoid": [
        "Overly decorative elements",
        "Complex navigation patterns"
      ]
    }
  },
  "audioUrl": "https://...",
  "audioScript": "..."
}
```

## Cost Estimates

### Development (Local)
- **Cost**: $0 (runs on your machine)

### Production (Light Usage)
- **Cloud Run**: $0-5/month (scales to zero when idle)
- **Secret Manager**: ~$0.18/month (3 secrets)
- **Container Registry**: ~$0.10/month
- **Vertex AI (Gemini)**: Pay per token (~$0.01-0.10 per request)
- **ElevenLabs**: Based on your plan
- **Vercel (Frontend)**: Free tier (100GB bandwidth)

**Total**: ~$5-20/month for light usage

### Cost Optimization
- Cloud Run scales to zero (no cost when idle)
- Use `--min-instances 0`
- Set up budget alerts
- Monitor usage in GCP Console

## Monitoring

### Backend Logs

```bash
# Local
npm run start:dev

# Cloud Run
gcloud run services logs read personification-backend --region us-central1 --limit 50
gcloud run services logs tail personification-backend --region us-central1
```

### Health Checks

```bash
# Local
curl http://localhost:3001/health

# Cloud Run
curl https://your-service-url.run.app/health
```

### Metrics

Visit: https://console.cloud.google.com/run/detail/us-central1/personification-backend/metrics

## Troubleshooting

### Backend Issues

**Gemini API Timeout:**
- Timeout is set to 30 seconds
- Check network connectivity
- Verify service account permissions

**ElevenLabs API Errors:**
- Verify API key is valid
- Check quota limits

**Docker Build Issues:**
- Clear cache: `docker system prune -a`
- Check `.dockerignore`

### Frontend Issues

**API Connection:**
- Check `NEXT_PUBLIC_API_URL` in `.env`
- Verify backend is running
- Check CORS configuration

**Build Errors:**
- Clear `.next`: `rm -rf .next`
- Reinstall: `rm -rf node_modules && npm install`

## Documentation

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Comprehensive deployment guide
- [CLOUD_RUN_QUICK_START.md](CLOUD_RUN_QUICK_START.md) - Quick reference commands
- [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) - Quick start guide
- [backend/README.md](backend/README.md) - Backend documentation
- [frontend/README.md](frontend/README.md) - Frontend documentation

## Development Workflow

### Making Changes

```bash
# 1. Create a feature branch
git checkout -b feature/your-feature

# 2. Make changes
# Edit files...

# 3. Test locally
cd backend && npm run start:dev
cd frontend && npm run dev

# 4. Commit and push
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature

# 5. Create pull request
# GitHub will create preview deployments

# 6. Merge to main
# Automatic deployment to production!
```

### Testing

```bash
# Backend tests
cd backend
npm test
npm run test:e2e

# Frontend tests
cd frontend
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues or questions:
- Check documentation in project root
- Review deployment guides
- Check component READMEs

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [NestJS](https://nestjs.com/)
- [Google Vertex AI](https://cloud.google.com/vertex-ai)
- [ElevenLabs](https://elevenlabs.io/)
- [Tailwind CSS](https://tailwindcss.com/)
