import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { UserService, UserProfile } from '../../services/user.service';

type SaveState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profile: UserProfile | null = null;
  draft: Partial<UserProfile> = {};

  isEditing = false;
  loadError = false;
  saveState: SaveState = 'idle';
  errorMessage = '';

  // Change-password sub-form
  showPasswordForm = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrent = false;
  showNew = false;
  showConfirm = false;
  passwordSaveState: SaveState = 'idle';
  passwordErrorMessage = '';

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.getProfile().subscribe({
      next: (data) => { this.profile = data; },
      error: () => { this.loadError = true; }
    });
  }

  // ── Profile edit ──────────────────────────────────────────────────────────

  startEditing() {
    this.draft = {
      email:     this.profile?.email,
      gender:    this.profile?.gender,
      phone:     this.profile?.phone,
      instagram: this.profile?.instagram,
      linkedin:  this.profile?.linkedin,
    };
    this.isEditing = true;
    this.saveState = 'idle';
  }

  cancelEditing() {
    this.isEditing = false;
    this.saveState = 'idle';
  }

  saveProfile() {
    this.saveState = 'loading';
    this.errorMessage = '';

    this.userService.updateProfile(this.draft).subscribe({
      next: () => {
        Object.assign(this.profile!, this.draft);
        this.saveState = 'success';
        this.isEditing = false;
      },
      error: () => {
        this.saveState = 'error';
        this.errorMessage = 'Não foi possível salvar as alterações. Tente novamente.';
      }
    });
  }

  // ── Password change ───────────────────────────────────────────────────────

  get passwordMismatch(): boolean {
    return !!this.confirmPassword && this.newPassword !== this.confirmPassword;
  }

  get passwordMatch(): boolean {
    return !!this.confirmPassword && this.newPassword === this.confirmPassword;
  }

  togglePasswordForm() {
    this.showPasswordForm = !this.showPasswordForm;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordSaveState = 'idle';
    this.passwordErrorMessage = '';
  }

  savePassword() {
    if (this.passwordMismatch || !this.profile?.email) return;

    this.passwordSaveState = 'loading';
    this.passwordErrorMessage = '';

    this.userService.updatePassword({
      email: this.profile.email,
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.passwordSaveState = 'success';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: () => {
        this.passwordSaveState = 'error';
        this.passwordErrorMessage = 'Senha atual incorreta ou erro ao alterar. Tente novamente.';
      }
    });
  }
}