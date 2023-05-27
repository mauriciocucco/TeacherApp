import {
	Component,
	OnDestroy,
	OnInit,
	QueryList,
	ViewChildren,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
	Observable,
	Subject,
	combineLatest,
	forkJoin,
	map,
	of,
	startWith,
	takeUntil,
	tap,
} from 'rxjs';
import { Task } from '../../../core/interfaces/task.interface';
import { Marking } from '../../../core/interfaces/marking.interface';
import { Subject as schoolSubject } from '../../../core/interfaces/subject.interface';
import { Exam } from '../../../core/interfaces/exam.interface';
import { Student } from '../../../core/interfaces/student.interface';
import { ApiService } from '../../../core/services/api/api.service';
import { MatTabGroup } from '@angular/material/tabs';
import { Course } from '../../../core/interfaces/course.interface';
import { taskAndExamsParams } from './interfaces/task-and-exams-params.interface';
import { StudentsParams } from './interfaces/students-params.interface';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
	selector: 'app-qualifications',
	templateUrl: './qualifications.component.html',
	styleUrls: ['./qualifications.component.scss'],
})
export class QualificationsComponent implements OnInit, OnDestroy {
	private tasks$: Subject<Task[]> = new Subject(); //son Subjects para poder emitir valores luego de ser filtrados
	private exams$: Subject<Exam[]> = new Subject(); //son Subjects para poder emitir valores luego de ser filtrados
	private taskAndExamsParams: taskAndExamsParams = {
		subjectId: 0,
		courseId: 0,
	};
	private studentsParams: StudentsParams = {
		courseId: 0,
	};
	private destroy: Subject<boolean> = new Subject<boolean>();
	private controlsEnabled = false;
	public students$: Subject<Student[]> = new Subject(); //son Subjects para poder emitir valores luego de ser filtrados;
	public studentsInACourse: Student[] = []; //para el filtro por nombre del estudiante
	public subjects$: Observable<schoolSubject[]> =
		this.apiService.get('subjects');
	public courses$: Observable<Course[]> = this.apiService.get('courses');
	public markings: Marking[] = [];
	public vm$ = combineLatest([this.tasks$, this.exams$, this.students$]).pipe(
		map(([tasks, exams, students]) => ({
			tasks,
			exams,
			students,
		})),
		tap(() => this.scrollToLatest())
	);
	public studentFilterControl = new FormControl({
		value: '',
		disabled: true,
	});
	public filteredStudents: Observable<Student[]> = of([]);
	public subjectFormControl = new FormControl<number>(
		{ value: 0, disabled: true },
		{
			nonNullable: true,
		}
	);
	public courseFormControl = new FormControl<number>(0, {
		nonNullable: true,
	});
	@ViewChildren('tabChildren') tabChildren!: QueryList<MatTabGroup>;

	constructor(private apiService: ApiService) {}

	ngOnInit() {
		this.getMarkings();
		this.getTasksAndExams(true);
		this.getStudents(true);
		this.listenCourseChanges();
	}

	ngOnDestroy(): void {
		this.destroy.next(true);
		this.destroy.unsubscribe();
	}

	private getMarkings() {
		this.apiService.get('markings').subscribe(result => {
			this.markings = result as Marking[];
		});
	}

	private getTasksAndExams(returnEmpty = false) {
		if (returnEmpty) {
			this.tasks$.next([]);
			this.exams$.next([]);
			return;
		}

		const tasksObs$ = this.apiService.get('tasks', {
			params: this.taskAndExamsParams,
		});
		const examsObs$ = this.apiService.get('exams', {
			params: this.taskAndExamsParams,
		});

		forkJoin([tasksObs$, examsObs$]).subscribe(result => {
			this.tasks$.next(result[0] as Task[]); // esto es para que emita el combineLatest de vm$
			this.exams$.next(result[1] as Exam[]); // esto es para que emita el combineLatest de vm$
		});
	}

	private getStudents(returnEmpty = false) {
		if (returnEmpty) return this.students$.next([]);

		this.apiService
			.get('students', {
				params: this.studentsParams,
			})
			.subscribe(response => {
				this.students$.next(response as Student[]);
				this.studentsInACourse = response as Student[];
				if (!this.controlsEnabled) this.enableControls();
			});
	}

	private scrollToLatest() {
		this.tabChildren.changes
			.pipe(takeUntil(this.destroy))
			.subscribe((queryList: QueryList<MatTabGroup>) => {
				for (const tab of queryList.toArray()) {
					const containerElement = tab._elementRef.nativeElement;
					const scrollOwnerElement: Element =
						containerElement.lastChild?.firstChild?.firstChild; //.mat-mdc-tab-body-content

					if (scrollOwnerElement)
						scrollOwnerElement.scrollTo({
							left: containerElement.scrollWidth + 1000000, // Establece la posición a la derecha (al final)
						});
				}
			});
	}

	private listenStudentFilterChanges() {
		this.filteredStudents = this.studentFilterControl.valueChanges.pipe(
			startWith(''),
			map(value => this.filterValues(value)),
			takeUntil(this.destroy)
		);
	}

	private filterValues(value: string | null): Student[] {
		if (!value) return this.studentsInACourse;

		const filterValue = value.toLowerCase();

		return this.processStudentAutocomplete(filterValue);
	}

	private processStudentAutocomplete(filterValue: string) {
		return this.studentsInACourse.filter(student => {
			const fullname = `${student.name} ${student.lastname}`;

			return fullname.toLowerCase().includes(filterValue);
		});
	}

	private listenSubjectChanges() {
		this.subjectFormControl.valueChanges
			.pipe(takeUntil(this.destroy))
			.subscribe(selectedSubjectId => {
				this.taskAndExamsParams = {
					...this.taskAndExamsParams,
					subjectId: selectedSubjectId,
				};

				this.getTasksAndExams();
			});
	}

	private listenCourseChanges() {
		this.courseFormControl.valueChanges
			.pipe(takeUntil(this.destroy))
			.subscribe(selectedCourseId => {
				this.studentsParams = {
					...this.studentsParams,
					courseId: selectedCourseId,
				};

				this.taskAndExamsParams = {
					...this.taskAndExamsParams,
					courseId: selectedCourseId,
				};

				this.getStudents();
				this.getTasksAndExams();
			});
	}

	private enableControls() {
		this.subjectFormControl.enable({ emitEvent: false });
		this.studentFilterControl.enable({ emitEvent: false });
		this.filteredStudents = of(this.studentsInACourse);
		this.listenStudentFilterChanges();
		this.listenSubjectChanges();
		this.controlsEnabled = true;
	}

	public showSelectedStudent(option: MatAutocompleteSelectedEvent) {
		const value = option.option.value;

		if (value === 'Todos')
			return this.students$.next(this.studentsInACourse);

		const student = this.studentsInACourse.find(
			student => `${student.name} ${student.lastname}` === value
		);

		this.students$.next([student as Student]);
	}
}
