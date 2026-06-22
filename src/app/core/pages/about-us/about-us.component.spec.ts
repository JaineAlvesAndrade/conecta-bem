import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AboutUsComponent } from './about-us.component';

describe('AboutUsComponent', () => {
  let component: AboutUsComponent;
  let fixture: ComponentFixture<AboutUsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutUsComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).overrideComponent(AboutUsComponent, {
      set: { imports: [CommonModule], schemas: [NO_ERRORS_SCHEMA] }
    }).compileComponents();

    fixture = TestBed.createComponent(AboutUsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('team', () => {
    it('should have 5 team members', () => {
      expect(component.team.length).toBe(5);
    });

    it('should include Jaíne Andrade', () => {
      const member = component.team.find(m => m.name === 'Jaíne Andrade');
      expect(member).toBeDefined();
      expect(member?.initials).toBe('JA');
    });

    it('should have name and initials for each member', () => {
      component.team.forEach(member => {
        expect(member.name).toBeTruthy();
        expect(member.initials).toBeTruthy();
        expect(member.initials.length).toBe(2);
      });
    });
  });

  describe('values', () => {
    it('should have 6 values', () => {
      expect(component.values.length).toBe(6);
    });

    it('should have icon, title and description for each value', () => {
      component.values.forEach(value => {
        expect(value.icon).toBeTruthy();
        expect(value.title).toBeTruthy();
        expect(value.description).toBeTruthy();
      });
    });

    it('should include Empatia value', () => {
      const empatia = component.values.find(v => v.title === 'Empatia');
      expect(empatia).toBeDefined();
      expect(empatia?.icon).toBe('favorite');
    });

    it('should include Impacto value', () => {
      const impacto = component.values.find(v => v.title === 'Impacto');
      expect(impacto).toBeDefined();
    });
  });
});
