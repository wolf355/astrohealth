import { Component, ElementRef, ViewChild, AfterViewInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';
import { ApiService, Astronaute, MesureRecente, Parametre } from '../../services/api.service';

Chart.register(...registerables);

interface LigneHistorique {
  heure: string;
  valeur: string;
  etat: string;
}

@Component({
  selector: 'app-historique',
  imports: [RouterLink],
  templateUrl: './historique.html',
  styleUrl: './historique.scss'
})
export class Historique implements AfterViewInit {
  private api = inject(ApiService);
  private platformId = inject(PLATFORM_ID);

  medecin = 'Dr. Maya Chen';
  mission = 'Artemis-X';

  astronautes = signal<Astronaute[]>([]);
  parametres = signal<Parametre[]>([]);
  idAstronaute = signal(0);
  codeParametre = signal('FC');
  periodeActive = signal('24h');
  lignes = signal<LigneHistorique[]>([]);
  titre = signal('');
  unite = signal('');
  chargement = signal(true);
  erreur = signal('');
  derniereMaj = signal('');

  periodes = [
    { code: '24h', label: '24h', heures: 24 },
    { code: '7d', label: '7 days', heures: 168 },
    { code: 'all', label: 'All', heures: 0 }
  ];

  private serie: MesureRecente[] = [];
  private graphique?: Chart;

  @ViewChild('canvasGraphique') canvasGraphique!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.creerGraphique();

    forkJoin({
      parametres: this.api.getParametres(),
      astronautes: this.api.getAstronautes()
    }).subscribe({
      next: (d) => {
        this.parametres.set(d.parametres);
        this.astronautes.set(d.astronautes);
        if (d.astronautes.length > 0) {
          this.idAstronaute.set(d.astronautes[0].id_astronaute);
        }
        this.chargerSerie();
      },
      error: () => {
        this.erreur.set('Cannot reach the API. Is the backend running on port 3000?');
        this.chargement.set(false);
      }
    });
  }

  chargerSerie() {
    if (this.idAstronaute() === 0) {
      this.chargement.set(false);
      return;
    }
    this.chargement.set(true);
    this.api.getSerie(this.idAstronaute(), this.codeParametre()).subscribe({
      next: (serie) => {
        this.serie = serie;
        this.erreur.set('');
        this.afficher();
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set('Cannot load the measurements. Check that the backend is running.');
        this.chargement.set(false);
      }
    });
  }

  afficher() {
    const temps = this.serie.map(m => new Date(m.horodatage).getTime());
    const fin = temps.length > 0 ? Math.max(...temps) : 0;
    const periode = this.periodes.find(x => x.code === this.periodeActive());
    const heures = periode ? periode.heures : 0;
    const debut = heures > 0 ? fin - heures * 3600 * 1000 : 0;

    const visibles = this.serie.filter(m => new Date(m.horodatage).getTime() >= debut);
    const p = this.parametres().find(x => x.code === this.codeParametre());

    this.titre.set(p ? p.libelle + ' (' + p.unite + ')' : this.codeParametre());
    this.unite.set(p ? p.unite : '');

    const lignes = visibles.map(m => {
      const horsPlage = p ? (m.valeur < p.plage_normale_min || m.valeur > p.plage_normale_max) : false;
      return {
        heure: this.formaterDate(new Date(m.horodatage).getTime()),
        valeur: m.valeur_secondaire !== null ? m.valeur + ' / ' + m.valeur_secondaire : String(m.valeur),
        etat: horsPlage ? 'attention' : 'normal'
      };
    });
    this.lignes.set(lignes.reverse());

    this.dessiner(visibles, p);
    this.derniereMaj.set(new Date().toLocaleTimeString('en-GB'));
  }

  creerGraphique() {
    this.graphique = new Chart(this.canvasGraphique.nativeElement, {
      type: 'line',
      data: { datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'linear',
            ticks: {
              color: '#94A3B8',
              maxTicksLimit: 6,
              callback: (valeur) => this.formaterDate(Number(valeur))
            },
            grid: { color: '#22304A' }
          },
          y: { ticks: { color: '#94A3B8' }, grid: { color: '#22304A' } }
        },
        plugins: {
          legend: { labels: { color: '#94A3B8' } },
          tooltip: {
            callbacks: {
              title: (elements) => this.formaterDate(elements[0].parsed.x as number)
            }
          }
        }
      }
    });
  }

  dessiner(visibles: MesureRecente[], p: Parametre | undefined) {
    if (!this.graphique) {
      return;
    }

    const points = visibles.map(m => ({ x: new Date(m.horodatage).getTime(), y: m.valeur }));
    const datasets: any[] = [
      {
        label: p ? p.libelle : this.codeParametre(),
        data: points,
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F6',
        tension: 0.3,
        pointRadius: 4
      }
    ];

    if (p && points.length > 0) {
      let xMin = points[0].x;
      let xMax = points[points.length - 1].x;
      if (xMin === xMax) {
        xMin = xMin - 1800000;
        xMax = xMax + 1800000;
      }
      datasets.push({
        label: 'Normal min',
        data: [{ x: xMin, y: p.plage_normale_min }, { x: xMax, y: p.plage_normale_min }],
        borderColor: '#22C55E',
        borderDash: [6, 6],
        pointRadius: 0
      });
      datasets.push({
        label: 'Normal max',
        data: [{ x: xMin, y: p.plage_normale_max }, { x: xMax, y: p.plage_normale_max }],
        borderColor: '#22C55E',
        borderDash: [6, 6],
        pointRadius: 0
      });
    }

    this.graphique.data.datasets = datasets;
    this.graphique.update();
  }

  formaterDate(ms: number): string {
    return new Date(ms).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  changerAstronaute(valeur: string) {
    this.idAstronaute.set(Number(valeur));
    this.chargerSerie();
  }

  changerParametre(code: string) {
    this.codeParametre.set(code);
    this.chargerSerie();
  }

  changerPeriode(code: string) {
    this.periodeActive.set(code);
    this.afficher();
  }

  actualiser() {
    this.chargerSerie();
  }
}