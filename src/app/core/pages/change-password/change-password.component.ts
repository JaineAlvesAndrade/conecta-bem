import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

type FormState = 'idle' | 'loading' | 'success' | 'error';
type View = 'forgot' | 'reset' | 'forgot-success' | 'reset-success';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {
  forgotEmail = '';
  resetEmail = '';
  temporaryPassword = '';
  newPassword = '';
  confirmPassword = '';
  showTempPassword = false;
  showNew = false;
  showConfirm = false;
  view: View = 'forgot';
  state: FormState = 'idle';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  onForgotSubmit() {
    this.state = 'loading';
    this.errorMessage = '';

    this.authService.forgotPassword(this.forgotEmail).subscribe({
      next: () => {
        this.resetEmail = this.forgotEmail;
        this.view = 'forgot-success';
        this.state = 'idle';
      },
      error: () => {
        this.resetEmail = this.forgotEmail;
        this.view = 'forgot-success';
        this.state = 'idle';
      }
    });
  }

  goToReset() {
    this.view = 'reset';
    this.state = 'idle';
    this.errorMessage = '';
  }

  onResetSubmit() {
    if (this.passwordMismatch) return;

    this.state = 'loading';
    this.errorMessage = '';

    this.userService.updatePassword({
      email: this.resetEmail,
      temporaryPassword: this.temporaryPassword,
      newPassword: this.newPassword,
    }).subscribe({
      next: () => {
        this.view = 'reset-success';
        this.state = 'idle';
      },
      error: (err) => {
        this.state = 'error';
        if (err?.status === 410) {
          this.errorMessage = 'A senha temporária expirou. Solicite uma nova.';
        } else if (err?.status === 401) {
          this.errorMessage = 'Senha temporária inválida.';
        } else if (err?.status === 400) {
          this.errorMessage = 'A nova senha não pode ser igual à senha atual.';
        } else {
          this.errorMessage = 'Ocorreu um erro. Tente novamente.';
        }
      }
    });
  }

  backToForgot() {
    this.forgotEmail = '';
    this.resetEmail = '';
    this.temporaryPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.view = 'forgot';
    this.state = 'idle';
    this.errorMessage = '';
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  get passwordMismatch(): boolean {
    return !!this.confirmPassword && this.newPassword !== this.confirmPassword;
  }

  toggleShowTempPassword() { this.showTempPassword = !this.showTempPassword; }
  toggleShowNew()          { this.showNew = !this.showNew; }
  toggleShowConfirm()      { this.showConfirm = !this.showConfirm; }
}