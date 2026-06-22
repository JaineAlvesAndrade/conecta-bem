import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ChangePasswordComponent } from './change-password.component';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

describe('ChangePasswordComponent', () => {
  let component: ChangePasswordComponent;
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['forgotPassword', 'isLoggedIn']);
    userServiceSpy = jasmine.createSpyObj('UserService', ['updatePassword']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ChangePasswordComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).overrideComponent(ChangePasswordComponent, {
      set: { imports: [CommonModule, FormsModule], schemas: [NO_ERRORS_SCHEMA] }
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start in forgot view', () => {
    expect(component.view).toBe('forgot');
    expect(component.state).toBe('idle');
  });

  describe('passwordMismatch', () => {
    it('should return false when confirmPassword is empty', () => {
      component.newPassword = 'abc123';
      component.confirmPassword = '';
      expect(component.passwordMismatch).toBeFalse();
    });

    it('should return true when passwords differ', () => {
      component.newPassword = 'abc123';
      component.confirmPassword = 'xyz789';
      expect(component.passwordMismatch).toBeTrue();
    });

    it('should return false when passwords match', () => {
      component.newPassword = 'abc123';
      component.confirmPassword = 'abc123';
      expect(component.passwordMismatch).toBeFalse();
    });
  });

  describe('toggles', () => {
    it('should toggle showTempPassword', () => {
      expect(component.showTempPassword).toBeFalse();
      component.toggleShowTempPassword();
      expect(component.showTempPassword).toBeTrue();
      component.toggleShowTempPassword();
      expect(component.showTempPassword).toBeFalse();
    });

    it('should toggle showNew', () => {
      expect(component.showNew).toBeFalse();
      component.toggleShowNew();
      expect(component.showNew).toBeTrue();
    });

    it('should toggle showConfirm', () => {
      expect(component.showConfirm).toBeFalse();
      component.toggleShowConfirm();
      expect(component.showConfirm).toBeTrue();
    });
  });

  describe('onForgotSubmit', () => {
    it('should transition to forgot-success view on success', () => {
      authServiceSpy.forgotPassword.and.returnValue(of(undefined));
      component.forgotEmail = 'user@example.com';
      component.onForgotSubmit();
      expect(component.view).toBe('forgot-success');
      expect(component.resetEmail).toBe('user@example.com');
      expect(component.state).toBe('idle');
    });

    it('should also transition to forgot-success view on error (security by design)', () => {
      authServiceSpy.forgotPassword.and.returnValue(throwError(() => new Error('error')));
      component.forgotEmail = 'user@example.com';
      component.onForgotSubmit();
      expect(component.view).toBe('forgot-success');
      expect(component.resetEmail).toBe('user@example.com');
    });

    it('should call forgotPassword with the email', () => {
      authServiceSpy.forgotPassword.and.returnValue(of(undefined));
      component.forgotEmail = 'user@example.com';
      component.onForgotSubmit();
      expect(authServiceSpy.forgotPassword).toHaveBeenCalledWith('user@example.com');
    });
  });

  describe('goToReset', () => {
    it('should switch to reset view and reset state', () => {
      component.view = 'forgot-success';
      component.state = 'error';
      component.errorMessage = 'some error';
      component.goToReset();
      expect(component.view).toBe('reset');
      expect(component.state).toBe('idle');
      expect(component.errorMessage).toBe('');
    });
  });

  describe('onResetSubmit', () => {
    beforeEach(() => {
      component.view = 'reset';
      component.resetEmail = 'user@example.com';
      component.temporaryPassword = 'temp123';
      component.newPassword = 'newPass1';
      component.confirmPassword = 'newPass1';
    });

    it('should not call updatePassword when passwords mismatch', () => {
      component.confirmPassword = 'different';
      component.onResetSubmit();
      expect(userServiceSpy.updatePassword).not.toHaveBeenCalled();
    });

    it('should call updatePassword with correct payload', () => {
      userServiceSpy.updatePassword.and.returnValue(of({}));
      component.onResetSubmit();
      expect(userServiceSpy.updatePassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        temporaryPassword: 'temp123',
        newPassword: 'newPass1'
      });
    });

    it('should transition to reset-success on success', () => {
      userServiceSpy.updatePassword.and.returnValue(of({}));
      component.onResetSubmit();
      expect(component.view).toBe('reset-success');
      expect(component.state).toBe('idle');
    });

    it('should set error message on 410 (expired)', () => {
      userServiceSpy.updatePassword.and.returnValue(throwError(() => ({ status: 410 })));
      component.onResetSubmit();
      expect(component.state).toBe('error');
      expect(component.errorMessage).toContain('expirou');
    });

    it('should set error message on 401 (invalid temp password)', () => {
      userServiceSpy.updatePassword.and.returnValue(throwError(() => ({ status: 401 })));
      component.onResetSubmit();
      expect(component.state).toBe('error');
      expect(component.errorMessage).toContain('inválida');
    });

    it('should set error message on 400 (same password)', () => {
      userServiceSpy.updatePassword.and.returnValue(throwError(() => ({ status: 400 })));
      component.onResetSubmit();
      expect(component.state).toBe('error');
      expect(component.errorMessage).toContain('igual');
    });

    it('should set generic error on other errors', () => {
      userServiceSpy.updatePassword.and.returnValue(throwError(() => ({ status: 500 })));
      component.onResetSubmit();
      expect(component.state).toBe('error');
      expect(component.errorMessage).toContain('Ocorreu um erro');
    });
  });

  describe('backToForgot', () => {
    it('should reset all fields and return to forgot view', () => {
      component.forgotEmail = 'a@b.com';
      component.resetEmail = 'a@b.com';
      component.temporaryPassword = 'temp';
      component.newPassword = 'new';
      component.confirmPassword = 'new';
      component.view = 'reset';
      component.state = 'error';
      component.errorMessage = 'error';
      component.backToForgot();
      expect(component.forgotEmail).toBe('');
      expect(component.resetEmail).toBe('');
      expect(component.temporaryPassword).toBe('');
      expect(component.newPassword).toBe('');
      expect(component.confirmPassword).toBe('');
      expect(component.view).toBe('forgot');
      expect(component.state).toBe('idle');
      expect(component.errorMessage).toBe('');
    });
  });

  describe('goToLogin', () => {
    it('should navigate to /login', () => {
      component.goToLogin();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
