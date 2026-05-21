import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { BackendSnapshotPayload, ScenarioType } from '../models/dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:8000';

  getSnapshot() {
    return this.http.get<BackendSnapshotPayload | { message: string }>(`${this.baseUrl}/api/snapshot`);
  }

  runScenario(scenario: ScenarioType) {
    return this.http.post<BackendSnapshotPayload>(`${this.baseUrl}/api/scenarios/${scenario}`, {});
  }
}
