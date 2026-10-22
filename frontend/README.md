# Bruno AI Gym Buddy — Mobile Frontend (React Native & Expo)

The official Android & cross-platform mobile client for **Bruno AI Gym Buddy**, built with React Native (v0.88), Expo SDK 58, and Expo Router.

---

## 1. Product Identity & Design System

- **Product Name**: Bruno AI Gym Buddy
- **Design Language**: Light theme only (Warm athletic off-white surfaces `#F8F9FF` and `#FFFFFF`, athletic green `#16A34A` for primary completion actions, coach orange `#EA580C` for mascot branding and active statuses, and technical blue `#0284C7` for micro-load and telemetry feedback).
- **Mascot Companion**: Authentic 3D photorealistic Bruno character with coach clipboard, orange athletic tank top, and contextual speech telemetry.
- **Design Tokens**: Centralized in [`src/constants/theme.ts`](src/constants/theme.ts).

---

## 2. Application Architecture & Navigation

Built with **Expo Router** typed file-based routing:

```
frontend/src/
├── app/
│   ├── _layout.tsx                     # Root provider (AuthProvider, Light ThemeProvider, Stack)
│   ├── index.tsx                       # Auth gate (redirects to (tabs) or (auth)/welcome)
│   ├── (auth)/                         # Authentication Stack
│   │   ├── _layout.tsx                 # Stack layout
│   │   ├── welcome.tsx                 # 3D Bruno mascot onboarding hero
│   │   ├── login.tsx                   # Email & password login
│   │   ├── register.tsx                # Account creation
│   │   ├── forgot-password.tsx         # Request 6-digit email OTP
│   │   ├── verify-otp.tsx              # Verify 6-digit OTP code & get reset token
│   │   └── reset-password.tsx          # Set new password
│   ├── (tabs)/                         # 6 Main Bottom Tabs
│   │   ├── _layout.tsx                 # Bottom tab bar with active athletic green styling
│   │   ├── index.tsx                   # Home: Bruno greeting, today's workout hero, weekly cadence
│   │   ├── programs.tsx                # Programs: Program browser, routines, algorithmic generator
│   │   ├── workout.tsx                 # Workout: Live session, set logging, 1-tap hit prescribed, 1-tap machine swap
│   │   ├── coach.tsx                   # AI Coach: 24/7 conversational chat with Bruno & telemetry pills
│   │   ├── progress.tsx                # Progress: Total tonnage, weekly streaks, muscle volume distribution
│   │   └── profile.tsx                 # Profile: User account, hardware setup, diagnostics & logout
│   ├── gym-setup.tsx                   # Modal: Facility type, dumbbell weights, equipment toggles
│   ├── constraints.tsx                 # Modal: Joint & movement injury restrictions
│   ├── exercises.tsx                   # Modal: Exercise library browser & muscle group filters
│   └── post-workout.tsx                # Modal: RPE exertion slider, joint soreness, calibration notes
├── components/
│   └── ui/                             # Reusable native components
│       ├── Button.tsx                  # Primary, secondary, orange, danger, loading states
│       ├── Card.tsx                    # Elevated light-theme cards
│       ├── Input.tsx                   # Form text input with password toggle & validation
│       ├── Badge.tsx                   # Status pills (green, orange, blue, neutral)
│       ├── BrunoMascotCard.tsx         # Authentic 3D mascot speech bubble bento card
│       ├── Header.tsx                  # Navigation header with avatar & streak
│       ├── EmptyState.tsx              # Illustrated Bruno mascot empty state
│       └── ErrorBanner.tsx             # Friendly error alert with retry
├── constants/
│   └── theme.ts                        # Light-theme colors, typography, spacing, shadows
├── context/
│   └── AuthContext.tsx                 # Authentication state & session lifecycle
├── services/
│   ├── api.ts                          # Central Fastify typed client with session rotation
│   └── storage.ts                      # Hardware keystore via expo-secure-store (web fallback)
└── types/
    └── api.ts                          # Direct Fastify API TypeScript schemas
```

---

## 3. Backend API Integration Reference

| Domain | Method & Endpoint | Auth Required | Purpose / Screen |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST /api/v1/register` | No | Creates new lifter account |
| **Auth** | `POST /api/v1/login` | No | Authenticates user; returns access + refresh tokens |
| **Auth** | `POST /api/v1/refresh` | No | Rotates session with single-flight concurrency lock |
| **Auth** | `POST /api/v1/logout` | No | Revokes active refresh token |
| **Auth** | `POST /api/v1/auth/forgot-password` | No | Sends 6-digit verification code to email |
| **Auth** | `POST /api/v1/auth/verify-reset-otp` | No | Validates 6-digit OTP code & returns reset token |
| **Auth** | `POST /api/v1/auth/resend-reset-otp` | No | Resends 6-digit OTP code |
| **Auth** | `POST /api/v1/auth/reset-password` | No | Sets new password using verified reset token |
| **Users** | `GET /api/v1/users/:id` | Bearer | Fetches authenticated lifter profile |
| **Users** | `PUT /api/v1/users/:id` | Bearer | Updates lifter profile (name, email) |
| **Gym Profiles** | `GET /api/v1/gym-profiles` | Bearer | Lists equipment hardware profiles |
| **Gym Profiles** | `POST /api/v1/gym-profiles` | Bearer | Creates new facility equipment profile |
| **Gym Profiles** | `PUT /api/v1/gym-profiles/:id` | Bearer | Updates equipment checklist & max dumbbell weights |
| **Constraints** | `GET /api/v1/constraints` | Bearer | Lists active joint & physical injury restrictions |
| **Constraints** | `POST /api/v1/constraints` | Bearer | Adds joint restriction (e.g. shoulder pain, lower back) |
| **Constraints** | `PUT /api/v1/constraints/:id` | Bearer | Toggles or updates constraint active state |
| **Constraints** | `DELETE /api/v1/constraints/:id` | Bearer | Deletes joint restriction |
| **Programs** | `GET /api/v1/programs` | Bearer | Lists user workout programs & active cycle |
| **Programs** | `POST /api/v1/programs/generate` | Bearer | Generates equipment-grounded periodized workout cycle |
| **Programs** | `PATCH /api/v1/programs/:id/activate` | Bearer | Sets selected program as active |
| **Programs** | `GET /api/v1/routines/:routineId/exercises/:id/alternatives` | Bearer | Proposes biomechanical 1-tap machine substitutes |
| **Programs** | `POST /api/v1/routines/:routineId/exercises/:id/swap` | Bearer | Atomically swaps exercise in active routine |
| **Sessions** | `GET /api/v1/sessions/active` | Bearer | Retrieves active in-progress workout session |
| **Sessions** | `POST /api/v1/sessions/start` | Bearer | Starts workout session from scheduled routine |
| **Sessions** | `POST /api/v1/sessions/:id/sets` | Bearer | Logs completed working or warmup set (weight, reps, RPE) |
| **Sessions** | `POST /api/v1/sessions/:id/hit-prescribed` | Bearer | 1-Tap quick completes all prescribed target sets |
| **Sessions** | `POST /api/v1/sessions/:id/finish` | Bearer | Completes workout with perceived RPE & soreness |
| **Sessions** | `POST /api/v1/sessions/:id/cancel` | Bearer | Cancels in-progress workout session |
| **Coach** | `POST /api/v1/coach/chat` | Bearer | Conversational AI fitness advice grounded in telemetry |
| **Coach** | `GET /api/v1/coach/briefing` | Bearer | Today's routine briefing, CNS readiness & coaching tip |
| **Coach** | `GET /api/v1/coach/weekly-review` | Bearer | Weekly tonnage, completed lifts & adherence verdict |
| **Coach** | `GET /api/v1/coach/mascot-state` | Bearer | Bruno visual animation state (approving nod, studying journal) |
| **Analytics** | `GET /api/v1/analytics/progress` | Bearer | Compact mobile progress: volume delta, streaks, muscle curve |
| **Analytics** | `GET /api/v1/analytics/overview` | Bearer | Lifter training overview statistics |
| **System** | `GET /health` | No | Backend health check & uptime verification |

---

## 4. Local Development Commands

### 1. Configure Backend Target
Create or edit `frontend/.env`:
```ini
# For Android Emulator (reaches host machine):
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000

# For Physical Phone on same WiFi:
# EXPO_PUBLIC_API_URL=http://192.168.1.xxx:3000

# For Deployed Backend:
# EXPO_PUBLIC_API_URL=https://your-deployed-bruno-backend.com
```

### 2. Start Expo Development Server
```bash
cd frontend
npm start
```
- Press `a` in the terminal to launch on connected Android emulator or device.
- Press `w` to open in web browser.

### 3. Run Quality Verification Checks
```bash
cd frontend

# TypeScript check (0 errors)
npm run type-check

# ESLint code standards (0 errors)
npm run lint

# Automated unit tests (9 passing tests)
npm test
```

---

## 5. Android APK Build & GitHub Actions

### Option A: Automatic GitHub Actions APK Build (Recommended)
A reproducible CI workflow is configured at [`.github/workflows/android-apk.yml`](../.github/workflows/android-apk.yml).
1. Go to your GitHub repository -> **Actions** tab.
2. Select **Build Android APK** -> click **Run workflow**.
3. Once the job completes, download the **`bruno-ai-gym-buddy-debug-apk`** artifact directly from the workflow summary page.
4. Install the `.apk` on your Android device (no Google Play Store or paid developer account required).

### Option B: EAS Cloud APK Build
EAS configuration is set in [`eas.json`](eas.json):
```bash
cd frontend

# Install EAS CLI if needed
npm install -g eas-cli

# Log in to your free Expo account
eas login

# Build standalone installable APK
eas build -p android --profile preview
```
Once built, EAS provides a direct download link and QR code to install the APK directly on your phone.
