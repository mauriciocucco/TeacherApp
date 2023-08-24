import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentPerformanceComponent } from './student-performance.component';

describe('StudentPerformanceComponent', () => {
  let component: StudentPerformanceComponent;
  let fixture: ComponentFixture<StudentPerformanceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StudentPerformanceComponent]
    });
    fixture = TestBed.createComponent(StudentPerformanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
