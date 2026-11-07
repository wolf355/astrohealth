import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VueMedecin } from './vue-medecin';

describe('VueMedecin', () => {
  let component: VueMedecin;
  let fixture: ComponentFixture<VueMedecin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VueMedecin],
    }).compileComponents();

    fixture = TestBed.createComponent(VueMedecin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
