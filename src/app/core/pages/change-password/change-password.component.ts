import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

type FormState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {
  email = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  showCurrent = false;
  showNew = false;
  showConfirm = false;

  state: FormState = 'idle';
  errorMessage = '';

  constructor(private userService: UserService, private router: Router) {}

  get passwordMismatch(): boolean {
    return !!this.confirmPassword && this.newPassword !== this.confirmPassword;
  }

  get passwordMatch(): boolean {
    return !!this.confirmPassword && this.newPassword === this.confirmPassword;
  }

  onSubmit() {
    if (this.passwordMismatch) return;

    this.state = 'loading';
    this.errorMessage = '';

    this.userService.updatePassword({
      email: this.email,
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.state = 'success';
      },
      error: () => {
        this.state = 'error';
        this.errorMessage = 'Não foi possível alterar a senha. Verifique seus dados e tente novamente.';
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}