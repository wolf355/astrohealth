import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

export interface EvenementTempsReel {
  type: 'mesure' | 'alerte';
  id_astronaute: number;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private platformId = inject(PLATFORM_ID);
  private socket?: Socket;

  evenements$ = new Subject<EvenementTempsReel>();

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.socket = io('http://localhost:3000');

    this.socket.on('nouvelle_mesure', (donnees: any) => {
      this.evenements$.next({ type: 'mesure', id_astronaute: Number(donnees.id_astronaute) });
    });

    this.socket.on('nouvelle_alerte', (donnees: any) => {
      this.evenements$.next({ type: 'alerte', id_astronaute: Number(donnees.id_astronaute) });
    });
  }
}