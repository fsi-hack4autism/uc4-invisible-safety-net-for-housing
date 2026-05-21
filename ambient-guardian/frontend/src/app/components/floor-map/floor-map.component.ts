import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { ActiveSensors, GuardianStatus, RoomId } from '../../models/dashboard.models';

@Component({
  selector: 'app-floor-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floor-map.component.html',
  styleUrl: './floor-map.component.scss'
})
export class FloorMapComponent {
  @Input({ required: true }) activeSensors!: ActiveSensors;
  @Input() activeRoom = 'Bedroom';
  @Input() status: GuardianStatus = 'NORMAL';

  readonly rooms: Array<{ id: RoomId; label: string; className: string }> = [
    { id: 'bedroom', label: 'Bedroom', className: 'bedroom' },
    { id: 'kitchen', label: 'Kitchen', className: 'kitchen' },
    { id: 'bathroom', label: 'Bathroom', className: 'bathroom' },
    { id: 'livingRoom', label: 'Living Room', className: 'living-room' },
    { id: 'exitDoor', label: 'Exit Door', className: 'exit-door' }
  ];
}
