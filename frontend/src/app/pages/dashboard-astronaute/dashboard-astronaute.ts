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
  valeursSpo2 = [98, 98, 97, 98, 98, 98, 98];

  recommandation = 'All vital signs are within normal range. Keep up your exercise routine and hydration.';

  private platformId = inject(PLATFORM_ID);

  @ViewChild('graphiqueFc') graphiqueFc!: ElementRef<HTMLCanvasElement>;
  @ViewChild('graphiqueSpo2') graphiqueSpo2!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.creerGraphique(this.graphiqueFc, 'Heart rate (bpm)', this.valeursFc, 40, 120, [
        { label: 'Normal min (60)', valeur: 60, couleur: '#22C55E' },
        { label: 'Normal max (100)', valeur: 100, couleur: '#22C55E' }
      ]);

      this.creerGraphique(this.graphiqueSpo2, 'SpO2 (%)', this.valeursSpo2, 85, 100, [
        { label: 'Normal min (95)', valeur: 95, couleur: '#22C55E' },
        { label: 'Alert threshold (92)', valeur: 92, couleur: '#EF4444' }
      ]);
    }
  }

  creerGraphique(
    canvas: ElementRef<HTMLCanvasElement>,
    titre: string,
    valeurs: number[],
    min: number,
    max: number,
    lignes: { label: string; valeur: number; couleur: string }[]
  ) {
    const datasets: any[] = [
      { label: titre, data: valeurs, borderColor: '#3B82F6', tension: 0.3, pointRadius: 3 }
    ];

    for (const ligne of lignes) {
      datasets.push({
        label: ligne.label,
        data: this.heures.map(() => ligne.valeur),
        borderColor: ligne.couleur,
        borderDash: [6, 6],
        pointRadius: 0
      });
    }

    new Chart(canvas.nativeElement, {
      type: 'line',
      data: { labels: this.heures, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: '#94A3B8' }, grid: { color: '#22304A' } },
          y: { min: min, max: max, ticks: { color: '#94A3B8' }, grid: { color: '#22304A' } }
        },
        plugins: {
          legend: { labels: { color: '#94A3B8' } }
        }
      }
    });
  }
}