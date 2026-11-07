import { Routes } from '@angular/router';
import { ChoixProfil } from './pages/choix-profil/choix-profil';
import { DashboardAstronaute } from './pages/dashboard-astronaute/dashboard-astronaute';
import { VueMedecin } from './pages/vue-medecin/vue-medecin';

export const routes: Routes = [
  { path: '', component: ChoixProfil },
  { path: 'astronaute', component: DashboardAstronaute },
  { path: 'medecin', component: VueMedecin },
];