import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthComponent } from './auth.component';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { Gender } from '../../models/profile.model';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

const makeActivatedRoute = (path: string) => ({
  snapshot: { data: {}, url: [{ path }] }
});

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const configureModule = async (path = 'login') => {
    authSpy = jasmine.createSpyObj('AuthService', ['login', 'register', 'saveToken', 'isLoggedIn', 'forgotPassword']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AuthComponent, TranslateModule.forRoot(), HttpClientTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: makeActivatedRoute(path) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => TestBed.resetTestingModule());

  describe('modo login (/login)', () => {
    beforeEach(async () => configureModule('login'));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should start in login mode when path is /login', () => {
      expect(component.isLogin).toBeTrue();
    });

    it('toggleMode should switch to register mode', () => {
      component.toggleMode();
      expect(component.isLogin).toBeFalse();
    });

    it('toggleMode twice should return to login mode', () => {
      component.toggleMode();
      component.toggleMode();
      expect(component.isLogin).toBeTrue();
    });

    it('toggleMode should clear form fields', () => {
      component.email = 'test@test.com';
      component.password = 'secret';
      component.toggleMode();
      expect(component.email).toBe('');
      expect(component.password).toBe('');
    });
  });

  describe('modo cadastro (/cadastro)', () => {
    beforeEach(async () => configureModule('cadastro'));

    it('should start in register mode when path is /cadastro', () => {
      expect(component.isLogin).toBeFalse();
    });
  });

  describe('validateEmailOnBlur', () => {
    beforeEach(async () => configureModule());

    it('should set no error for valid email', () => {
      component.email = 'user@example.com';
      component.validateEmailOnBlur();
      expect(component.emailError).toBe('');
    });

    it('should set error for invalid email', () => {
      component.email = 'invalid-email';
      component.validateEmailOnBlur();
      expect(component.emailError).toBe('auth.error.invalidEmail');
    });

    it('should set error for email without domain', () => {
      component.email = 'user@';
      component.validateEmailOnBlur();
      expect(component.emailError).toBe('auth.error.invalidEmail');
    });
  });

  describe('passwordMismatch', () => {
    beforeEach(async () => configureModule());

    it('should return false when confirmPassword is empty', () => {
      component.password = 'abc123';
      component.confirmPassword = '';
      expect(component.passwordMismatch).toBeFalse();
    });

    it('should return true when passwords differ', () => {
      component.password = 'abc123';
      component.confirmPassword = 'xyz789';
      expect(component.passwordMismatch).toBeTrue();
    });

    it('should return false when passwords match', () => {
      component.password = 'abc123';
      component.confirmPassword = 'abc123';
      expect(component.passwordMismatch).toBeFalse();
    });
  });

  describe('validateCpfCnpj', () => {
    beforeEach(async () => configureModule());

    it('should clear error when cpfCnpj is empty', () => {
      component.cpfCnpj = '';
      component.validateCpfCnpj();
      expect(component.cpfCnpjError).toBe('');
    });

    it('should set invalid error for wrong length', () => {
      component.cpfCnpj = '123.456.789';
      component.validateCpfCnpj();
      expect(component.cpfCnpjError).toBe('auth.error.invalidCpfCnpj');
    });

    it('should set invalid CPF error for invalid CPF', () => {
      component.cpfCnpj = '111.111.111-11';
      component.validateCpfCnpj();
      expect(component.cpfCnpjError).toBe('auth.error.invalidCpf');
    });

    it('should clear error for valid CPF', () => {
      component.cpfCnpj = '529.982.247-25';
      component.validateCpfCnpj();
      expect(component.cpfCnpjError).toBe('');
    });
  });

  describe('onCpfCnpjInput', () => {
    beforeEach(async () => configureModule());

    it('should format CPF digits', () => {
      component.cpfCnpj = '12345678901';
      component.onCpfCnpjInput();
      expect(component.cpfCnpj).toBe('123.456.789-01');
    });

    it('should clear cpfCnpjError on input', () => {
      component.cpfCnpjError = 'auth.error.invalidCpf';
      component.cpfCnpj = '123';
      component.onCpfCnpjInput();
      expect(component.cpfCnpjError).toBe('');
    });
  });

  describe('onPhoneInput', () => {
    beforeEach(async () => configureModule());

    it('should format landline phone', () => {
      component.phone = '1133334444';
      component.onPhoneInput();
      expect(component.phone).toBe('(11) 3333-4444');
    });

    it('should format mobile phone', () => {
      component.phone = '11999998888';
      component.onPhoneInput();
      expect(component.phone).toBe('(11) 99999-8888');
    });
  });

  describe('toggleShowPassword / toggleShowConfirm', () => {
    beforeEach(async () => configureModule());

    it('should toggle showPassword', () => {
      expect(component.showPassword).toBeFalse();
      component.toggleShowPassword();
      expect(component.showPassword).toBeTrue();
      component.toggleShowPassword();
      expect(component.showPassword).toBeFalse();
    });

    it('should toggle showConfirm', () => {
      expect(component.showConfirm).toBeFalse();
      component.toggleShowConfirm();
      expect(component.showConfirm).toBeTrue();
    });
  });

  describe('goToChangePassword', () => {
    beforeEach(async () => configureModule());

    it('should navigate to /alterar-senha', () => {
      component.goToChangePassword();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/alterar-senha']);
    });
  });

  describe('onSubmit - login', () => {
    beforeEach(async () => configureModule('login'));

    it('should set emailError and return if email is invalid', () => {
      component.email = 'bad-email';
      component.password = '123456';
      component.onSubmit();
      expect(component.emailError).toBe('auth.error.invalidEmail');
      expect(authSpy.login).not.toHaveBeenCalled();
    });

    it('should call authService.login with valid credentials', () => {
      authSpy.login.and.returnValue(of({ status: 200, body: { jwtToken: 'tok', userId: '1' } } as any));
      component.email = 'user@example.com';
      component.password = '123456';
      component.onSubmit();
      expect(authSpy.login).toHaveBeenCalledWith({ username: 'user@example.com', password: '123456' });
    });

    it('should save token and navigate on successful login', () => {
      authSpy.login.and.returnValue(of({ status: 200, body: { jwtToken: 'mytoken', userId: '42' } } as any));
      component.email = 'user@example.com';
      component.password = 'pass';
      component.onSubmit();
      expect(authSpy.saveToken).toHaveBeenCalledWith('mytoken', '42');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should set invalidCredentials error on 401 response', () => {
      authSpy.login.and.returnValue(throwError(() => ({ status: 401 })));
      component.email = 'user@example.com';
      component.password = 'wrongpass';
      component.onSubmit();
      expect(component.errorMessage).toBe('auth.error.invalidCredentials');
    });

    it('should set generic error on other login errors', () => {
      authSpy.login.and.returnValue(throwError(() => ({ status: 500 })));
      component.email = 'user@example.com';
      component.password = 'pass';
      component.onSubmit();
      expect(component.errorMessage).toBe('auth.error.generic');
    });
  });

  describe('onSubmit - register', () => {
    beforeEach(async () => configureModule('cadastro'));

    it('should call authService.register with valid data', () => {
      authSpy.register.and.returnValue(of({}));
      component.email = 'new@example.com';
      component.password = 'pass123';
      component.confirmPassword = 'pass123';
      component.name = 'Test User';
      component.cpfCnpj = '529.982.247-25';
      component.birthDate = '1990-01-01';
      component.gender = Gender.MALE;
      component.phone = '11999998888';
      component.onSubmit();
      expect(authSpy.register).toHaveBeenCalled();
    });

    it('should not register if passwords mismatch', () => {
      component.email = 'new@example.com';
      component.password = 'pass123';
      component.confirmPassword = 'different';
      component.cpfCnpj = '529.982.247-25';
      component.onSubmit();
      expect(authSpy.register).not.toHaveBeenCalled();
    });

    it('should set generic error on register failure', () => {
      authSpy.register.and.returnValue(throwError(() => ({ status: 500 })));
      component.email = 'new@example.com';
      component.password = 'pass123';
      component.confirmPassword = 'pass123';
      component.cpfCnpj = '529.982.247-25';
      component.onSubmit();
      expect(component.errorMessage).toBe('auth.error.generic');
    });
  });
});
