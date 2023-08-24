import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	OnInit,
	Signal,
	inject,
	signal,
} from '@angular/core';
import { Course } from '../../../core/interfaces/course.interface';
import { QualificationsService } from '../../../core/services/qualifications/qualifications.service';
import { FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StudentsService } from '../../../core/services/students/students.service';
import { Student } from '../../../core/interfaces/student.interface';
import {
	Observable,
	map,
	of,
	startWith,
	switchMap,
	debounce,
	distinctUntilChanged,
	timer,
} from 'rxjs';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Router } from '@angular/router';

@Component({
	selector: 'app-performance',
	templateUrl: './performance.component.html',
	styleUrls: ['./performance.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformanceComponent implements OnInit {
	public courses: Signal<Course[]> = this.qs.courses;
	public courseControl: FormControl<number | null> = new FormControl(null);
	public studentControl: FormControl<string | null> = new FormControl(null);
	public students: Student[] = [];
	public filteredStudents: Observable<Student[]> = of([]);
	public step = signal(0);
	private destroyRef = inject(DestroyRef);
	private ss = inject(StudentsService);
	private router = inject(Router);

	constructor(private qs: QualificationsService) {}

	ngOnInit(): void {
		this.listenCourseFilterChanges();
	}

	private listenCourseFilterChanges() {
		this.courseControl?.valueChanges
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				switchMap(courseId => this.ss.getStudents({ courseId }))
			)
			.subscribe(students => {
				this.students = students;
				this.listenStudentsFilterChanges();
				this.nextStep();
			});
	}

	public setStep(index: number) {
		this.step.set(index);
	}

	public nextStep() {
		this.step.update(previousStep => previousStep + 1);
	}

	public prevStep() {
		this.step.update(previousStep => previousStep - 1);
	}

	public studentSelected(option: MatAutocompleteSelectedEvent) {
		const [selectedOption] = this.filterValue(option.option.value);

		console.log('resultado', selectedOption);
		this.router.navigate(['principal/progreso', selectedOption.id]);
	}

	private listenStudentsFilterChanges() {
		this.filteredStudents = this.studentControl?.valueChanges.pipe(
			startWith(''),
			debounce(() => timer(500)),
			distinctUntilChanged(),
			map(value => this.filterValue(value || '')),
			takeUntilDestroyed(this.destroyRef)
		);
	}

	private filterValue(value: string) {
		if (!value) return this.students;

		const filterValue = value.toLowerCase().split(' ').join('');

		return this.students.filter(({ name, lastname }) => {
			const studentName = `${name}${lastname}`;

			return studentName
				.toLowerCase()
				.split(' ')
				.join('')
				.includes(filterValue);
		});
	}
}
