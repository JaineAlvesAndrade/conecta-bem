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
    draft: any = {};
    activeTab: TabType = 'personal';
    editingSection: TabType | null = null;
    lastSavedSection: TabType | null = null;
    loadError = false;
    Gender = Gender;

    saveState: SaveState = 'idle';
    errorMessage = '';
    cpfCnpjError = '';

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
            cpfCnpj: this.profile?.cpfCnpj,
        };
        this.editingSection = section;
        this.saveState = 'idle';
    }

    cancelEditing() {
        this.editingSection = null;
        this.draft = {};
        this.saveState = 'idle';
        this.errorMessage = '';
        this.cpfCnpjError = '';
    }

    saveProfile() {
        this.validateCpfCnpjProfile();
        if (this.cpfCnpjError) return;

        this.saveState = 'loading';
        this.errorMessage = '';

        const payload = {
            ...this.draft,
            cpfCnpj: this.stripMask(this.draft.cpfCnpj)
        };

        this.userService.updateProfile(payload).subscribe({
            next: () => {
                Object.assign(this.profile!, {
                    ...this.draft,
                    cpfCnpj: this.draft.cpfCnpj
                });

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

    private stripMask(value: string): string {
        return value?.replace(/\D/g, '') || '';
    }

    onCpfCnpjInputProfile() {
        const digits = this.stripMask(this.draft.cpfCnpj || '');

        if (digits.length <= 11) {
            this.draft.cpfCnpj = digits
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            this.draft.cpfCnpj = digits
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
        }

        this.cpfCnpjError = '';
    }

    validateCpfCnpjProfile() {
        const digits = this.stripMask(this.draft.cpfCnpj || '');

        if (!digits) {
            this.cpfCnpjError = '';
            return;
        }

        if (digits.length === 11) {
            this.cpfCnpjError = this.isValidCpf(digits) ? '' : 'CPF inválido';
        } else if (digits.length === 14) {
            this.cpfCnpjError = this.isValidCnpj(digits) ? '' : 'CNPJ inválido';
        } else {
            this.cpfCnpjError = 'CPF/CNPJ inválido';
        }
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

        const mod = (n: number) => {
            const r = n % 11;
            return r < 2 ? 0 : 11 - r;
        };

        const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

        return mod(calc(cnpj, w1)) === parseInt(cnpj[12]) &&
               mod(calc(cnpj, w2)) === parseInt(cnpj[13]);
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