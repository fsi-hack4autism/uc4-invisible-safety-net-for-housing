import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges, signal } from '@angular/core';

import { GuardianStatus } from '../../models/dashboard.models';

@Component({
  selector: 'app-ai-insights',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-insights.component.html',
  styleUrl: './ai-insights.component.scss'
})
export class AiInsightsComponent implements OnChanges, OnDestroy {
  @Input() insight = '';
  @Input() anomaly = '';
  @Input() interpretation = '';
  @Input() recommendation = '';
  @Input() confidence = 0;
  @Input() status: GuardianStatus = 'NORMAL';

  readonly typedInsight = signal('');
  private typingHandle?: number;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['insight']) {
      this.startTyping(this.insight || 'Waiting for live AI reasoning...');
    }
  }

  ngOnDestroy(): void {
    window.clearInterval(this.typingHandle);
  }

  private startTyping(text: string): void {
    window.clearInterval(this.typingHandle);
    this.typedInsight.set('');

    let index = 0;
    this.typingHandle = window.setInterval(() => {
      index += 1;
      this.typedInsight.set(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(this.typingHandle);
      }
    }, 18);
  }
}
