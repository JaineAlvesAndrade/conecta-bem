import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent {
  isLogin = true;
  name = '';
  email = '';
  password = '';
  role = 'VOLUNTARIO';

  toggleMode() {
    this.isLogin = !this.isLogin;
  }

  onSubmit() {
    console.log('Dados enviados:', { 
      email: this.email, 
      password: this.password, 
      name: this.name, 
      role: this.role 
    });
  }
}