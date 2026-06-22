import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reject-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './reject-modal.component.html',
  styleUrls: ['./reject-modal.component.scss']
})
export class RejectModalComponent {
  @Input() volunteerName = '';
  @Output() confirm = new EventEmitter<string | undefined>();
  @Output() close = new EventEmitter<void>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      justification: ['']
    });
  }

  onConfirm(): void {
    const justification = this.form.value.justification?.trim() || undefined;
    this.confirm.emit(justification);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
