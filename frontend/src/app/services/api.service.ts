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

export interface Astronaute {
  id_astronaute: number;
  nom_code: string;
  fonction: string;
}

export interface MesureRecente {
  code: string;
  valeur: number;
  valeur_secondaire: number | null;
  horodatage: string;
}

export interface Alerte {
  id_alerte: string;
  id_astronaute: number;
  nom_code: string;
  niveau: string;
  message: string;
  date_creation: string;
  statut: string;
}
export interface ReponseAssistant {
  reponse: string;
  mode: string;
  id_message: string;
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

  getAstronautes(): Observable<Astronaute[]> {
    return this.http.get<Astronaute[]>(this.adresse + '/astronautes');
  }

  getDernieresMesures(idAstronaute: number): Observable<MesureRecente[]> {
    return this.http
      .get<any[]>(this.adresse + '/astronautes/' + idAstronaute + '/mesures/latest')
      .pipe(map(liste => liste.map(m => this.convertirMesure(m))));
  }

  getSerie(idAstronaute: number, code: string): Observable<MesureRecente[]> {
    return this.http
      .get<any[]>(this.adresse + '/astronautes/' + idAstronaute + '/mesures', {
        params: {
          parametre: code,
          debut: '2000-01-01 00:00:00',
          fin: '2100-01-01 00:00:00'
        }
      })
      .pipe(map(liste => liste.map(m => this.convertirMesure(m))));
  }

  getAlertes(statut: string): Observable<Alerte[]> {
    return this.http.get<Alerte[]>(this.adresse + '/alertes', { params: { statut } });
  }

    envoyerQuestion(idAstronaute: number, question: string): Observable<ReponseAssistant> {
    return this.http.post<ReponseAssistant>(this.adresse + '/assistant/chat', {
      id_astronaute: idAstronaute,
      question: question
    });
  }

  private convertirMesure(m: any): MesureRecente {
    return {
      code: m.code,
      valeur: Number(m.valeur),
      valeur_secondaire: m.valeur_secondaire === null ? null : Number(m.valeur_secondaire),
      horodatage: m.horodatage
    };
  }
}