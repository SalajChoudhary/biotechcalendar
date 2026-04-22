import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { CatalystResponse } from '../../../core/models/catalyst.model';

@Component({
  selector: 'app-catalyst-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatChipsModule],
  templateUrl: './catalyst-detail-dialog.html',
})
export class CatalystDetailDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public catalyst: CatalystResponse) {}
}
