import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-astronaute',
  imports: [RouterLink],
  templateUrl: './dashboard-astronaute.html',
  styleUrl: './dashboard-astronaute.scss'
})
export class DashboardAstronaute {
  nom = 'Alex Moreau';
  mission = 'Artemis-X';
  jour = 42;

  mesures = [
    { label: 'Heart rate', valeur: 72, unite: 'bpm', etat: 'normal' },
    { label: 'Blood oxygen (SpO2)', valeur: 98, unite: '%', etat: 'normal' },
    { label: 'Body temperature', valeur: 36.8, unite: '°C', etat: 'normal' },
    { label: 'Sleep last night', valeur: 7.2, unite: 'h', etat: 'normal' },
  ];
}