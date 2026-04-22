import { TestBed } from '@angular/core/testing';

import { CatalystService } from './catalyst.service';

describe('CatalystService', () => {
  let service: CatalystService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CatalystService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
