import { Injectable, signal } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';

import { AmbientWebSocketPayload, BackendSnapshotPayload, DashboardState } from '../models/dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private readonly socketUrl = 'ws://127.0.0.1:8000/ws/live';
  private socket?: WebSocket;
  private reconnectAttempts = 0;
  private readonly messagesSubject = new Subject<AmbientWebSocketPayload | BackendSnapshotPayload>();

  readonly connectionStatus = signal<DashboardState['connectionStatus']>('CONNECTING');
  readonly messages$: Observable<AmbientWebSocketPayload | BackendSnapshotPayload> = this.messagesSubject.asObservable();

  connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.connectionStatus.set(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');
    this.socket = new WebSocket(this.socketUrl);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.connectionStatus.set('LIVE');
    };

    this.socket.onmessage = (event) => {
      try {
        this.messagesSubject.next(JSON.parse(event.data));
      } catch {
        this.connectionStatus.set('ERROR');
      }
    };

    this.socket.onerror = () => {
      this.connectionStatus.set('ERROR');
    };

    this.socket.onclose = () => {
      this.connectionStatus.set('OFFLINE');
      this.scheduleReconnect();
    };
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = undefined;
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts += 1;
    const delay = Math.min(15000, 1000 * this.reconnectAttempts);

    timer(delay).subscribe(() => {
      this.connect();
    });
  }
}
