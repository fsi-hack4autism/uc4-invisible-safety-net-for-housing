import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, Input, ViewChild } from '@angular/core';

import { SensorReading, TimelineEntry } from '../../models/dashboard.models';

@Component({
  selector: 'app-sensor-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sensor-timeline.component.html',
  styleUrl: './sensor-timeline.component.scss'
})
export class SensorTimelineComponent implements AfterViewChecked {
  @Input() entries: TimelineEntry[] = [];
  @Input() readings: SensorReading[] = [];

  @ViewChild('stream') private stream?: ElementRef<HTMLDivElement>;

  ngAfterViewChecked(): void {
    if (this.stream) {
      this.stream.nativeElement.scrollTop = 0;
    }
  }
}
