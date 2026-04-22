import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, MatIconModule, HttpClientModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  isLogin = true;
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirm = false;
  errorMessage = '';
  emailError = '';

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {
    this.isLogin = this.route.snapshot.url[0]?.path !== 'cadastro';
  }

  toggleMode() {
    this.isLogin = !this.isLogin;

    // Reset form fields when switching between login and register modes
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.name = '';
    this.showPassword = false;
    this.showConfirm = false;

    this.errorMessage = '';
    this.emailError = '';
  }

  private isEmailValid(email: string) {
    // Basic email validation (HTML5-like)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  validateEmailOnBlur() {
    this.emailError = this.isEmailValid(this.email) ? '' : 'auth.error.invalidEmail';
  }

  onSubmit() {
    // Clear previous errors on every submit
    this.errorMessage = '';
    this.emailError = '';

    if (!this.isEmailValid(this.email)) {
      this.emailError = 'auth.error.invalidEmail';
      return;
    }

    if (!this.isLogin && this.password !== this.confirmPassword) {
      console.error('As senhas não coincidem');
      return;
    }

    if (!this.isLogin) {
      // register using service
      this.auth.register({
        email: this.email,
        fullName: this.name,
        username: this.email,
        password: this.password
      }).subscribe({
        next: (res: any) => {
          console.log('Cadastro realizado', res);
          if (res && res.token) {
            this.auth.saveToken(res.token);
          }
          this.router.navigate(['home']);
        },
        error: err => {
          console.error('Erro no cadastro', err);
          this.errorMessage = 'auth.error.generic';
        }
      });
    } else {
      // login via service
      this.auth.login({
        username: this.email,
        password: this.password
      }).subscribe({
        next: (res: any) => {
          console.log('Login bem sucedido', res);

          // Validate that the request returned a 200 and there is a token
          if (res?.status !== 200 || !res?.body?.token) {
            this.errorMessage = 'auth.error.invalidCredentials';
            return;
          }

          this.auth.saveToken(res.body.token);
          this.router.navigate(['home']);
        },
        error: err => {
          console.error('Erro no login', err);
          // Treat 401/403 as invalid credentials
          if (err?.status === 401 || err?.status === 403) {
            this.errorMessage = 'auth.error.invalidCredentials';
          } else {
            this.errorMessage = 'auth.error.generic';
          }
        }
      });
    }
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  toggleShowConfirm() {
    this.showConfirm = !this.showConfirm;
  }

  goToChangePassword() {
    this.router.navigate(['/alterar-senha']);
  }
}