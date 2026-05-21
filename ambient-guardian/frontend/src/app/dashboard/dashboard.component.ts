import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';

import { AiInsightsComponent } from '../components/ai-insights/ai-insights.component';
import { AlertsPanelComponent } from '../components/alerts-panel/alerts-panel.component';
import { FloorMapComponent } from '../components/floor-map/floor-map.component';
import { RiskGaugeComponent } from '../components/risk-gauge/risk-gauge.component';
import { ScenarioControlsComponent } from '../components/scenario-controls/scenario-controls.component';
import { SensorTimelineComponent } from '../components/sensor-timeline/sensor-timeline.component';
import { StatusCardComponent } from '../components/status-card/status-card.component';
import { ScenarioType } from '../models/dashboard.models';
import { DashboardStateService } from '../services/dashboard-state.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StatusCardComponent,
    FloorMapComponent,
    AiInsightsComponent,
    AlertsPanelComponent,
    RiskGaugeComponent,
    SensorTimelineComponent
    ,
    ScenarioControlsComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  readonly dashboardState = inject(DashboardStateService);
  readonly state = this.dashboardState.state;
  readonly statusCards = this.dashboardState.statusCards;

  ngOnInit(): void {
    this.dashboardState.initialize();
  }

  runScenario(scenario: ScenarioType): void {
    this.dashboardState.runScenario(scenario);
  }

  toggleAlert(alertId: string): void {
    this.dashboardState.toggleAlert(alertId);
  }
}
