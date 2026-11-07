import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChoixProfil } from './choix-profil';

describe('ChoixProfil', () => {
  let component: ChoixProfil;
  let fixture: ComponentFixture<ChoixProfil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChoixProfil],
    }).compileComponents();

    fixture = TestBed.createComponent(ChoixProfil);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
