import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login-required-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './login-required-modal.component.html',
  styleUrls: ['./login-required-modal.component.scss']
})
export class LoginRequiredModalComponent {
  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) {}
  
  onClose() {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  goToLogin() {
    this.onClose();
    this.router.navigate(['/login']);
  }
}