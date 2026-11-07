import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Parametre {
  id_parametre: number;
  code: string;
  libelle: string;
  unite: string;
  plage_normale_min: number;
  plage_normale_max: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private adresse = 'http://localhost:3000/api';

  getParametres(): Observable<Parametre[]> {
    return this.http.get<any[]>(this.adresse + '/parametres').pipe(
      map(liste => liste.map(p => ({
        ...p,
        plage_normale_min: Number(p.plage_normale_min),
        plage_normale_max: Number(p.plage_normale_max)
      })))
    );
  }
}