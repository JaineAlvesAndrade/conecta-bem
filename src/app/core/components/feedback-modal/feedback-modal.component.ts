import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export interface FeedbackSubmitEvent {
  rating: number;
  comment: string;
}

@Component({
  selector: 'app-feedback-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './feedback-modal.component.html',
  styleUrls: ['./feedback-modal.component.scss']
})
export class FeedbackModalComponent {
  @Input() volunteerName = '';
  @Output() submitFeedback = new EventEmitter<FeedbackSubmitEvent>();
  @Output() close = new EventEmitter<void>();

  form: FormGroup;
  hoveredStar = signal(0);
  readonly stars = [1, 2, 3, 4, 5];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['']
    });
  }

  setRating(value: number): void {
    this.form.patchValue({ rating: value });
  }

  setHovered(value: number): void {
    this.hoveredStar.set(value);
  }

  clearHover(): void {
    this.hoveredStar.set(0);
  }

  get currentRating(): number {
    return this.form.get('rating')?.value ?? 0;
  }

  isStarActive(star: number): boolean {
    return star <= (this.hoveredStar() || this.currentRating);
  }

  onSubmit(): void {
    if (this.form.invalid || this.currentRating === 0) return;
    this.submitFeedback.emit({
      rating: this.form.value.rating,
      comment: this.form.value.comment ?? ''
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
