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
import { Observable, tap } from 'rxjs';
import { StudentsService } from '../../../../../core/services/students/students.service';
import { StudentPerformance } from '../../interfaces/student-performance.interface';

@Component({
	selector: 'app-student-performance',
	templateUrl: './student-performance.component.html',
	styleUrls: ['./student-performance.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentPerformanceComponent implements OnInit, OnChanges {
	public studentPerformance$!: Observable<StudentPerformance[]>;
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
		this.studentPerformance$ = this.ss
			.getStudentPerformance(+this.id)
			.pipe(tap(() => this.spinnerProgressOn.set(false)));
	}
}
