import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AlertItem } from '../../models/dashboard.models';

@Component({
  selector: 'app-alerts-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts-panel.component.html',
  styleUrl: './alerts-panel.component.scss'
})
export class AlertsPanelComponent {
  @Input() alerts: AlertItem[] = [];
  @Output() toggleAlert = new EventEmitter<string>();
}
