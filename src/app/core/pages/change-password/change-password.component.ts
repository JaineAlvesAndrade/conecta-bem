import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type FormState = 'idle' | 'loading' | 'success' | 'error';
type View = 'change' | 'forgot' | 'forgot-success';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {
  email = '';
  showCurrent = false;
  showNew = false;
  showConfirm = false;
  forgotEmail = '';
  view: View = 'forgot';
  state: FormState = 'idle';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onForgotSubmit() {
    this.state = 'loading';
    this.errorMessage = '';

    this.authService.forgotPassword(this.forgotEmail).subscribe({
      next: () => { this.view = 'forgot-success'; this.state = 'idle'; },
      error: () => { this.view = 'forgot-success'; this.state = 'idle'; }
    });
  }

  showForgot() {
    this.view = 'forgot';
    this.state = 'idle';
    this.errorMessage = '';
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}