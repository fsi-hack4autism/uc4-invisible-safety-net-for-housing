import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { EMPTY, catchError } from 'rxjs';

import { ApiService } from './api.service';
import { WebsocketService } from './websocket.service';
import {
  ActiveSensors,
  AlertItem,
  AmbientWebSocketPayload,
  BackendSnapshotPayload,
  DashboardState,
  GuardianStatus,
  RoomId,
  ScenarioType,
  StatusCardViewModel,
  TimelineEntry
} from '../models/dashboard.models';

const EMPTY_SENSORS: ActiveSensors = {
  bedroom: false,
  kitchen: false,
  bathroom: false,
  livingRoom: false,
  exitDoor: false
};

const INITIAL_STATE: DashboardState = {
  timestamp: '--:--:--',
  status: 'NORMAL',
  residentStatus: 'Establishing baseline',
  riskScore: 12,
  activeRoom: 'Bedroom',
  activeAlertCount: 0,
  aiConfidence: 92,
  aiInsight: 'Ambient intelligence is calibrating resident routine and environmental baselines.',
  anomaly: 'No anomaly detected',
  interpretation: 'Resident activity is within normal expected rhythm.',
  recommendation: 'Continue passive monitoring. No staff intervention required.',
  activeSensors: { ...EMPTY_SENSORS, bedroom: true },
  sensorReadings: [],
  timeline: [],
  alerts: [],
  connectionStatus: 'CONNECTING',
  loading: true
};

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  private readonly api = inject(ApiService);
  private readonly websocket = inject(WebsocketService);
  private readonly stateSignal = signal<DashboardState>(INITIAL_STATE);

  readonly state = this.stateSignal.asReadonly();
  readonly statusCards = computed<StatusCardViewModel[]>(() => {
    const state = this.state();

    return [
      {
        label: 'Resident Status',
        value: state.residentStatus,
        meta: state.status === 'NORMAL' ? 'Routine stable' : 'Requires attention',
        severity: state.status
      },
      {
        label: 'Risk Score',
        value: `${state.riskScore}%`,
        meta: riskLabel(state.riskScore),
        severity: state.status
      },
      {
        label: 'Active Room',
        value: state.activeRoom,
        meta: 'Latest motion cluster',
        severity: state.status
      },
      {
        label: 'Active Alerts',
        value: `${state.activeAlertCount}`,
        meta: state.activeAlertCount ? 'Open incidents' : 'No active alerts',
        severity: state.activeAlertCount ? state.status : 'NORMAL'
      },
      {
        label: 'AI Confidence',
        value: `${state.aiConfidence}%`,
        meta: 'Multimodal inference',
        severity: state.aiConfidence > 80 ? 'NORMAL' : 'WARNING'
      }
    ];
  });

  constructor() {
    effect(() => {
      const connectionStatus = this.websocket.connectionStatus();
      this.stateSignal.update((state) => ({ ...state, connectionStatus }));
    });
  }

  initialize(): void {
    this.websocket.connect();
    this.websocket.messages$.subscribe((payload) => this.ingest(payload));

    this.api.getSnapshot().pipe(
      catchError(() => {
        this.stateSignal.update((state) => ({
          ...state,
          loading: false,
          error: 'Initial API snapshot is unavailable. Waiting for live stream.'
        }));
        return EMPTY;
      })
    ).subscribe((payload) => {
      if ('message' in payload) {
        this.stateSignal.update((state) => ({ ...state, loading: false }));
        return;
      }

      this.ingest(payload);
    });
  }

  runScenario(scenario: ScenarioType): void {
    const optimistic = scenarioPayload(scenario);
    this.ingest(optimistic);

    this.api.runScenario(scenario).pipe(
      catchError(() => {
        this.stateSignal.update((state) => ({
          ...state,
          error: 'Scenario endpoint did not respond; local dashboard state was updated for the demo.'
        }));
        return EMPTY;
      })
    ).subscribe((payload) => this.ingest(payload));
  }

  toggleAlert(alertId: string): void {
    this.stateSignal.update((state) => ({
      ...state,
      alerts: state.alerts.map((alert) => (
        alert.id === alertId ? { ...alert, expanded: !alert.expanded } : alert
      ))
    }));
  }

  private ingest(payload: AmbientWebSocketPayload | BackendSnapshotPayload): void {
    const normalized = isExpectedPayload(payload)
      ? normalizeExpectedPayload(payload, this.state())
      : normalizeBackendPayload(payload, this.state());

    this.stateSignal.set(normalized);
  }
}

function normalizeExpectedPayload(payload: AmbientWebSocketPayload, previous: DashboardState): DashboardState {
  const status = payload.status;
  const timestamp = normalizeTimestamp(payload.timestamp);
  const activeRoom = payload.room || activeRoomFromSensors(payload.activeSensors) || previous.activeRoom;
  const activeSensors = normalizeSensors(payload.activeSensors, activeRoom);
  const alert = payload.alert ? alertFromText(payload.alert, timestamp, status) : undefined;
  const alerts = alert ? mergeAlerts(previous.alerts, [alert]) : previous.alerts.filter((item) => status !== 'NORMAL' || item.severity === 'CRITICAL');
  const timeline = prependTimeline(previous.timeline, {
    id: cryptoId(),
    timestamp,
    message: payload.alert || `${activeRoom} motion detected`,
    severity: status
  });

  return {
    ...previous,
    timestamp,
    status,
    residentStatus: status === 'NORMAL' ? 'Stable routine' : status === 'WARNING' ? 'Pattern deviation' : 'Immediate risk',
    riskScore: clamp(payload.riskScore),
    activeRoom,
    activeAlertCount: alerts.length,
    aiConfidence: status === 'CRITICAL' ? 96 : status === 'WARNING' ? 89 : 94,
    aiInsight: payload.aiInsight,
    anomaly: payload.alert || (status === 'NORMAL' ? 'No anomaly detected' : 'Behavioral anomaly detected'),
    interpretation: interpretationFor(status, clamp(payload.riskScore)),
    recommendation: recommendationFor(status),
    activeSensors,
    timeline,
    alerts,
    loading: false,
    error: undefined
  };
}

function normalizeBackendPayload(payload: BackendSnapshotPayload, previous: DashboardState): DashboardState {
  const packet = payload.sensorPacket ?? {};
  const score = clamp(Number(payload.risk?.score ?? previous.riskScore));
  const status = statusFromScore(score, payload.risk?.level);
  const timestamp = normalizeTimestamp(packet.timestamp);
  const activeRoom = roomLabel(packet.zone ?? previous.activeRoom);
  const activeSensors = normalizeSensors({}, activeRoom);
  const backendAlerts = (payload.alerts ?? []).map((alert) => ({
    id: `${alert.metric ?? alert.message ?? cryptoId()}`,
    title: alert.metric ? titleCase(String(alert.metric)) : alert.message ?? 'Ambient Alert',
    details: alert.message ?? 'Risk rule triggered by live ambient signal.',
    timestamp,
    severity: statusFromSeverity(alert.severity, status),
    expanded: false
  }));
  const alerts = mergeAlerts(previous.alerts, backendAlerts);
  const scenario = packet.scenario ? titleCase(packet.scenario.replaceAll('_', ' ')) : 'Normal routine';

  return {
    ...previous,
    timestamp,
    status,
    residentStatus: status === 'NORMAL' ? 'Stable routine' : scenario,
    riskScore: score,
    activeRoom,
    activeAlertCount: alerts.length,
    aiConfidence: payload.anomaly?.confidence ? clamp(Math.round(payload.anomaly.confidence * 100)) : previous.aiConfidence,
    aiInsight: payload.explanation ?? previous.aiInsight,
    anomaly: payload.anomaly?.isAnomaly ? `${payload.anomaly.source ?? 'AI'} anomaly detected` : 'No anomaly detected',
    interpretation: interpretationFor(status, score),
    recommendation: recommendationFor(status),
    activeSensors,
    sensorReadings: [
      { label: 'Temperature', value: `${packet.temperatureC ?? '--'} C` },
      { label: 'Humidity', value: `${packet.humidity ?? '--'}%` },
      { label: 'CO2', value: `${packet.co2Ppm ?? '--'} ppm` },
      { label: 'PM2.5', value: `${packet.pm25 ?? '--'}` },
      { label: 'Noise', value: `${packet.noiseDb ?? '--'} dB` }
    ],
    timeline: prependTimeline(previous.timeline, {
      id: cryptoId(),
      timestamp,
      message: `${activeRoom} ambient packet processed - ${scenario}`,
      severity: status
    }),
    alerts,
    loading: false,
    error: undefined
  };
}

function scenarioPayload(scenario: ScenarioType): AmbientWebSocketPayload {
  const timestamp = normalizeTimestamp(new Date().toISOString());
  const payloads: Record<ScenarioType, AmbientWebSocketPayload> = {
    normal: {
      timestamp,
      room: 'Living Room',
      riskScore: 18,
      status: 'NORMAL',
      aiInsight: 'Resident routine has returned to expected daytime movement and activity cadence.',
      activeSensors: { livingRoom: true }
    },
    fall: {
      timestamp,
      room: 'Bathroom',
      riskScore: 91,
      status: 'CRITICAL',
      alert: 'Possible Fall Detected',
      aiInsight: 'Abrupt motion followed by inactivity in the bathroom indicates a possible fall event.',
      activeSensors: { bathroom: true }
    },
    wandering: {
      timestamp,
      room: 'Exit Door',
      riskScore: 78,
      status: 'CRITICAL',
      alert: 'Wandering Risk',
      aiInsight: 'Exit door activity is unusual for this time window and no return movement has been detected.',
      activeSensors: { exitDoor: true }
    },
    inactivity: {
      timestamp,
      room: 'Bedroom',
      riskScore: 66,
      status: 'WARNING',
      alert: 'Extended Inactivity',
      aiInsight: 'Resident has remained motionless longer than the learned rest pattern for this period.',
      activeSensors: { bedroom: true }
    }
  };

  return payloads[scenario];
}

function isExpectedPayload(payload: AmbientWebSocketPayload | BackendSnapshotPayload): payload is AmbientWebSocketPayload {
  return 'riskScore' in payload && 'status' in payload && 'activeSensors' in payload;
}

function normalizeSensors(sensors: Partial<Record<RoomId | string, boolean>>, activeRoom: string): ActiveSensors {
  const normalized = { ...EMPTY_SENSORS };

  for (const [key, value] of Object.entries(sensors)) {
    const roomId = roomIdFromLabel(key);
    if (roomId) {
      normalized[roomId] = Boolean(value);
    }
  }

  const roomId = roomIdFromLabel(activeRoom);
  if (roomId && !Object.values(normalized).some(Boolean)) {
    normalized[roomId] = true;
  }

  return normalized;
}

function activeRoomFromSensors(sensors: Partial<Record<RoomId | string, boolean>>): string {
  const active = Object.entries(sensors).find(([, value]) => value);
  return active ? roomLabel(active[0]) : '';
}

function roomIdFromLabel(value: string): RoomId | undefined {
  const key = value.toLowerCase().replace(/[\s_-]/g, '');
  const lookup: Record<string, RoomId> = {
    bedroom: 'bedroom',
    kitchen: 'kitchen',
    bathroom: 'bathroom',
    livingroom: 'livingRoom',
    lounge: 'livingRoom',
    exitdoor: 'exitDoor',
    door: 'exitDoor'
  };

  return lookup[key];
}

function roomLabel(value: string): string {
  const id = roomIdFromLabel(value);
  const lookup: Record<RoomId, string> = {
    bedroom: 'Bedroom',
    kitchen: 'Kitchen',
    bathroom: 'Bathroom',
    livingRoom: 'Living Room',
    exitDoor: 'Exit Door'
  };

  return id ? lookup[id] : titleCase(value || 'Living Room');
}

function alertFromText(text: string, timestamp: string, severity: GuardianStatus): AlertItem {
  return {
    id: text.toLowerCase().replace(/\W+/g, '-'),
    title: text,
    details: `${text}. AI confidence and sensor fusion indicate staff review is recommended.`,
    timestamp,
    severity,
    expanded: false
  };
}

function mergeAlerts(previous: AlertItem[], incoming: AlertItem[]): AlertItem[] {
  const merged = [...incoming, ...previous.filter((alert) => !incoming.some((item) => item.id === alert.id))];
  return merged.slice(0, 6);
}

function prependTimeline(previous: TimelineEntry[], entry: TimelineEntry): TimelineEntry[] {
  return [entry, ...previous].slice(0, 28);
}

function statusFromScore(score: number, level?: string): GuardianStatus {
  if (level?.toLowerCase().includes('critical')) {
    return 'CRITICAL';
  }

  if (level?.toLowerCase().includes('warn')) {
    return 'WARNING';
  }

  if (score >= 70) {
    return 'CRITICAL';
  }

  if (score >= 40) {
    return 'WARNING';
  }

  return 'NORMAL';
}

function statusFromSeverity(severity: string | undefined, fallback: GuardianStatus): GuardianStatus {
  if (!severity) {
    return fallback;
  }

  return severity.toLowerCase().includes('critical')
    ? 'CRITICAL'
    : severity.toLowerCase().includes('warn')
      ? 'WARNING'
      : 'NORMAL';
}

function interpretationFor(status: GuardianStatus, score: number): string {
  if (status === 'CRITICAL') {
    return `Risk is elevated to ${score}%. Multiple ambient indicators suggest immediate safety concern.`;
  }

  if (status === 'WARNING') {
    return `Risk is trending at ${score}%. The resident pattern is drifting from expected baseline.`;
  }

  return `Risk remains low at ${score}%. Ambient behavior is aligned with learned routine.`;
}

function recommendationFor(status: GuardianStatus): string {
  if (status === 'CRITICAL') {
    return 'Dispatch caregiver check-in immediately and verify resident wellbeing.';
  }

  if (status === 'WARNING') {
    return 'Monitor closely, prepare a gentle check-in, and watch for compounding signals.';
  }

  return 'Continue passive monitoring and preserve resident independence.';
}

function riskLabel(score: number): string {
  if (score >= 70) {
    return 'Critical';
  }

  if (score >= 40) {
    return 'Warning';
  }

  return 'Safe';
}

function normalizeTimestamp(value?: string): string {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return value ?? new Date().toLocaleTimeString([], { hour12: false });
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}

function titleCase(value: string): string {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function cryptoId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
