import { Routes } from '@angular/router';
import { AuthComponent } from './core/pages/auth/auth.component';
import { HomeComponent } from './core/pages/home/home.component';
import { EventsComponent } from './core/pages/events/events.component';

export const routes: Routes = [
    { path: 'login', component: AuthComponent },
    {
        path: '',
        component: HomeComponent
    },
    {
        path: 'eventos',
        component: EventsComponent
    }
];