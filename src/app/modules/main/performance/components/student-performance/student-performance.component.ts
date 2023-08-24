import {
	ChangeDetectionStrategy,
	Component,
	Input,
	OnChanges,
	OnInit,
	SimpleChanges,
	inject,
	signal,
} from '@angular/core';
import { Student } from '../../../../../core/interfaces/student.interface';
import { Observable, tap } from 'rxjs';
import { StudentsService } from '../../../../../core/services/students/students.service';

@Component({
	selector: 'app-student-performance',
	templateUrl: './student-performance.component.html',
	styleUrls: ['./student-performance.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentPerformanceComponent implements OnInit, OnChanges {
	public student$!: Observable<Student>;
	public spinnerProgressOn = signal(true);
	private ss = inject(StudentsService);
	@Input() id = '';

	ngOnInit(): void {
		this.searchStudentPerformance();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['id']?.currentValue) this.searchStudentPerformance();
	}

	private searchStudentPerformance() {
		this.student$ = this.ss.getStudent(+this.id).pipe(
			tap(value => console.log(value)),
			tap(() => this.spinnerProgressOn.set(false))
		);
	}
}
