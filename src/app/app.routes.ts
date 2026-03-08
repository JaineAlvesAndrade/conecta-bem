import { Routes } from '@angular/router';
import { AuthComponent } from './core/components/Auth/AuthComponent';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: AuthComponent }
];