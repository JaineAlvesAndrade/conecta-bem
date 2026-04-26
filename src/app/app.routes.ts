import { Routes } from '@angular/router';
import { AuthComponent } from './core/pages/auth/auth.component';
import { HomeComponent } from './core/pages/home/home.component';
import { EventsComponent } from './core/pages/events/events.component';
import { EventDetailComponent } from './core/pages/event-detail/event-detail.component';

export const routes: Routes = [
    { path: 'login', component: AuthComponent, data: { mode: 'login' } },
    { path: 'cadastro', component: AuthComponent, data: { mode: 'register' } },
    {
        path: '',
        component: HomeComponent
    },
    {
        path: 'eventos',
        component: EventsComponent
    },
    {
        path: 'eventos/:id',
        component: EventDetailComponent
    }
];