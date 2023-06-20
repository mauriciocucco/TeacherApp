import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlphabetComponent } from './alphabet.component';

describe('AlphabetComponent', () => {
  let component: AlphabetComponent;
  let fixture: ComponentFixture<AlphabetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AlphabetComponent]
    });
    fixture = TestBed.createComponent(AlphabetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
