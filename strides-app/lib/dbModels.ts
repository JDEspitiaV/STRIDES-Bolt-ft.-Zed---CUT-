// /users/{uid}
export interface UserDocument {
  uid: string;
  email: string | null;
  role: 'athlete' | 'coach';
  createdAt: Date;
  // Add other common user properties if needed
}

// /athletes/{uid}
export interface AthleteProfile {
  uid: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  heightCm: number;
  weightKg: number;
  // Add other athlete-specific properties
  // e.g., sport, level, training goals
}

// /athletes/{uid}/pbs — Track Personal Bests
export interface TrackPB {
  eventId: string; // e.g., '100m', '400m_hurdles'
  timeSeconds: number;
  date: Date;
  location?: string;
}

// /athletes/{uid}/prs — Gym Personal Records
export interface GymPR {
  exerciseId: string; // e.g., 'squat', 'bench_press'
  weightKg: number;
  reps: number;
  date: Date;
}

// /athletes/{uid}/sessions — Analysis Sessions
export interface AnalysisSession {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  // Reference to raw health data or specific metrics
  // e.g., 'heartRateData', 'motionData'
  // You might store aggregated metrics here as well
  metrics?: Record<string, any>;
  // Link to coach if applicable
  coachUid?: string | null;
}

// /coaches/{uid}
export interface CoachProfile {
  uid: string;
  firstName: string;
  lastName: string;
  organizations?: string[]; // IDs of organizations they belong to
  bio?: string;
  // Add other coach-specific properties
  // e.g., certifications, specializations
}

// /organizations/{orgId}
export interface Organization {
  orgId: string;
  name: string;
  address?: string;
  // List of coach UIDs associated with this organization
  coachUids: string[];
  // List of athlete UIDs associated with this organization (optional, could be managed per coach)
  athleteUids?: string[];
}

// Interface for health data points (from Section 7.3)
export interface HealthDataPoint {
  timestamp: Date;
  value: number;
  unit: string;
  source: string; // e.g., 'Apple Health', 'Google Fit'
}

export type HealthDataType = 'steps' | 'heartRate' | 'calories' | 'sleep' | 'distance';

// ConnectedApp Subdocument (from Section 7.5)
export interface ConnectedApp {
  appId: string; // Identifier for the connected app
  isConnected: boolean;
  lastSync?: Date;
}
