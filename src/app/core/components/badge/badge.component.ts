import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-badge',
    standalone: true,
    template: `<span class="badge" [class]="'badge--' + color"><ng-content/></span>`,
    styles: [`
    .badge {
      display: inline-block;
      padding: 0.2rem 0.65rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;

      &--default { background: #f0f0f0; color: #444; }
      &--blue { background: #e8f0fe; color: #1a56db; }
      &--green { background: #def7ec; color: #057a55; }
      &--orange { background: #fef3c7; color: #b45309; }
      &--red { background: #fee2e2; color: #b91c1c; }
    }
  `]
})
export class BadgeComponent {
    @Input() color: 'default' | 'blue' | 'green' | 'orange' | 'red' = 'default';
}