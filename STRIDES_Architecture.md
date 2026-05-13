# STRIDES — Biomechanical Intelligence Platform
## Complete System Architecture v1.0
### Target: Google AI Studio (Gemini API) · Firebase · GCP

---

## 0. EXECUTIVE SUMMARY

STRIDES is a B2B/B2C sports biomechanics SaaS powered by the Gemini API. It processes kinematic data from athletes and coaches, cross-references it against elite benchmarks, and generates prescriptive technical reports via the STRIDES Biomechanical Engine (v1.5). The platform supports multi-role onboarding, biometric profiling, wearable/health app integration, and structured PB/PR tracking.

---

## 1. TECH STACK

| Layer | Technology | Rationale |
|---|---|---|
| AI Engine | Google AI Studio / Gemini 2.0 Flash | Native Google ecosystem; tool use, structured output, long context |
| Frontend | Next.js 15 (App Router) + TypeScript | SSR, React Server Components, strong typing |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI, accessible primitives |
| Auth | Firebase Authentication | Google, Apple, Microsoft (OIDC), SMS/OTP — all native |
| Database | Firestore (primary) + PostgreSQL via Cloud SQL (analytics) | Firestore: realtime + offline. PG: complex biomechanical queries |
| Storage | Google Cloud Storage | Video uploads, report PDFs |
| Functions | Cloud Functions (Gen 2) / Python FastAPI on Cloud Run | AI inference, webhook handlers, health data ingest |
| Messaging | Firebase Cloud Messaging | Push notifications |
| Secrets | Google Secret Manager | API keys, OAuth client secrets |
| Monitoring | Google Cloud Monitoring + Sentry | Latency, error tracking |
| CI/CD | Cloud Build + GitHub Actions | Automated deploy on push |

---

## 2. AUTHENTICATION LAYER

### 2.1 Providers (Firebase Auth)

```
┌─────────────────────────────────────────────────────────┐
│                   SIGN-IN SCREEN                        │
│                                                         │
│  [G] Continue with Google    → OAuth 2.0 PKCE           │
│  [⊞] Continue with Microsoft → OIDC (Azure AD)          │
│  [ ] Continue with Apple     → Sign in with Apple       │
│  [📱] SMS / OTP              → Firebase Phone Auth      │
│                                                         │
│  ─── Already have account? ───                          │
│  [✉] Email + Password        → Firebase Email Auth      │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Auth Flow

```
User hits auth provider
        ↓
Firebase Auth validates & issues ID token (JWT)
        ↓
Cloud Function: onAuthCreate trigger
        ↓
Creates /users/{uid} document in Firestore (skeleton)
        ↓
Redirects → /onboarding (role selection)
```

### 2.3 Session Management

- ID Token: 1-hour TTL, auto-refreshed by Firebase SDK
- Custom Claims: `role`, `eventGroup`, `organizationId` set post-onboarding
- Refresh Token: stored in httpOnly cookie (Next.js middleware validates server-side)

---

## 3. ONBOARDING FLOW

### 3.1 Step Sequence

```
STEP 1: ROLE SELECTION
├── Athlete
│   ├── Sprinter / Hurdler      → ModalityID: SPEED
│   ├── Jumper (Horizontal)     → ModalityID: HJUMP
│   ├── Jumper (Vertical)       → ModalityID: VJUMP
│   ├── Thrower                 → ModalityID: THROW
│   └── Multi-Event             → ModalityID: MULTI
└── Coach
    ├── Individual coach
    └── Club / Federation (B2B) → Links to Organization entity

STEP 2: BASIC PROFILE
├── Full name, DOB, nationality
├── Sex (M / F — affects benchmark normalization)
└── Competition category: U16 / U18 / U20 / U23 / Senior / Masters

STEP 3: BIOMETRICS [Athletes only]
├── Estatura (cm)
├── Peso (kg)
├── Altura de cadera / Trocantérica (cm)
│   — Measurement guide shown: standing, barefoot,
│     distance from greater trochanter to floor
│   — Used for: stride normalization, SL/height ratio,
│     hurdle height relative ratios, COM height estimates
└── Envergadura / Wingspan (cm) [optional — relevant for throws]

STEP 4: EVENT SPECIALIZATION
├── Primary event (dropdown filtered by ModalityID)
├── Secondary event (optional)
└── Season personal bests entry (see §4)

STEP 5: HEALTH APP CONNECTION (optional, skippable)
└── See §7 — Integration Layer

STEP 6: COACH LINK (optional)
└── Enter coach invite code → links athlete to coach dashboard
```

### 3.2 Post-Onboarding: Custom Claims Update

```python
# Cloud Function (Python) — sets Firestore + Auth custom claims
def set_user_claims(uid, role, event_group, org_id=None):
    auth.set_custom_user_claims(uid, {
        "role": role,                # "athlete" | "coach" | "org_admin"
        "eventGroup": event_group,   # "SPEED" | "HJUMP" | "VJUMP" | "THROW" | "MULTI"
        "organizationId": org_id     # null for individuals
    })
```

---

## 4. DATA MODELS (FIRESTORE SCHEMA)

### 4.1 /users/{uid}

```typescript
interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: "google" | "microsoft" | "apple" | "phone" | "email";
  role: "athlete" | "coach" | "org_admin";
  createdAt: Timestamp;
  onboardingComplete: boolean;
  subscription: "free" | "pro" | "elite" | "org";
  locale: string; // "es-CO", "en-GB", etc.
}
```

### 4.2 /athletes/{uid}

```typescript
interface AthleteProfile {
  uid: string;
  // Identity
  dob: Timestamp;
  sex: "M" | "F";
  nationality: string; // ISO 3166-1
  competitionCategory: "U16" | "U18" | "U20" | "U23" | "Senior" | "Masters";

  // Event specialization
  modalityId: "SPEED" | "HJUMP" | "VJUMP" | "THROW" | "MULTI";
  primaryEvent: string;    // e.g. "110mH", "LJ", "HT", "400m"
  secondaryEvent?: string;

  // Biometrics
  biometrics: {
    heightCm: number;
    weightKg: number;
    hipHeightCm: number;         // Altura trocantérica
    wingspanCm?: number;
    lastUpdated: Timestamp;
  };

  // Derived biomechanical constants (auto-calculated on save)
  derived: {
    legLengthRatio: number;      // hipHeight / height
    optimalStrideLength: number; // hipHeight * 2.3 (approx)
    hurdleHeightRatio?: number;  // hurdleHeight / hipHeight
  };

  // Coach link
  coachUid?: string;
  organizationId?: string;

  // Connected health apps
  connectedApps: ConnectedApp[]; // see §7

  updatedAt: Timestamp;
}
```

### 4.3 /athletes/{uid}/pbs — Track Personal Bests

```typescript
interface TrackPB {
  id: string;
  event: string;             // "110mH", "100m", "LJ", "HT"
  mark: string;              // "13.45", "8.12m", "75.40m"
  markNumeric: number;       // for sorting/comparison
  unit: "seconds" | "metres";
  surface: "outdoor" | "indoor";
  wind?: number;             // m/s (jumps & sprints)
  venue: string;
  date: Timestamp;
  official: boolean;         // IAAF sanctioned meet
  videoUrl?: string;
  notes?: string;
  createdAt: Timestamp;
}
```

### 4.4 /athletes/{uid}/prs — Gym Personal Records

```typescript
interface GymPR {
  id: string;
  exercise: string;          // "Back Squat", "Power Clean", "Nordic Curl", "Hip Thrust"
  category: "strength" | "power" | "plyometric" | "reactive";
  
  // Load-based
  loadKg?: number;
  reps?: number;
  rm?: number;               // 1RM, 3RM, etc.
  
  // Jump/plyometric
  heightCm?: number;         // CMJ, SJ, Drop Jump
  distanceCm?: number;       // Broad jump
  contactTimeMs?: number;    // RSI measurement
  rsi?: number;              // Reactive Strength Index
  
  date: Timestamp;
  notes?: string;
  createdAt: Timestamp;
}
```

### 4.5 /athletes/{uid}/sessions — Analysis Sessions

```typescript
interface AnalysisSession {
  id: string;
  modalityId: string;
  analysisMode: "NORMAL" | "DRILL" | "VS" | "BEFORE_AFTER" | "B2B_COACH";
  inputType: "text" | "video" | "sensor_data" | "manual_metrics";

  // Raw input
  rawData: {
    metrics?: Record<string, number>;  // GCT, SF, SL, etc.
    videoUrl?: string;
    sensorPayload?: object;
  };

  // Environmental adjustments applied
  adjustments: {
    timingMethod: "manual" | "electronic";
    manualOffset: number;            // +0.24s if manual
    environment: "indoor" | "outdoor";
    sessionType: "race" | "training";
  };

  // AI Output
  report: {
    archetype: string;               // "The Elastic Bounder"
    dataMatrix: object;              // metrics vs benchmarks table
    kinematicDiagnosis: string;
    technicalPrescription: string[]; // 3 concrete actions
    differentialDelta?: object;      // VS / Before-After only
  };

  // Gemini API metadata
  geminiModel: string;
  promptTokens: number;
  responseTokens: number;

  createdAt: Timestamp;
  athleteUid: string;
  coachUid?: string;
}
```

### 4.6 /coaches/{uid}

```typescript
interface CoachProfile {
  uid: string;
  dob: Timestamp;
  sex: "M" | "F";
  nationality: string;
  specialization: string[];          // ["SPEED", "HJUMP"]
  organizationId?: string;
  athleteUids: string[];             // linked athletes
  maxAthletes: number;               // plan-dependent
  updatedAt: Timestamp;
}
```

### 4.7 /organizations/{orgId}

```typescript
interface Organization {
  id: string;
  name: string;
  type: "club" | "federation" | "university" | "hpc"; // High Performance Centre
  country: string;
  adminUids: string[];
  coachUids: string[];
  athleteUids: string[];
  subscription: "org_basic" | "org_pro" | "org_enterprise";
  createdAt: Timestamp;
}
```

---

## 5. AI ENGINE — GEMINI INTEGRATION

### 5.1 System Prompt Architecture

The STRIDES v1.5 system prompt is stored in **Firestore /config/strides_engine** and versioned. It is injected server-side via Cloud Run — never exposed to the client.

```python
# Cloud Run: /api/analyze (POST)
import google.generativeai as genai

def run_strides_analysis(athlete_profile, session_input, mode):
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=load_system_prompt("strides_v15"),
    )
    
    # Build context-aware user turn
    context = build_athlete_context(athlete_profile)
    # Includes: biometrics, derived constants, PBs, age category,
    #           event group, relevant benchmark set

    prompt = f"""
    [MODE: {mode}]
    [ATHLETE CONTEXT]
    {context}
    
    [SESSION INPUT]
    {session_input}
    
    Output a structured JSON report matching the STRIDES v1.5 schema.
    """
    
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.0,
            top_p=1.0,
        )
    )
    return response.text
```

### 5.2 Benchmark Injection

The relevant benchmark subset is injected dynamically based on `modalityId` + `competitionCategory`:

```python
def build_athlete_context(profile):
    benchmarks = load_benchmarks(
        modality=profile["modalityId"],
        category=profile["competitionCategory"]
    )
    return {
        "athlete": {
            "height": profile["biometrics"]["heightCm"],
            "weight": profile["biometrics"]["weightKg"],
            "hipHeight": profile["biometrics"]["hipHeightCm"],
            "legRatio": profile["derived"]["legLengthRatio"],
            "event": profile["primaryEvent"],
            "category": profile["competitionCategory"],
            "sex": profile["sex"],
        },
        "pbs": profile["pbs"][-5:],  # last 5 PBs
        "prs": profile["prs"][-10:], # last 10 PRs
        "benchmarks": benchmarks,
    }
```

### 5.3 Structured Output Schema (Gemini response_schema)

```python
REPORT_SCHEMA = {
    "type": "object",
    "properties": {
        "archetype": {"type": "string"},
        "dataMatrix": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "parameter": {"type": "string"},
                    "athleteValue": {"type": "string"},
                    "eliteBenchmark": {"type": "string"},
                    "delta": {"type": "string"},
                    "status": {"type": "string",
                               "enum": ["optimal", "acceptable", "deficient", "critical"]}
                }
            }
        },
        "kinematicDiagnosis": {"type": "string"},
        "prescription": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 3,
            "maxItems": 3
        },
        "energyLeakPoints": {"type": "array", "items": {"type": "string"}},
        "differentialDelta": {"type": "object"}  # nullable — VS/BA modes only
    },
    "required": ["archetype", "dataMatrix", "kinematicDiagnosis", "prescription"]
}
```

---

## 6. API ARCHITECTURE

### 6.1 Endpoint Map

```
BASE: https://api.strides.app/v1

AUTH (proxied via Firebase — no custom endpoints needed)

USERS
  POST   /users/complete-onboarding     → saves role, biometrics, event
  PATCH  /users/{uid}/biometrics        → update height/weight/hipHeight
  GET    /users/{uid}/profile           → full profile read

PBs / PRs
  POST   /athletes/{uid}/pbs            → add track PB
  GET    /athletes/{uid}/pbs            → list all PBs (filterable by event)
  DELETE /athletes/{uid}/pbs/{pbId}     → remove PB
  POST   /athletes/{uid}/prs            → add gym PR
  GET    /athletes/{uid}/prs            → list all PRs

ANALYSIS
  POST   /sessions/analyze              → run STRIDES engine (Gemini)
  GET    /sessions/{sessionId}          → fetch completed report
  GET    /athletes/{uid}/sessions       → session history
  DELETE /sessions/{sessionId}          → delete session

HEALTH INTEGRATIONS
  POST   /integrations/connect          → initiate OAuth for health app
  DELETE /integrations/{appId}          → revoke connection
  POST   /integrations/sync/{appId}     → manual sync trigger
  GET    /integrations/status           → list connected apps + last sync

COACHES
  POST   /coaches/invite                → generate athlete invite code
  GET    /coaches/{uid}/athletes        → list linked athletes
  GET    /coaches/{uid}/sessions        → all sessions across athletes

ORGANIZATIONS
  POST   /organizations                 → create org
  POST   /organizations/{orgId}/invite  → invite coach/athlete
  GET    /organizations/{orgId}/roster  → full roster
```

### 6.2 Middleware Stack (Next.js)

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const token = request.cookies.get("__session")?.value;
  
  // 1. Verify Firebase ID token
  const decoded = await verifyIdToken(token);
  if (!decoded) return redirectToLogin(request);
  
  // 2. Check onboarding completion
  if (!decoded.onboardingComplete && !isOnboardingRoute(request)) {
    return NextResponse.redirect("/onboarding");
  }
  
  // 3. Role-based route guards
  if (isCoachRoute(request) && decoded.role !== "coach") {
    return NextResponse.redirect("/dashboard");
  }
  
  // 4. Inject uid into request headers for RSCs
  const headers = new Headers(request.headers);
  headers.set("x-user-uid", decoded.uid);
  headers.set("x-user-role", decoded.role);
  
  return NextResponse.next({ request: { headers } });
}
```

---

## 7. HEALTH APP INTEGRATION LAYER

### 7.1 Supported Platforms

| Platform | Protocol | Data Available | Auth Method |
|---|---|---|---|
| Google Fit | REST API v1 | Steps, HR, sleep, weight, activity | OAuth 2.0 (Google) |
| Apple Health | HealthKit (iOS only) | Full sensor suite | HealthKit entitlement |
| Garmin Connect | Garmin Health API | GPS, HR, HRV, training load, sleep, VO2max | OAuth 1.0a |
| Suunto | Suunto API | GPS, HR, training data | OAuth 2.0 |
| Coros | COROS API | Training data, VO2max, sleep | OAuth 2.0 |
| Samsung Health | Samsung Health Platform | HR, steps, sleep, workout | OAuth 2.0 |
| Cubitt | Cubitt Open API | HR, steps, sleep | API Key + Webhook |
| VeryFit Pro | VeryFit API | HR, steps, sleep | API Key |
| Strava | Strava API v3 | GPS activities, pace, HR | OAuth 2.0 |
| Wahoo | Wahoo API | Workout data, HR | OAuth 2.0 |

### 7.2 Integration Architecture

```
┌──────────────┐    OAuth/API    ┌──────────────────────┐
│  Health App  │ ◄─────────────► │  Cloud Run Service   │
│  (External)  │                 │  /integrations       │
└──────────────┘                 └──────────┬───────────┘
                                            │
                         Normalize to       │
                         STRIDES schema     │
                                            ▼
                                 ┌──────────────────────┐
                                 │   Firestore          │
                                 │ /athletes/{uid}      │
                                 │   /health_data/{ts}  │
                                 └──────────┬───────────┘
                                            │
                                            ▼
                                 ┌──────────────────────┐
                                 │  STRIDES Engine      │
                                 │  (context enrichment)│
                                 └──────────────────────┘
```

### 7.3 Normalized Health Data Schema

```typescript
interface HealthDataPoint {
  source: string;              // "garmin" | "apple_health" | etc.
  timestamp: Timestamp;
  type: HealthDataType;
  value: number;
  unit: string;
  sessionId?: string;          // links to training session if applicable
}

type HealthDataType =
  | "resting_hr"               // bpm
  | "hrv_rmssd"                // ms
  | "vo2max"                   // ml/kg/min
  | "training_load_acute"      // ATL
  | "training_load_chronic"    // CTL
  | "tsb"                      // Training Stress Balance
  | "sleep_score"
  | "sleep_duration_min"
  | "body_weight_kg"
  | "steps"
  | "active_calories"
  | "gps_distance_km"
  | "pace_min_per_km";
```

### 7.4 Sync Strategy

- **Webhooks (preferred)**: Garmin, Strava, Suunto push data automatically
- **Polling (fallback)**: Google Fit, Samsung Health — Cloud Scheduler runs every 6h
- **On-demand**: User triggers manual sync from settings
- **Apple Health**: iOS app (React Native) uses HealthKit SDK; syncs on foreground open

### 7.5 ConnectedApp Subdocument

```typescript
interface ConnectedApp {
  appId: string;               // "garmin" | "google_fit" | etc.
  connected: boolean;
  accessToken?: string;        // encrypted at rest via Cloud KMS
  refreshToken?: string;       // encrypted
  tokenExpiry?: Timestamp;
  lastSync?: Timestamp;
  syncStatus: "ok" | "error" | "pending";
  errorMessage?: string;
  scopes: string[];
}
```

---

## 8. FRONTEND ARCHITECTURE (Next.js App Router)

### 8.1 Route Structure

```
/app
├── (auth)
│   ├── login/page.tsx              → multi-provider sign-in
│   └── callback/page.tsx           → OAuth redirect handler
│
├── (onboarding)
│   ├── onboarding/
│   │   ├── role/page.tsx           → Step 1: role selection
│   │   ├── profile/page.tsx        → Step 2: basic profile
│   │   ├── biometrics/page.tsx     → Step 3: biometrics [athletes]
│   │   ├── events/page.tsx         → Step 4: event specialization
│   │   ├── connect/page.tsx        → Step 5: health apps
│   │   └── coach-link/page.tsx     → Step 6: link to coach
│
├── (dashboard)
│   ├── dashboard/page.tsx          → home / overview
│   ├── analyze/
│   │   ├── page.tsx                → new analysis session
│   │   └── [sessionId]/page.tsx   → session report
│   ├── history/page.tsx            → session history
│   ├── pbs/page.tsx                → track PBs management
│   ├── prs/page.tsx                → gym PRs management
│   ├── health/page.tsx             → health data overview
│   └── settings/
│       ├── profile/page.tsx
│       ├── biometrics/page.tsx
│       └── integrations/page.tsx
│
├── (coach)
│   ├── coach/
│   │   ├── dashboard/page.tsx      → coach overview
│   │   ├── athletes/page.tsx       → roster
│   │   ├── athletes/[uid]/page.tsx → individual athlete deep-dive
│   │   └── sessions/page.tsx       → all sessions across athletes
│
└── (org)
    └── org/
        ├── dashboard/page.tsx      → org admin panel
        ├── roster/page.tsx
        └── settings/page.tsx
```

### 8.2 Key Components

```typescript
// Analysis input modes
<StridesModeSelector />          // NORMAL | DRILL | VS | BEFORE-AFTER | B2B
<MetricInputForm />              // manual GCT, SF, SL, angles entry
<VideoUploader />                // mp4/mov upload → Cloud Storage
<SensorDataImport />             // JSON/CSV from wearable export

// Report display
<ArchetypeCard />                // "The Elastic Bounder" + description
<DataMatrix />                   // table: athlete vs elite benchmarks
<KinematicDiagnosis />           // prose + energy leak highlights
<PrescriptionCards />            // 3 action cards with drill suggestions
<DeltaComparison />              // VS / Before-After differential

// Profile
<BiometricForm />                // height, weight, hip height + diagram
<EventSelector />                // filtered by modalityId
<PBTable />                      // sortable, filterable PB log
<PRTable />                      // gym records with RSI support
<HealthAppGrid />                // connect/disconnect health apps
```

---

## 9. SUBSCRIPTIONS & FEATURE GATING

| Feature | Free | Pro | Elite | Org |
|---|---|---|---|---|
| Analyses / month | 5 | 30 | Unlimited | Unlimited |
| Analysis modes | NORMAL only | All modes | All modes | All modes |
| Health app connections | 1 | 3 | All | All |
| Video upload | ✗ | ✓ | ✓ | ✓ |
| Coach linking | ✗ | ✓ | ✓ | ✓ |
| Report export (PDF) | ✗ | ✓ | ✓ | ✓ |
| Athletes (Coach) | — | 5 | 25 | Custom |
| API access | ✗ | ✗ | ✓ | ✓ |
| Price (USD/mo) | $0 | $12 | $29 | Custom |

Payments: Stripe (Checkout + Customer Portal), webhooks update Firestore subscription field.

---

## 10. SECURITY & COMPLIANCE

### 10.1 Data Security

- All tokens (health app OAuth) encrypted at rest via **Cloud KMS** before storing in Firestore
- Firestore Security Rules enforce: users can only read/write their own documents; coaches can read athlete docs only if `coachUid` matches; org admins scoped to their `organizationId`
- PII fields (name, DOB) encrypted server-side before storage
- HTTPS enforced everywhere; HSTS preloaded

### 10.2 Firestore Rules (excerpt)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /athletes/{uid} {
      allow read, write: if request.auth.uid == uid;
      allow read: if request.auth.token.coachUid == uid
                  || isOrgAdmin(resource.data.organizationId);
    }

    match /athletes/{uid}/sessions/{sessionId} {
      allow read, write: if request.auth.uid == uid;
      allow read: if isLinkedCoach(uid);
    }

    function isLinkedCoach(athleteUid) {
      return get(/databases/$(database)/documents/athletes/$(athleteUid))
               .data.coachUid == request.auth.uid;
    }

    function isOrgAdmin(orgId) {
      return orgId != null &&
             request.auth.uid in
               get(/databases/$(database)/documents/organizations/$(orgId))
                 .data.adminUids;
    }
  }
}
```

### 10.3 Compliance

- **GDPR** (EU users): right to deletion implemented via Cloud Function that wipes all user documents + Storage files; consent recorded at registration
- **COPPA**: DOB gate — users under 13 blocked at onboarding
- **HIPAA**: not targeted (biometric data is performance data, not medical); disclaimer shown at onboarding
- Health data from Apple HealthKit: never sold or shared with third parties per Apple requirements

---

## 11. DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                      Google Cloud Platform                  │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────┐  │
│  │  Cloud Run   │   │  Cloud Run   │   │ Cloud         │  │
│  │  Next.js App │   │  FastAPI     │   │ Functions     │  │
│  │  (SSR/RSC)   │   │  (AI engine) │   │ (triggers)    │  │
│  └──────┬───────┘   └──────┬───────┘   └───────┬───────┘  │
│         │                  │                   │           │
│         └──────────────────┼───────────────────┘           │
│                            │                               │
│  ┌─────────────────────────▼─────────────────────────────┐ │
│  │                   Firebase                            │ │
│  │   Auth │ Firestore │ Storage │ FCM                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                               │
│  ┌─────────────────────────▼─────────────────────────────┐ │
│  │              Google AI Studio                         │ │
│  │              Gemini 2.0 Flash API                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────┐   ┌──────────────────────────────┐   │
│  │  Cloud SQL (PG) │   │  Cloud Scheduler             │   │
│  │  Analytics      │   │  Health sync jobs (cron)     │   │
│  └─────────────────┘   └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
           │
           │ OAuth / Webhooks
           ▼
┌──────────────────────────────────────────────────────────────┐
│  External: Garmin · Suunto · Coros · Google Fit              │
│           Apple Health · Samsung Health · Strava             │
│           Cubitt · VeryFit Pro · Wahoo · Stripe              │
└──────────────────────────────────────────────────────────────┘
```

---

## 12. GOOGLE AI STUDIO SYSTEM PROMPT (FINAL CONFIG)

To deploy in Google AI Studio:

1. **Model**: Gemini 2.0 Flash (or Gemini 1.5 Pro for long video analysis)
2. **Temperature**: 0
3. **Top P**: 1.0
4. **Max output tokens**: 8192
5. **Response format**: JSON (structured output with schema above)
6. **System instruction**: STRIDES v1.5 prompt (stored in Secret Manager, injected server-side)
7. **Safety settings**: All categories → BLOCK_NONE (athletic performance context)
8. **Grounding**: Google Search grounding OFF (deterministic output required)

---

*STRIDES Architecture v1.0 — Confidential*
