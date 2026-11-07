import { Component, ElementRef, ViewChild, AfterViewInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-astronaute',
  imports: [RouterLink],
  templateUrl: './dashboard-astronaute.html',
  styleUrl: './dashboard-astronaute.scss'
})
export class DashboardAstronaute implements AfterViewInit {
  nom = 'Alex Moreau';
  mission = 'Artemis-X';
  jour = 42;

  mesures = [
    { label: 'Heart rate', valeur: 72, unite: 'bpm', etat: 'normal' },
    { label: 'Blood oxygen (SpO2)', valeur: 98, unite: '%', etat: 'normal' },
    { label: 'Body temperature', valeur: 36.8, unite: '°C', etat: 'normal' },
    { label: 'Sleep last night', valeur: 7.2, unite: 'h', etat: 'normal' },
  ];

  heures = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
  valeursFc = [70, 72, 71, 74, 73, 72, 72];

  private platformId = inject(PLATFORM_ID);
  @ViewChild('graphiqueFc') graphiqueFc!: ElementRef<HTMLCanvasElement>;

    ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.creerGraphiqueFc();
    }
  }

  creerGraphiqueFc() {
    new Chart(this.graphiqueFc.nativeElement, {
      type: 'line',
      data: {
        labels: this.heures,
        datasets: [
          {
            label: 'Heart rate (bpm)',
            data: this.valeursFc,
            borderColor: '#3B82F6',
            tension: 0.3,
            pointRadius: 3
          },
          {
            label: 'Normal min (60)',
            data: this.heures.map(() => 60),
            borderColor: '#22C55E',
            borderDash: [6, 6],
            pointRadius: 0
          },
          {
            label: 'Normal max (100)',
            data: this.heures.map(() => 100),
            borderColor: '#22C55E',
            borderDash: [6, 6],
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: '#94A3B8' }, grid: { color: '#22304A' } },
          y: { min: 40, max: 120, ticks: { color: '#94A3B8' }, grid: { color: '#22304A' } }
        },
        plugins: {
          legend: { labels: { color: '#94A3B8' } }
        }
      }
    });
  }
}