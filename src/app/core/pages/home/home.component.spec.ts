import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { AuthService } from '../../services/auth.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    authServiceSpy.isLoggedIn.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [HomeComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 4 stats', () => {
    expect(component.stats.length).toBe(4);
  });

  it('should have stats with value, label and icon', () => {
    component.stats.forEach(stat => {
      expect(stat.value).toBeTruthy();
      expect(stat.label).toBeTruthy();
      expect(stat.icon).toBeTruthy();
    });
  });

  it('should have 3 pillars', () => {
    expect(component.pillars.length).toBe(3);
  });

  it('should have pillars with title, desc and icon', () => {
    component.pillars.forEach(pillar => {
      expect(pillar.title).toBeTruthy();
      expect(pillar.desc).toBeTruthy();
      expect(pillar.icon).toBeTruthy();
    });
  });

  it('isLoggedIn should return false when user is not logged in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(false);
    expect(component.isLoggedIn).toBeFalse();
  });

  it('isLoggedIn should return true when user is logged in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    expect(component.isLoggedIn).toBeTrue();
  });

  it('should include Voluntários Ativos stat', () => {
    const stat = component.stats.find(s => s.label === 'Voluntários Ativos');
    expect(stat).toBeDefined();
    expect(stat?.value).toContain('2.500');
  });

  it('should include Missão pillar', () => {
    const pillar = component.pillars.find(p => p.title === 'Nossa Missão');
    expect(pillar).toBeDefined();
  });
});
