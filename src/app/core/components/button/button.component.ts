import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (href) {
      <a [routerLink]="href" class="btn" [class]="'btn--' + variant + ' btn--' + size">
        <ng-content/>
      </a>
    } @else {
      <button class="btn" [class]="'btn--' + variant + ' btn--' + size" [type]="type" [disabled]="disabled">
        <ng-content/>
      </button>
    }
  `
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'outline' | 'ghost' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() href?: string;
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
}