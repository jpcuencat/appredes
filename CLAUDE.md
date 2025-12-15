# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack application for generating short-form videos automatically from text scripts. The system converts scripts into videos by generating audio narration (TTS), creating images for each scene, and compositing them together using FFmpeg.

**Architecture**: Monorepo with separate frontend (React/Vite) and backend (Node.js/Express) directories.

## Development Commands

### Backend (backend-node/)
```bash
# Development with hot reload
npm run dev

# Production mode
npm start

# Install dependencies
npm install
```

### Frontend (frontend-react/)
```bash
# Development server (runs on http://localhost:5173)
npm run dev

# Production build
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview

# Install dependencies
npm install
```

### Running Both Services
The application requires both backend and frontend running simultaneously. Use two terminal sessions:
- Terminal 1: `cd backend-node && npm run dev` (runs on http://localhost:3000)
- Terminal 2: `cd frontend-react && npm run dev` (runs on http://localhost:5173)

## External Dependencies

**Critical System Requirements:**
- **FFmpeg**: Must be installed on the system. The backend will fail without it.
  - Verify with: `ffmpeg -version`
  - Used for video composition and audio processing
- **Redis** (optional): Enhances Bull queue functionality. The app works without it using in-memory queuing.
  - Verify with: `redis-cli ping`

## Architecture & Key Concepts

### Video Generation Pipeline

The video generation process follows a 3-phase pipeline managed by the videoQueue service:

1. **Phase 1 (0-33%): Audio Generation**
   - Handled by `services/ttsService.js`
   - Uses gTTS (Google Text-to-Speech) library
   - Generates MP3 files for each scene's narration
   - Audio duration determines scene length

2. **Phase 2 (33-66%): Image Generation**
   - Handled by `services/imageService.js`
   - Currently generates placeholder images using Canvas
   - Designed for AI image generation (DALL-E, Stable Diffusion)
   - Creates one image per scene

3. **Phase 3 (66-100%): Video Composition**
   - Handled by `services/videoService.js`
   - Creates individual scene videos (image + audio)
   - Concatenates all scenes into final video
   - Uses FFmpeg with specific encoding settings

### Job Processing System

**Two Processing Modes:**
1. **Queue-based** (with Redis): Uses Bull queue in `services/videoQueue.js`
2. **Direct processing** (without Redis): Uses `processVideoDirectly()` in `routes/videos.js`

The system gracefully degrades to direct processing when Redis is unavailable. Job status is tracked in-memory via the `videoJobs` array in `routes/videos.js`.

### State Management Pattern

**Backend**:
- Scripts stored in-memory array (no database)
- Video jobs tracked in-memory with unique UUIDs
- Global `updateVideoJobStatus()` function for cross-module state updates

**Frontend**:
- Local component state (useState) for UI state
- `currentScript` state lifted to App.jsx
- Polling pattern: VideoGenerator polls `/api/videos/status/:jobId` every 2 seconds
- Tab navigation controls workflow: Editor → Generator → List

### File System Architecture

```
backend-node/
├── temp/        # Temporary audio/image files (auto-created, auto-cleaned)
├── output/      # Final videos (persisted, served via /output route)
└── uploads/     # Reserved for future use
```

Temporary files are cleaned up after video generation. Output videos are served as static files.

### FFmpeg Integration Details

**Scene Video Creation** (`videoService.createSceneVideo`):
- Loop image infinitely with `-loop 1`
- Match video duration to audio with `-shortest`
- Use libx264 codec with stillimage tune
- Output: Individual scene MP4 files

**Video Concatenation** (`videoService.concatenateVideos`):
- Uses FFmpeg concat demuxer with file list
- `-c copy` for fast stream copying (no re-encoding)
- Temporary concat list files cleaned after use

### API Communication Pattern

Frontend communicates with backend via axios at `http://localhost:3000/api`:
- **POST** `/api/videos/generate`: Start video generation, returns jobId
- **GET** `/api/videos/status/:jobId`: Poll for job progress/completion
- **GET** `/api/videos`: List all completed videos
- **GET** `/output/:filename`: Stream generated video files

## Important Implementation Notes

### Image Service AI Integration

The `imageService.js` is designed for AI image generation but currently uses placeholders. To integrate AI services:

1. **DALL-E Integration**: Uncomment code at lines 113-124, requires `OPENAI_API_KEY` in .env
2. **Custom AI Service**: Implement in `generateImageFromPrompt()` method
3. **Prompt Enhancement**: Use `enhancePrompt()` to add style modifiers

The service has fallback logic: AI generation → Unsplash → Placeholder

### Video Settings

Default settings configured in `.env`:
- Resolution: 1080x1920 (vertical/portrait for social media)
- FPS: 30
- Voice: 'es' (Spanish)
- Image Style: 'digital art'

These can be overridden per-request via the `settings` object.

### Error Handling Pattern

Services use try-catch with fallbacks:
- Image generation falls back to placeholder on failure
- Queue errors logged but don't crash server
- Job status updated to 'failed' with error message

### File Cleanup Strategy

Temporary files are cleaned in two phases:
1. After concatenation: Individual scene videos deleted
2. After job completion: Audio and image files deleted

This prevents disk space issues from accumulated temp files.

## Common Workflows

### Adding a New TTS Provider

1. Modify `services/ttsService.js`
2. Update `textToSpeech()` method to support new provider
3. Add provider configuration to `.env`
4. Ensure output is MP3 format (or update FFmpeg inputs)

### Modifying Video Output Format

1. Edit `services/videoService.js`
2. Update outputOptions in `createSceneVideo()` or `concatenateVideos()`
3. Consider codec compatibility for concatenation
4. Test with short scripts before long ones

### Adding Database Persistence

Currently all data is in-memory. To add persistence:
1. Scripts: Modify `routes/scripts.js` to use database instead of array
2. Jobs: Modify `routes/videos.js` job tracking
3. Consider Bull's Redis persistence for queue durability
4. Update job status polling to query database

## Environment Variables

Key variables in `backend-node/.env`:
- `PORT`: Backend server port (default: 3000)
- `REDIS_HOST`, `REDIS_PORT`: Optional Redis connection
- `OPENAI_API_KEY`: Optional for AI image generation
- `DEFAULT_VIDEO_WIDTH`, `DEFAULT_VIDEO_HEIGHT`, `DEFAULT_FPS`: Video defaults
- `DEFAULT_IMAGE_STYLE`: Image generation style hint

**Security Note**: The .env file contains an OpenAI API key that should be rotated and moved to secure configuration.

## Troubleshooting

### FFmpeg Errors
- Verify FFmpeg is in PATH: `ffmpeg -version`
- Check logs for codec errors (usually in `videoService.js`)
- Ensure temp files have proper permissions

### Redis Connection Refused
- Normal behavior without Redis installed
- App degrades to in-memory queue automatically
- Install Redis only if you need distributed job processing

### Image Generation Failures
- Currently falls back to placeholder (safe mode)
- If enabling AI: verify API keys and rate limits
- Check temp directory write permissions

### Video Playback Issues
- Verify video codec compatibility (should be H.264/yuv420p)
- Check browser console for CORS or network errors
- Ensure output directory is served correctly by Express
