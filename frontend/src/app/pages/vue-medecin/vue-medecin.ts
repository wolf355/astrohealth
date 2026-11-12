import { Component, DestroyRef, ElementRef, ViewChild, AfterViewInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { Subject, forkJoin, merge, of, timer, switchMap, catchError } from 'rxjs';
import { ApiService, Alerte, Astronaute, MesureRecente, Parametre } from '../../services/api.service';

Chart.register(...registerables);

interface CarteAstronaute {
  id: number;
  nom: string;
  fonction: string;
  initiales: string;
  etat: string;
  fc: number | null;
  spo2: number | null;
  temp: number | null;
}

interface DonneesMedecin {
  astronautes: Astronaute[];
  alertes: Alerte[];
  dernieres: MesureRecente[][];
  series: MesureRecente[][];
}

@Component({
  selector: 'app-vue-medecin',
  imports: [RouterLink],
  templateUrl: './vue-medecin.html',
  styleUrl: './vue-medecin.scss'
})
export class VueMedecin implements AfterViewInit {
  private api = inject(ApiService);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  medecin = 'Dr. Maya Chen';
  mission = 'Artemis-X';
  jour = 42;

  equipage = signal<CarteAstronaute[]>([]);
  alertes = signal<Alerte[]>([]);
  lienEnLigne = signal(true);
  derniereMaj = signal('');
  resume = signal('');
  titreGraphique = signal('Heart rate (bpm)');
  paramActif = signal('FC');
  periodeActive = signal('6h');
  resumeOuvert = false;

  parametresDisponibles = [
    { code: 'FC', label: 'Heart rate' },
    { code: 'SPO2', label: 'SpO2' },
    { code: 'TEMP', label: 'Temperature' }
  ];

  periodes = [
    { code: '6h', label: '6h', heures: 6 },
    { code: '24h', label: '24h', heures: 24 },
    { code: '7d', label: '7 days', heures: 168 }
  ];

  private reglagesGraphique: { [code: string]: { titre: string; min: number; max: number } } = {
    FC: { titre: 'Heart rate (bpm)', min: 40, max: 130 },
    SPO2: { titre: 'SpO2 (%)', min: 80, max: 100 },
    TEMP: { titre: 'Temperature (°C)', min: 35, max: 39 }
  };

  private couleurs = ['#3B82F6', '#F59E0B', '#A855F7', '#14B8A6', '#EC4899', '#84CC16'];

  private parametres: Parametre[] = [];
  private graphique?: Chart;
  private derniersAstronautes: Astronaute[] = [];
  private derniereSerie: MesureRecente[][] = [];
  private declencheur = new Subject<void>();

  @ViewChild('canvasGraphique') canvasGraphique!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.creerGraphique();
    this.demarrerChargement();
  }

  demarrerChargement() {
    this.api.getParametres().pipe(
      switchMap(liste => {
        this.parametres = liste;
        return merge(timer(0, 5000), this.declencheur);
      }),
      switchMap(() => this.charger().pipe(catchError(() => of(null)))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (donnees) => {
        if (donnees === null) {
          this.lienEnLigne.set(false);
          return;
        }
        this.lienEnLigne.set(true);
        this.afficher(donnees);
      },
      error: () => this.lienEnLigne.set(false)
    });
  }

  charger() {
    const code = this.paramActif();
    return this.api.getAstronautes().pipe(
      switchMap(astronautes => {
        if (astronautes.length === 0) {
          return of({
            astronautes: astronautes,
            alertes: [] as Alerte[],
            dernieres: [] as MesureRecente[][],
            series: [] as MesureRecente[][]
          });
        }
        return forkJoin({
          astronautes: of(astronautes),
          alertes: this.api.getAlertes('active'),
          dernieres: forkJoin(astronautes.map(a => this.api.getDernieresMesures(a.id_astronaute))),
          series: forkJoin(astronautes.map(a => this.api.getSerie(a.id_astronaute, code)))
        });
      })
    );
  }

  afficher(d: DonneesMedecin) {
    this.derniersAstronautes = d.astronautes;
    this.derniereSerie = d.series;

    const cartes = d.astronautes.map((a, i) => {
      const mesures = d.dernieres[i] ?? [];
      const fc = this.valeur(mesures, 'FC');
      const spo2 = this.valeur(mesures, 'SPO2');
      const temp = this.valeur(mesures, 'TEMP');
      const sesAlertes = d.alertes.filter(x => x.id_astronaute === a.id_astronaute);

      return {
        id: a.id_astronaute,
        nom: a.nom_code,
        fonction: a.fonction,
        initiales: this.initiales(a.nom_code),
        etat: this.calculerEtat(sesAlertes, fc, spo2, temp),
        fc: fc,
        spo2: spo2,
        temp: temp
      };
    });
    this.equipage.set(cartes);
    this.alertes.set(d.alertes);

    if (d.alertes.length === 0) {
      this.resume.set('No active alerts. All crew members are within the normal range. '
        + 'This summary is not a medical diagnosis.');
    } else {
      this.resume.set(d.alertes.length + ' active alert(s): '
        + d.alertes.map(a => a.nom_code + ' - ' + a.message).join(' | ')
        + ' This summary is generated from the current data and is not a medical diagnosis.');
    }

    this.dessiner();
    this.derniereMaj.set(new Date().toLocaleTimeString('en-GB'));
  }

  valeur(mesures: MesureRecente[], code: string): number | null {
    const m = mesures.find(x => x.code === code);
    return m ? m.valeur : null;
  }

  calculerEtat(sesAlertes: Alerte[], fc: number | null, spo2: number | null, temp: number | null): string {
    if (sesAlertes.some(a => a.niveau === 'critique')) {
      return 'critique';
    }
    if (sesAlertes.length > 0) {
      return 'attention';
    }
    if (this.horsPlage('FC', fc) || this.horsPlage('SPO2', spo2) || this.horsPlage('TEMP', temp)) {
      return 'attention';
    }
    return 'normal';
  }

  horsPlage(code: string, valeur: number | null): boolean {
    if (valeur === null) {
      return false;
    }
    const p = this.parametres.find(x => x.code === code);
    if (!p) {
      return false;
    }
    return valeur < p.plage_normale_min || valeur > p.plage_normale_max;
  }

  initiales(nom: string): string {
    return nom.split(' ').filter(m => m !== '').map(m => m[0]).join('').slice(0, 2).toUpperCase();
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
          y: { min: 40, max: 130, ticks: { color: '#94A3B8' }, grid: { color: '#22304A' } }
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

  dessiner() {
    if (!this.graphique) {
      return;
    }

    const code = this.paramActif();
    const reglage = this.reglagesGraphique[code];
    this.titreGraphique.set(reglage.titre);
    const p = this.parametres.find(x => x.code === code);

    const tousLesTemps = this.derniereSerie.flatMap(s => s.map(m => new Date(m.horodatage).getTime()));
    const fin = tousLesTemps.length > 0 ? Math.max(...tousLesTemps) : 0;
    const periode = this.periodes.find(x => x.code === this.periodeActive());
    const duree = (periode ? periode.heures : 6) * 3600 * 1000;
    const debut = fin - duree;

    const datasets: any[] = this.derniersAstronautes.map((a, i) => {
      const couleur = this.couleurs[i % this.couleurs.length];
      const points = (this.derniereSerie[i] ?? [])
        .map(m => ({ x: new Date(m.horodatage).getTime(), y: m.valeur }))
        .filter(pt => pt.x >= debut);
      return {
        label: a.nom_code,
        data: points,
        borderColor: couleur,
        backgroundColor: couleur,
        tension: 0.3,
        pointRadius: 4
      };
    });

    const visibles = datasets.flatMap(ds => ds.data.map((pt: { x: number; y: number }) => pt.x));
    if (p && visibles.length > 0) {
      let xMin = Math.min(...visibles);
      let xMax = Math.max(...visibles);
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

    const echelles: any = this.graphique.options.scales;
    echelles['y'].min = reglage.min;
    echelles['y'].max = reglage.max;
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

  formaterAlerte(date: string): string {
    return this.formaterDate(new Date(date).getTime());
  }

  changerParametre(code: string) {
    this.paramActif.set(code);
    this.declencheur.next();
  }

  changerPeriode(code: string) {
    this.periodeActive.set(code);
    this.dessiner();
  }

  ouvrirFermerResume() {
    this.resumeOuvert = !this.resumeOuvert;
  }
}