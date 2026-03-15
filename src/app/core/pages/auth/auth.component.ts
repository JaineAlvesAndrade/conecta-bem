import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

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

  constructor(private auth: AuthService, private router: Router) {}

  toggleMode() {
    this.isLogin = !this.isLogin;
  }

  onSubmit() {
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
        error: err => console.error('Erro no cadastro', err)
      });
    } else {
      // login via service
      this.auth.login({
        username: this.email,
        password: this.password
      }).subscribe({
        next: (res: any) => {
          console.log('Login bem sucedido', res);
          if (res && res.token) {
            this.auth.saveToken(res.token);
          }
          this.router.navigate(['home']);
        },
        error: err => console.error('Erro no login', err)
      });
    }
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  toggleShowConfirm() {
    this.showConfirm = !this.showConfirm;
  }
}