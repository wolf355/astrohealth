import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAstronaute } from './dashboard-astronaute';

describe('DashboardAstronaute', () => {
  let component: DashboardAstronaute;
  let fixture: ComponentFixture<DashboardAstronaute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardAstronaute],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardAstronaute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
