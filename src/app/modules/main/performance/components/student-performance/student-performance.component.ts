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
import { ApiService } from '../../../../../core/services/api/api.service';
import { Subject as SchoolSubject } from '../../../../../core/interfaces/subject.interface';
import { Endpoints } from '../../../../../core/enums/endpoints.enum';

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
	private as = inject(ApiService);
	private processedArray = [];
	public subjects: SchoolSubject[] = [];
	@Input() id = '';

	ngOnInit(): void {
		this.getSubjects();
		this.searchStudentPerformance();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['id']?.currentValue) this.searchStudentPerformance();
	}

	private getSubjects() {
		this.as.get<SchoolSubject[]>(Endpoints.SUBJECTS).subscribe(subjects => {
			this.subjects = subjects;
		});
	}

	private searchStudentPerformance() {
		this.studentPerformance$ = this.ss.getStudentPerformance(+this.id).pipe(
			tap(originalArray => {
				const newArray = this.subjects.map(subject => ({
					studentPerformance: [],
					id: subject.id,
				}));

				originalArray.forEach(outerElement => {
					for (const innerElement of newArray) {
						if (outerElement.subjectId === innerElement.id)
							innerElement.studentPerformance.push(
								outerElement as unknown as never
							);
					}
				});

				this.processedArray = newArray as any;
			}),
			tap(() => this.spinnerProgressOn.set(false))
		);
	}

	public selectStudentPerformance(subjectId: number) {
		console.log(this.processedArray);
		return (
			this.processedArray.find(
				(array: any) => array.id === subjectId
			) as any
		).studentPerformance;
	}
}
