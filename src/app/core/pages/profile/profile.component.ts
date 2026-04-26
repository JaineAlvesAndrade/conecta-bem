// profile.component.ts (atualizado)

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../services/user.service';
import { Gender, UserProfile } from '../../models/profile.model';

type SaveState = 'idle' | 'loading' | 'success' | 'error';
type TabType = 'personal' | 'contact' | 'password';

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
    activeTab: TabType = 'personal';
    editingSection: TabType | null = null;
    lastSavedSection: TabType | null = null;
    loadError = false;
    Gender = Gender;
    saveState: SaveState = 'idle';
    errorMessage = '';
    
    // Password form fields
    showPasswordForm = false;
    currentPassword = '';
    newPassword = '';
    confirmPassword = '';
    showCurrent = false;
    showNew = false;
    showConfirm = false;
    passwordSaveState: SaveState = 'idle';
    passwordErrorMessage = '';

    constructor(private userService: UserService) { }

    ngOnInit() {
        this.userService.getProfile().subscribe({
            next: (data) => { this.profile = data; },
            error: () => { this.loadError = true; }
        });
    }

    startEditing(section: TabType) {
        this.draft = {
            email: this.profile?.email,
            gender: this.profile?.gender,
            phone: this.profile?.phone,
            instagram: this.profile?.instagram,
            linkedin: this.profile?.linkedin,
        };
        this.editingSection = section;
        this.saveState = 'idle';
    }

    cancelEditing() {
        this.editingSection = null;
        this.draft = {};
        this.saveState = 'idle';
        this.errorMessage = '';
    }

    saveProfile() {
        this.saveState = 'loading';
        this.errorMessage = '';

        this.userService.updateProfile(this.draft).subscribe({
            next: () => {
                Object.assign(this.profile!, this.draft);
                this.lastSavedSection = this.editingSection;
                this.saveState = 'success';
                this.editingSection = null;
                
                setTimeout(() => {
                    if (this.saveState === 'success') {
                        this.saveState = 'idle';
                        this.lastSavedSection = null;
                    }
                }, 3000);
            },
            error: () => {
                this.saveState = 'error';
                this.errorMessage = 'Não foi possível salvar as alterações. Tente novamente.';
            }
        });
    }

    get passwordMismatch(): boolean {
        return !!this.confirmPassword && this.newPassword !== this.confirmPassword;
    }

    get passwordMatch(): boolean {
        return !!this.confirmPassword && this.newPassword === this.confirmPassword;
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
                
                setTimeout(() => {
                    if (this.passwordSaveState === 'success') {
                        this.passwordSaveState = 'idle';
                    }
                }, 3000);
            },
            error: () => {
                this.passwordSaveState = 'error';
                this.passwordErrorMessage = 'Senha atual incorreta ou erro ao alterar. Tente novamente.';
            }
        });
    }

    getGenderLabel(gender: string): string {
        const labels: Record<string, string> = {
            'MALE': 'Masculino',
            'FEMALE': 'Feminino',
            'NON_BINARY': 'Não binário',
            'OTHER': 'Outro',
            'PREFER_NOT_TO_SAY': 'Prefiro não informar'
        };
        return labels[gender] || gender;
    }
}