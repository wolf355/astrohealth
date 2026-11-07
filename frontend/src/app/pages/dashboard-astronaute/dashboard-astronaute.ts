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

  enAlerte = false;
  niveauAlerte = 'attention';
  messageAlerte = 'Blood oxygen below safe level (SpO2 91 %)';

  heures = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

  donneesNormales = {
    mesures: [
      { label: 'Heart rate', valeur: 72, unite: 'bpm', etat: 'normal' },
      { label: 'Blood oxygen (SpO2)', valeur: 98, unite: '%', etat: 'normal' },
      { label: 'Body temperature', valeur: 36.8, unite: '°C', etat: 'normal' },
      { label: 'Sleep last night', valeur: 7.2, unite: 'h', etat: 'normal' },
    ],
    fc: [70, 72, 71, 74, 73, 72, 72],
    spo2: [98, 98, 97, 98, 98, 98, 98],
    reco: 'All vital signs are within normal range. Keep up your exercise routine and hydration.'
  };

  donneesAlerte = {
    mesures: [
      { label: 'Heart rate', valeur: 108, unite: 'bpm', etat: 'attention' },
      { label: 'Blood oxygen (SpO2)', valeur: 91, unite: '%', etat: 'attention' },
      { label: 'Body temperature', valeur: 36.9, unite: '°C', etat: 'normal' },
      { label: 'Sleep last night', valeur: 7.2, unite: 'h', etat: 'normal' },
    ],
    fc: [70, 72, 71, 74, 80, 95, 108],
    spo2: [98, 98, 97, 96, 94, 93, 91],
    reco: 'Re-measure your SpO2 in 10 minutes. If it stays below 92 %, contact the ground doctor.'
  };

  mesures = this.donneesNormales.mesures;
  recommandation = this.donneesNormales.reco;

  private platformId = inject(PLATFORM_ID);
  private graphFc?: Chart;
  private graphSpo2?: Chart;

  @ViewChild('graphiqueFc') graphiqueFc!: ElementRef<HTMLCanvasElement>;
  @ViewChild('graphiqueSpo2') graphiqueSpo2!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.graphFc = this.creerGraphique(this.graphiqueFc, 'Heart rate (bpm)', this.donneesNormales.fc, 40, 120, [
        { label: 'Normal min (60)', valeur: 60, couleur: '#22C55E' },
        { label: 'Normal max (100)', valeur: 100, couleur: '#22C55E' }
      ]);

      this.graphSpo2 = this.creerGraphique(this.graphiqueSpo2, 'SpO2 (%)', this.donneesNormales.spo2, 85, 100, [
        { label: 'Normal min (95)', valeur: 95, couleur: '#22C55E' },
        { label: 'Alert threshold (92)', valeur: 92, couleur: '#EF4444' }
      ]);
    }
  }

  basculer() {
    this.enAlerte = !this.enAlerte;
    const d = this.enAlerte ? this.donneesAlerte : this.donneesNormales;
    this.mesures = d.mesures;
    this.recommandation = d.reco;
    this.majGraphique(this.graphFc, d.fc);
    this.majGraphique(this.graphSpo2, d.spo2);
  }

  majGraphique(graphique: Chart | undefined, valeurs: number[]) {
    if (graphique) {
      graphique.data.datasets[0].data = valeurs;
      graphique.update();
    }
  }

  creerGraphique(
    canvas: ElementRef<HTMLCanvasElement>,
    titre: string,
    valeurs: number[],
    min: number,
    max: number,
    lignes: { label: string; valeur: number; couleur: string }[]
  ): Chart {
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

    return new Chart(canvas.nativeElement, {
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