import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

import { ScenarioType } from '../../models/dashboard.models';

@Component({
  selector: 'app-scenario-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scenario-controls.component.html',
  styleUrl: './scenario-controls.component.scss'
})
export class ScenarioControlsComponent {
  @Output() runScenario = new EventEmitter<ScenarioType>();

  readonly controls: Array<{ label: string; scenario: ScenarioType; tone: string }> = [
    { label: 'Normal Routine', scenario: 'normal', tone: 'normal' },
    { label: 'Simulate Fall', scenario: 'fall', tone: 'critical' },
    { label: 'Simulate Wandering', scenario: 'wandering', tone: 'critical' },
    { label: 'Simulate Inactivity', scenario: 'inactivity', tone: 'warning' }
  ];
}
