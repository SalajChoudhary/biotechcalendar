import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalystForm } from './catalyst-form';

describe('CatalystForm', () => {
  let component: CatalystForm;
  let fixture: ComponentFixture<CatalystForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalystForm],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalystForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
