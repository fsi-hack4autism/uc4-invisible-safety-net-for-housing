import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { StatusCardViewModel } from '../../models/dashboard.models';

@Component({
  selector: 'app-status-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-card.component.html',
  styleUrl: './status-card.component.scss'
})
export class StatusCardComponent {
  @Input({ required: true }) card!: StatusCardViewModel;
}
