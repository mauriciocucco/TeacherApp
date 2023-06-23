import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleMarkingSetterComponent } from './multiple-marking-setter.component';

describe('MultipleMarkingSetterComponent', () => {
  let component: MultipleMarkingSetterComponent;
  let fixture: ComponentFixture<MultipleMarkingSetterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MultipleMarkingSetterComponent]
    });
    fixture = TestBed.createComponent(MultipleMarkingSetterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
