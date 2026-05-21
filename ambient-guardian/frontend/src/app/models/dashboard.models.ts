export type GuardianStatus = 'NORMAL' | 'WARNING' | 'CRITICAL';

export type RoomId = 'bedroom' | 'kitchen' | 'bathroom' | 'livingRoom' | 'exitDoor';

export interface ActiveSensors {
  bedroom: boolean;
  kitchen: boolean;
  bathroom: boolean;
  livingRoom: boolean;
  exitDoor: boolean;
}

export interface AmbientWebSocketPayload {
  timestamp: string;
  room: string;
  riskScore: number;
  status: GuardianStatus;
  alert?: string;
  aiInsight: string;
  activeSensors: Partial<Record<RoomId | string, boolean>>;
}

export interface BackendSnapshotPayload {
  sensorPacket?: {
    timestamp?: string;
    zone?: string;
    scenario?: string;
    temperatureC?: number;
    humidity?: number;
    co2Ppm?: number;
    pm25?: number;
    noiseDb?: number;
  };
  risk?: {
    score?: number;
    level?: string;
  };
  explanation?: string;
  anomaly?: {
    isAnomaly?: boolean;
    source?: string;
    confidence?: number;
  };
  alerts?: Array<{
    metric?: string;
    message?: string;
    value?: number | string;
    severity?: string;
  }>;
}

export interface SensorReading {
  label: string;
  value: string;
}

export interface TimelineEntry {
  id: string;
  timestamp: string;
  message: string;
  severity: GuardianStatus;
}

export interface AlertItem {
  id: string;
  title: string;
  details: string;
  timestamp: string;
  severity: GuardianStatus;
  expanded: boolean;
}

export interface StatusCardViewModel {
  label: string;
  value: string;
  meta: string;
  severity: GuardianStatus;
}

export interface DashboardState {
  timestamp: string;
  status: GuardianStatus;
  residentStatus: string;
  riskScore: number;
  activeRoom: string;
  activeAlertCount: number;
  aiConfidence: number;
  aiInsight: string;
  anomaly: string;
  interpretation: string;
  recommendation: string;
  activeSensors: ActiveSensors;
  sensorReadings: SensorReading[];
  timeline: TimelineEntry[];
  alerts: AlertItem[];
  connectionStatus: 'CONNECTING' | 'LIVE' | 'RECONNECTING' | 'OFFLINE' | 'ERROR';
  loading: boolean;
  error?: string;
}

export type ScenarioType = 'normal' | 'fall' | 'wandering' | 'inactivity';
