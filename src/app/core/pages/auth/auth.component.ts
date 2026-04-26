import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, MatIconModule, HttpClientModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  isLogin = true;
  email = '';
  password = '';
  showPassword = false;
  showConfirm = false;
  errorMessage = '';
  emailError = '';
  name = '';
  confirmPassword = '';
  cpfCnpj = '';
  birthDate = '';
  gender = '';
  phone = '';
  instagram = '';
  linkedin = '';
  cpfCnpjError = '';


  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const mode = this.route.snapshot.data['mode'];
    this.isLogin = mode !== 'register';
     this.isLogin = this.route.snapshot.url[0]?.path !== 'cadastro';
  }

  toggleMode() {
    this.isLogin = !this.isLogin;
    this.resetForm();
  }

  private resetForm() {
    this.email = ''; this.password = ''; this.confirmPassword = '';
    this.name = ''; this.cpfCnpj = ''; this.birthDate = '';
    this.gender = ''; this.phone = ''; this.instagram = ''; this.linkedin = '';
    this.showPassword = false; this.showConfirm = false;
    this.errorMessage = ''; this.emailError = ''; this.cpfCnpjError = '';
  }

  private isEmailValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  validateEmailOnBlur() {
    this.emailError = this.isEmailValid(this.email) ? '' : 'auth.error.invalidEmail';
  }

  private stripMask(value: string): string {
    return value.replace(/\D/g, '');
  }

  private isValidCpf(cpf: string): boolean {
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
    let r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    if (r !== parseInt(cpf[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
    r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    return r === parseInt(cpf[10]);
  }

  private isValidCnpj(cnpj: string): boolean {
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
    const calc = (n: string, weights: number[]) =>
      weights.reduce((sum, w, i) => sum + parseInt(n[i]) * w, 0);
    const mod = (n: number) => { const r = n % 11; return r < 2 ? 0 : 11 - r; };
    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    return mod(calc(cnpj, w1)) === parseInt(cnpj[12]) &&
           mod(calc(cnpj, w2)) === parseInt(cnpj[13]);
  }

  validateCpfCnpj() {
    const digits = this.stripMask(this.cpfCnpj);
    if (!digits) { this.cpfCnpjError = ''; return; }
    if (digits.length === 11) {
      this.cpfCnpjError = this.isValidCpf(digits) ? '' : 'auth.error.invalidCpf';
    } else if (digits.length === 14) {
      this.cpfCnpjError = this.isValidCnpj(digits) ? '' : 'auth.error.invalidCnpj';
    } else {
      this.cpfCnpjError = 'auth.error.invalidCpfCnpj';
    }
  }

  get passwordMismatch(): boolean {
    return !!this.confirmPassword && this.password !== this.confirmPassword;
  }

  onCpfCnpjInput() {
    const digits = this.stripMask(this.cpfCnpj);
    if (digits.length <= 11) {
      this.cpfCnpj = digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      this.cpfCnpj = digits
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
    this.cpfCnpjError = '';
  }

  onPhoneInput() {
    const digits = this.stripMask(this.phone);
    if (digits.length <= 10) {
      this.phone = digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      this.phone = digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
  }

  onSubmit() {
    this.errorMessage = '';
    this.emailError = '';

    if (!this.isEmailValid(this.email)) {
      this.emailError = 'auth.error.invalidEmail';
      return;
    }

    if (!this.isLogin) {
      this.validateCpfCnpj();
      if (this.cpfCnpjError) return;
      if (this.passwordMismatch) return;

      this.auth.register({
        email: this.email,
        fullName: this.name,
        username: this.email,
        password: this.password,
        cpfCnpj: this.stripMask(this.cpfCnpj),
        birthDate: this.birthDate,
        gender: this.gender,
        phone: this.stripMask(this.phone),
        instagram: this.instagram,
        linkedin: this.linkedin,
      }).subscribe({
        next: (res: any) => {
          if (res && (res.jwtToken || res.token)) {
            this.auth.saveToken(res.jwtToken || res.token, res.userId);
          }
          this.router.navigate(['/']);
        },
        error: () => { this.errorMessage = 'auth.error.generic'; }
      });
    } else {
      this.auth.login({ username: this.email, password: this.password }).subscribe({
        next: (res: any) => {
          if (res?.status !== 200 || !res?.body?.jwtToken) {
            this.errorMessage = 'auth.error.invalidCredentials';
            return;
          }

          this.auth.saveToken(res.body.jwtToken, res.body.userId);
          this.router.navigate(['/']);
        },
        error: err => {
          this.errorMessage = (err?.status === 401 || err?.status === 403)
            ? 'auth.error.invalidCredentials'
            : 'auth.error.generic';
        }
      });
    }
  }

  toggleShowPassword() { this.showPassword = !this.showPassword; }
  toggleShowConfirm()  { this.showConfirm  = !this.showConfirm;  }

  goToChangePassword() { this.router.navigate(['/alterar-senha']); }
}