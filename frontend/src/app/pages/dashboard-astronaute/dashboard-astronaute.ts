import { Component, DestroyRef, ElementRef, ViewChild, AfterViewInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { Subject, forkJoin, merge, timer, of, switchMap, catchError } from 'rxjs';
import { SocketService } from '../../services/socket.service';
import { ApiService, Alerte, Astronaute, MesureRecente, Parametre } from '../../services/api.service';

Chart.register(...registerables);

interface CarteMesure {
  code: string;
  label: string;
  valeur: number | null;
  unite: string;
  etat: string;
}

@Component({
  selector: 'app-dashboard-astronaute',
  imports: [RouterLink],
  templateUrl: './dashboard-astronaute.html',
  styleUrl: './dashboard-astronaute.scss'
})
export class DashboardAstronaute implements AfterViewInit {
  private api = inject(ApiService);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);
  private socket = inject(SocketService);
  private declencheur = new Subject<void>();
  idAstronaute = 1;
  mission = 'Artemis-X';
  jour = 42;

  nom = signal('');
  cartes = signal<CarteMesure[]>([]);
  alerteActive = signal<Alerte | null>(null);
  nombreAlertes = signal(0);
  niveauReco = signal('normal');
  recommandation = signal('');
  lienEnLigne = signal(true);
  derniereMaj = signal('');

  chatOuvert = false;
  enAttente = signal(false);
  messages = signal<{ auteur: string; texte: string; mode: string }[]>([
    { auteur: 'assistant', texte: 'Hello! I am the AstroHealth assistant. Ask me about your vital signs or your alerts.', mode: '' }
  ]);

  private parametres: Parametre[] = [];
  private graphFc?: Chart;
  private graphSpo2?: Chart;

  private modeleCartes = [
    { code: 'FC', label: 'Heart rate' },
    { code: 'SPO2', label: 'Blood oxygen (SpO2)' },
    { code: 'TEMP', label: 'Body temperature' },
    { code: 'SOMMEIL', label: 'Sleep last night' }
  ];

  @ViewChild('graphiqueFc') graphiqueFc!: ElementRef<HTMLCanvasElement>;
  @ViewChild('graphiqueSpo2') graphiqueSpo2!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.graphFc = this.creerGraphique(this.graphiqueFc, 'Heart rate (bpm)', 40, 120);
    this.graphSpo2 = this.creerGraphique(this.graphiqueSpo2, 'SpO2 (%)', 85, 100);
    this.demarrerChargement();
  }

    demarrerChargement() {
    this.socket.evenements$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(evenement => {
      if (evenement.id_astronaute === this.idAstronaute) {
        this.declencheur.next();
      }
    });

    this.api.getParametres().pipe(
      switchMap(liste => {
        this.parametres = liste;
        return merge(timer(0, 5000), this.declencheur);
      }),
      switchMap(() =>
        forkJoin({
          astronautes: this.api.getAstronautes(),
          dernieres: this.api.getDernieresMesures(this.idAstronaute),
          alertes: this.api.getAlertes('active'),
          serieFc: this.api.getSerie(this.idAstronaute, 'FC'),
          serieSpo2: this.api.getSerie(this.idAstronaute, 'SPO2')
        }).pipe(catchError(() => of(null)))
      ),
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

  afficher(d: {
    astronautes: Astronaute[];
    dernieres: MesureRecente[];
    alertes: Alerte[];
    serieFc: MesureRecente[];
    serieSpo2: MesureRecente[];
  }) {
    const moi = d.astronautes.find(a => a.id_astronaute === this.idAstronaute);
    if (moi) {
      this.nom.set(moi.nom_code);
    }

    const cartes = this.modeleCartes.map(m => {
      const mesure = d.dernieres.find(x => x.code === m.code);
      const valeur = mesure ? mesure.valeur : null;
      const p = this.parametres.find(x => x.code === m.code);
      return {
        code: m.code,
        label: m.label,
        valeur: valeur,
        unite: p ? p.unite : '',
        etat: this.calculerEtat(m.code, valeur)
      };
    });
    this.cartes.set(cartes);

    const mesAlertes = d.alertes.filter(a => a.id_astronaute === this.idAstronaute);
    const alerte = mesAlertes.length > 0 ? mesAlertes[0] : null;
    this.nombreAlertes.set(mesAlertes.length);
    this.alerteActive.set(alerte);

    const horsPlage = cartes.some(c => c.etat === 'attention');
    if (alerte && alerte.niveau === 'critique') {
      this.niveauReco.set('critique');
      this.recommandation.set('Contact the ground doctor immediately.');
    } else if (alerte) {
      this.niveauReco.set('attention');
      this.recommandation.set('Re-measure in 10 minutes. If the value stays out of range, contact the ground doctor.');
    } else if (horsPlage) {
      this.niveauReco.set('attention');
      this.recommandation.set('Some values are outside the normal range. Rest and re-measure in 10 minutes.');
    } else {
      this.niveauReco.set('normal');
      this.recommandation.set('All vital signs are within normal range. Keep up your exercise routine and hydration.');
    }

    this.majGraphique(this.graphFc, d.serieFc, 'FC');
    this.majGraphique(this.graphSpo2, d.serieSpo2, 'SPO2');
    this.derniereMaj.set(new Date().toLocaleTimeString('en-GB'));
  }

  calculerEtat(code: string, valeur: number | null): string {
    if (valeur === null) {
      return 'aucune';
    }
    const p = this.parametres.find(x => x.code === code);
    if (!p) {
      return 'normal';
    }
    if (valeur < p.plage_normale_min || valeur > p.plage_normale_max) {
      return 'attention';
    }
    return 'normal';
  }

  creerGraphique(canvas: ElementRef<HTMLCanvasElement>, titre: string, min: number, max: number): Chart {
    return new Chart(canvas.nativeElement, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          { label: titre, data: [], borderColor: '#3B82F6', tension: 0.3, pointRadius: 3 },
          { label: 'Normal min', data: [], borderColor: '#22C55E', borderDash: [6, 6], pointRadius: 0 },
          { label: 'Normal max', data: [], borderColor: '#22C55E', borderDash: [6, 6], pointRadius: 0 }
        ]
      },
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

  majGraphique(graphique: Chart | undefined, serie: MesureRecente[], code: string) {
    if (!graphique) {
      return;
    }
    const points = serie.slice(-30);
    const labels = points.map(m => this.formaterDate(m.horodatage));
    const p = this.parametres.find(x => x.code === code);

    graphique.data.labels = labels;
    graphique.data.datasets[0].data = points.map(m => m.valeur);
    if (p) {
      graphique.data.datasets[1].data = labels.map(() => p.plage_normale_min);
      graphique.data.datasets[2].data = labels.map(() => p.plage_normale_max);
    }
    graphique.update();
  }

  formaterDate(horodatage: string): string {
    return new Date(horodatage).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  ouvrirFermerChat() {
    this.chatOuvert = !this.chatOuvert;
  }

    envoyer(champ: HTMLInputElement) {
    const question = champ.value.trim();
    if (question === '' || this.enAttente()) {
      return;
    }

    this.ajouterMessage('utilisateur', question, '');
    champ.value = '';
    this.enAttente.set(true);

    this.api.envoyerQuestion(this.idAstronaute, question).subscribe({
      next: (rep) => {
        this.ajouterMessage('assistant', rep.reponse, rep.mode);
        this.enAttente.set(false);
      },
      error: () => {
        this.ajouterMessage(
          'assistant',
          'The assistant is not reachable right now. Your latest values are shown on the dashboard. '
            + 'If an alert is active, rest, re-measure in 10 minutes and contact the ground doctor if it does not improve.',
          'secours'
        );
        this.enAttente.set(false);
      }
    });
  }

  ajouterMessage(auteur: string, texte: string, mode: string) {
    this.messages.update(liste => [...liste, { auteur: auteur, texte: texte, mode: mode }]);
  }
}