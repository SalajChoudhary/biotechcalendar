import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalystList } from './catalyst-list';

describe('CatalystList', () => {
  let component: CatalystList;
  let fixture: ComponentFixture<CatalystList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalystList],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalystList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
