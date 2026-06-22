import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, RouterLinkActive, NotificationPanelComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  menuOpen = false;
  userMenuOpen = false;
  notifPanelOpen = false;

  constructor(
    public authService: AuthService,
    public notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.notificationService.refresh();
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
    if (this.userMenuOpen) this.notifPanelOpen = false;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  toggleNotifPanel(): void {
    this.notifPanelOpen = !this.notifPanelOpen;
    if (this.notifPanelOpen) {
      this.userMenuOpen = false;
      this.notificationService.refresh();
    }
  }

  closeNotifPanel(): void {
    this.notifPanelOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.navbar__user')) {
      this.userMenuOpen = false;
    }
    if (!target.closest('.navbar__notif')) {
      this.notifPanelOpen = false;
    }
  }

  logout(): void {
    this.notificationService.clearUserNotifications();
    this.authService.logout();
    this.userMenuOpen = false;
    this.menuOpen = false;
    this.notifPanelOpen = false;
    this.router.navigate(['/']);
  }

  goToProfile(): void {
    this.userMenuOpen = false;
    this.router.navigate(['/perfil']);
  }

  goToHistory(): void {
    this.userMenuOpen = false;
    this.router.navigate(['/historico-eventos']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToSubscription(): void {
    this.router.navigate(['/cadastro']);
  }
}
