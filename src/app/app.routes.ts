import { Routes } from '@angular/router';
import { AuthComponent } from './core/pages/auth/auth.component';
import { HomeComponent } from './core/pages/home/home.component';
import { EventsComponent } from './core/pages/events/events.component';
import { ChangePasswordComponent } from './core/pages/change-password/change-password.component';
import { ProfileComponent } from './core/pages/profile/profile.component';
import { AboutUsComponent } from './core/pages/about-us/about-us.component';

export const routes: Routes = [
    { 
        path: 'login', 
        component: AuthComponent 
    },
    { 
        path: 'cadastro', 
        component: AuthComponent 
    },
    {
        path: '',
        component: HomeComponent
    },
    {
        path: 'eventos',
        component: EventsComponent
    },
    {
        path: 'alterar-senha',
        component: ChangePasswordComponent
    },
    { 
        path: 'perfil', 
        component: ProfileComponent 
    },
    {
        path: 'sobre',
        component: AboutUsComponent
    }
];