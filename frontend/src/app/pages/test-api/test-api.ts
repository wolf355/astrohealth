import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, Parametre } from '../../services/api.service';

@Component({
  selector: 'app-test-api',
  imports: [RouterLink],
  templateUrl: './test-api.html',
  styleUrl: './test-api.scss'
})
export class TestApi implements OnInit {
  private api = inject(ApiService);

  parametres = signal<Parametre[]>([]);
  chargement = signal(true);
  erreur = signal('');

  ngOnInit() {
    this.api.getParametres().subscribe({
      next: (liste) => {
        this.parametres.set(liste);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set('Cannot reach the API. Is the backend running on port 3000?');
        this.chargement.set(false);
      }
    });
  }
}