import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { UserService } from '../../services/user.service';
import { Gender, UserProfile } from '../../models/profile.model';

const mockProfile: UserProfile = {
  fullName: 'Ana Silva',
  email: 'ana@example.com',
  cpfCnpj: '529.982.247-25',
  birthDate: '1990-06-15',
  gender: Gender.FEMALE,
  phone: '(11) 99999-0000',
  instagram: '@ana',
  linkedin: 'linkedin.com/in/ana'
};

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['getProfile', 'updateProfile', 'updatePassword']);
    userServiceSpy.getProfile.and.returnValue(of(mockProfile));

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: UserService, useValue: userServiceSpy }]
    }).overrideComponent(ProfileComponent, {
      set: { imports: [CommonModule, FormsModule], schemas: [NO_ERRORS_SCHEMA] }
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load profile on init', () => {
      expect(userServiceSpy.getProfile).toHaveBeenCalledTimes(1);
      expect(component.profile).toEqual(mockProfile);
    });

    it('should set loadError to true on profile fetch failure', async () => {
      userServiceSpy.getProfile.and.returnValue(throwError(() => new Error('error')));
      TestBed.resetTestingModule();

      await TestBed.configureTestingModule({
        imports: [ProfileComponent],
        schemas: [NO_ERRORS_SCHEMA],
        providers: [{ provide: UserService, useValue: userServiceSpy }]
      }).overrideComponent(ProfileComponent, {
        set: { imports: [CommonModule, FormsModule], schemas: [NO_ERRORS_SCHEMA] }
      }).compileComponents();

      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.loadError).toBeTrue();
    });
  });

  describe('startEditing / cancelEditing', () => {
    it('should set editingSection and populate draft', () => {
      component.startEditing('personal');
      expect(component.editingSection).toBe('personal');
      expect(component.draft.email).toBe(mockProfile.email);
    });

    it('should reset editing state on cancel', () => {
      component.startEditing('contact');
      component.cancelEditing();
      expect(component.editingSection).toBeNull();
      expect(component.draft).toEqual({});
      expect(component.saveState).toBe('idle');
      expect(component.errorMessage).toBe('');
      expect(component.cpfCnpjError).toBe('');
    });
  });

  describe('saveProfile', () => {
    beforeEach(() => {
      component.startEditing('contact');
    });

    it('should call updateProfile and set success state', fakeAsync(() => {
      userServiceSpy.updateProfile.and.returnValue(of({}));
      component.saveProfile();
      expect(userServiceSpy.updateProfile).toHaveBeenCalled();
      expect(component.saveState).toBe('success');
      expect(component.editingSection).toBeNull();
      tick(3000);
      expect(component.saveState).toBe('idle');
    }));

    it('should set error state on updateProfile failure', () => {
      userServiceSpy.updateProfile.and.returnValue(throwError(() => new Error('error')));
      component.saveProfile();
      expect(component.saveState).toBe('error');
      expect(component.errorMessage).toBeTruthy();
    });

    it('should not call updateProfile when cpfCnpjError is set', () => {
      component.draft.cpfCnpj = '111.111.111-11';
      component.saveProfile();
      expect(userServiceSpy.updateProfile).not.toHaveBeenCalled();
    });
  });

  describe('passwordMismatch / passwordMatch', () => {
    it('should return false for mismatch when confirmPassword is empty', () => {
      component.newPassword = 'abc';
      component.confirmPassword = '';
      expect(component.passwordMismatch).toBeFalse();
      expect(component.passwordMatch).toBeFalse();
    });

    it('should return true for mismatch when passwords differ', () => {
      component.newPassword = 'abc123';
      component.confirmPassword = 'xyz789';
      expect(component.passwordMismatch).toBeTrue();
      expect(component.passwordMatch).toBeFalse();
    });

    it('should return true for match when passwords are equal', () => {
      component.newPassword = 'securePass1';
      component.confirmPassword = 'securePass1';
      expect(component.passwordMismatch).toBeFalse();
      expect(component.passwordMatch).toBeTrue();
    });
  });

  describe('savePassword', () => {
    it('should not call updatePassword when passwords mismatch', () => {
      component.newPassword = 'abc';
      component.confirmPassword = 'xyz';
      component.savePassword();
      expect(userServiceSpy.updatePassword).not.toHaveBeenCalled();
    });

    it('should not call updatePassword when profile email is missing', () => {
      component.profile = null;
      component.newPassword = 'abc';
      component.confirmPassword = 'abc';
      component.savePassword();
      expect(userServiceSpy.updatePassword).not.toHaveBeenCalled();
    });

    it('should call updatePassword with correct payload', fakeAsync(() => {
      userServiceSpy.updatePassword.and.returnValue(of({}));
      component.currentPassword = 'oldPass';
      component.newPassword = 'newPass123';
      component.confirmPassword = 'newPass123';
      component.savePassword();
      expect(userServiceSpy.updatePassword).toHaveBeenCalledWith({
        email: mockProfile.email,
        currentPassword: 'oldPass',
        newPassword: 'newPass123'
      });
      expect(component.passwordSaveState).toBe('success');
      tick(3000);
      expect(component.passwordSaveState).toBe('idle');
    }));

    it('should set error state on updatePassword failure', () => {
      userServiceSpy.updatePassword.and.returnValue(throwError(() => new Error('error')));
      component.currentPassword = 'oldPass';
      component.newPassword = 'newPass123';
      component.confirmPassword = 'newPass123';
      component.savePassword();
      expect(component.passwordSaveState).toBe('error');
      expect(component.passwordErrorMessage).toBeTruthy();
    });
  });

  describe('getGenderLabel', () => {
    it('should return Masculino for MALE', () => {
      expect(component.getGenderLabel('MALE')).toBe('Masculino');
    });

    it('should return Feminino for FEMALE', () => {
      expect(component.getGenderLabel('FEMALE')).toBe('Feminino');
    });

    it('should return Não binário for NON_BINARY', () => {
      expect(component.getGenderLabel('NON_BINARY')).toBe('Não binário');
    });

    it('should return Outro for OTHER', () => {
      expect(component.getGenderLabel('OTHER')).toBe('Outro');
    });

    it('should return Prefiro não informar for PREFER_NOT_TO_SAY', () => {
      expect(component.getGenderLabel('PREFER_NOT_TO_SAY')).toBe('Prefiro não informar');
    });

    it('should return original string for unknown gender', () => {
      expect(component.getGenderLabel('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('validateCpfCnpjProfile', () => {
    it('should clear error for empty cpfCnpj', () => {
      component.draft.cpfCnpj = '';
      component.validateCpfCnpjProfile();
      expect(component.cpfCnpjError).toBe('');
    });

    it('should set error for invalid length', () => {
      component.draft.cpfCnpj = '123.456';
      component.validateCpfCnpjProfile();
      expect(component.cpfCnpjError).toBe('CPF/CNPJ inválido');
    });

    it('should set error for invalid CPF', () => {
      component.draft.cpfCnpj = '111.111.111-11';
      component.validateCpfCnpjProfile();
      expect(component.cpfCnpjError).toBe('CPF inválido');
    });

    it('should clear error for valid CPF', () => {
      component.draft.cpfCnpj = '529.982.247-25';
      component.validateCpfCnpjProfile();
      expect(component.cpfCnpjError).toBe('');
    });
  });

  describe('onCpfCnpjInputProfile', () => {
    it('should format CPF as user types', () => {
      component.draft.cpfCnpj = '52998224725';
      component.onCpfCnpjInputProfile();
      expect(component.draft.cpfCnpj).toBe('529.982.247-25');
    });

    it('should clear cpfCnpjError on input', () => {
      component.cpfCnpjError = 'CPF inválido';
      component.draft.cpfCnpj = '123';
      component.onCpfCnpjInputProfile();
      expect(component.cpfCnpjError).toBe('');
    });
  });
});
