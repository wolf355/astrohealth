import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-vue-medecin',
  imports: [RouterLink],
  templateUrl: './vue-medecin.html',
  styleUrl: './vue-medecin.scss'
})
export class VueMedecin implements AfterViewInit, OnDestroy {
  medecin = 'Dr. Maya Chen';
  mission = 'Artemis-X';
  jour = 42;

  equipage = [
    { nom: 'Alex Moreau', fonction: 'Commander', initiales: 'AM', etat: 'attention', fc: 108, spo2: 91, temp: 36.9 },
    { nom: 'Sara Khan', fonction: 'Mission specialist', initiales: 'SK', etat: 'attention', fc: 76, spo2: 97, temp: 36.7 },
    { nom: 'Leo Tanaka', fonction: 'Pilot', initiales: 'LT', etat: 'normal', fc: 69, spo2: 99, temp: 36.6 },
    { nom: 'Mia Rossi', fonction: 'Flight engineer', initiales: 'MR', etat: 'normal', fc: 73, spo2: 98, temp: 36.8 },
  ];

  alertes = [
    { heure: '14:32', astronaute: 'Alex Moreau', parametre: 'SpO2', valeur: '91 %', etat: 'attention' },
    { heure: '14:10', astronaute: 'Sara Khan', parametre: 'Sleep', valeur: '4.5 h', etat: 'attention' },
  ];

  parametres: {
    [code: string]: {
      titre: string; min: number; max: number; normalMin: number; normalMax: number;
      periodes: { [periode: string]: { labels: string[]; valeurs: number[] } };
    };
  } = {
    fc: {
      titre: 'Heart rate (bpm)', min: 40, max: 120, normalMin: 60, normalMax: 100,
      periodes: {
        '6h': { labels: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'], valeurs: [70, 72, 71, 74, 73, 72, 74] },
        '24h': { labels: ['00h', '04h', '08h', '12h', '16h', '20h', '24h'], valeurs: [62, 60, 68, 74, 76, 72, 66] },
        '7d': { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], valeurs: [71, 72, 70, 73, 72, 74, 73] }
      }
    },
    spo2: {
      titre: 'SpO2 (%)', min: 85, max: 100, normalMin: 95, normalMax: 100,
      periodes: {
        '6h': { labels: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'], valeurs: [98, 98, 98, 97, 97, 96, 96] },
        '24h': { labels: ['00h', '04h', '08h', '12h', '16h', '20h', '24h'], valeurs: [98, 98, 97, 98, 98, 97, 96] },
        '7d': { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], valeurs: [98, 98, 98, 98, 97, 97, 96] }
      }
    },
    temp: {
      titre: 'Body temperature (°C)', min: 35, max: 38.5, normalMin: 36.1, normalMax: 37.2,
      periodes: {
        '6h': { labels: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'], valeurs: [36.6, 36.6, 36.7, 36.7, 36.8, 36.7, 36.7] },
        '24h': { labels: ['00h', '04h', '08h', '12h', '16h', '20h', '24h'], valeurs: [36.4, 36.3, 36.5, 36.7, 36.8, 36.7, 36.5] },
        '7d': { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], valeurs: [36.6, 36.7, 36.6, 36.7, 36.6, 36.7, 36.7] }
      }
    }
  };

  paramActif = 'fc';
  periodeActive = '6h';

  resumeOuvert = false;
  resume = 'Mission Artemis-X, day 42: 2 attention alerts today (low SpO2 for Alex Moreau, insufficient sleep for Sara Khan). '
    + 'Alex had a critical SpO2 alert yesterday (86 %), now resolved. '
    + 'The other parameters are within the normal range. '
    + 'This summary is informative and is not a medical diagnosis.';

  private platformId = inject(PLATFORM_ID);
  private graphique?: Chart;

  @ViewChild('canvasGraphique') canvasGraphique!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.dessiner();
    }
  }

  ngOnDestroy() {
    this.graphique?.destroy();
  }

  changerParametre(code: string) {
    this.paramActif = code;
    this.dessiner();
  }

  changerPeriode(periode: string) {
    this.periodeActive = periode;
    this.dessiner();
  }

  ouvrirFermerResume() {
    this.resumeOuvert = !this.resumeOuvert;
  }

  dessiner() {
    const p = this.parametres[this.paramActif];
    const donnees = p.periodes[this.periodeActive];

    this.graphique?.destroy();

    this.graphique = new Chart(this.canvasGraphique.nativeElement, {
      type: 'line',
      data: {
        labels: donnees.labels,
        datasets: [
          { label: p.titre, data: donnees.valeurs, borderColor: '#3B82F6', tension: 0.3, pointRadius: 3 },
          {
            label: 'Normal min (' + p.normalMin + ')',
            data: donnees.labels.map(() => p.normalMin),
            borderColor: '#22C55E', borderDash: [6, 6], pointRadius: 0
          },
          {
            label: 'Normal max (' + p.normalMax + ')',
            data: donnees.labels.map(() => p.normalMax),
            borderColor: '#22C55E', borderDash: [6, 6], pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: '#94A3B8' }, grid: { color: '#22304A' } },
          y: { min: p.min, max: p.max, ticks: { color: '#94A3B8' }, grid: { color: '#22304A' } }
        },
        plugins: {
          legend: { labels: { color: '#94A3B8' } }
        }
      }
    });
  }
}