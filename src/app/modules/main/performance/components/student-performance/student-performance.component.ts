import {
	ChangeDetectionStrategy,
	Component,
	Input,
	OnChanges,
	SimpleChanges,
	inject,
	signal,
} from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { StudentsService } from '../../../../../core/services/students/students.service';
import { StudentPerformance } from '../../interfaces/student-performance.interface';
import { ApiService } from '../../../../../core/services/api/api.service';
import { Subject as SchoolSubject } from '../../../../../core/interfaces/subject.interface';
import { Endpoints } from '../../../../../core/enums/endpoints.enum';
import { ProcessedStudentPerformance } from '../../interfaces/processed-student-performance.interface';

@Component({
	selector: 'app-student-performance',
	templateUrl: './student-performance.component.html',
	styleUrls: ['./student-performance.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentPerformanceComponent implements OnChanges {
	public studentPerformance$!: Observable<StudentPerformance[]>;
	public spinnerProgressOn = signal(true);
	public subjects: SchoolSubject[] = [];
	public processedStudentPerformance: ProcessedStudentPerformance[] = [];
	private ss = inject(StudentsService);
	private as = inject(ApiService);
	@Input() id = '';

	ngOnChanges(changes: SimpleChanges) {
		if (changes['id']?.currentValue) this.searchStudentPerformance();
	}

	private searchStudentPerformance() {
		this.studentPerformance$ = this.as
			.get<SchoolSubject[]>(Endpoints.SUBJECTS)
			.pipe(
				tap(subjects => (this.subjects = subjects)),
				switchMap(() =>
					this.ss.getStudentPerformance(+this.id).pipe(
						tap(rawStudentPerformance =>
							this.processStudentPerformance(
								rawStudentPerformance
							)
						),
						tap(() => this.spinnerProgressOn.set(false))
					)
				)
			);
	}

	private processStudentPerformance(
		rawStudentPerformance: StudentPerformance[]
	) {
		const performancePerSubject = this.subjects.map(subject => ({
			studentPerformance: [] as StudentPerformance[],
			id: subject.id,
		}));

		rawStudentPerformance.forEach(outerElement => {
			for (const innerElement of performancePerSubject) {
				console.log(outerElement.subjectId);
				if (outerElement.subjectId === innerElement.id)
					innerElement.studentPerformance.push(outerElement);
			}
		});

		this.processedStudentPerformance = performancePerSubject;
	}
}
