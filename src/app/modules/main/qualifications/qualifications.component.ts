import {
	Component,
	OnDestroy,
	OnInit,
	QueryList,
	ViewChild,
	ViewChildren,
	WritableSignal,
	effect,
	signal,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
	Observable,
	Subject,
	filter,
	forkJoin,
	map,
	startWith,
	takeUntil,
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
import { Work } from './enums/work.enum';
import { Endpoints } from './enums/endpoints.enum';
import { MatMiniFabButton } from '@angular/material/button';
import { AllWord } from './enums/all-word.enum';

type ControlType = 'Students' | 'Tasks' | 'Exams';

@Component({
	selector: 'app-qualifications',
	templateUrl: './qualifications.component.html',
	styleUrls: ['./qualifications.component.scss'],
})
export class QualificationsComponent implements OnInit, OnDestroy {
	public tasks: WritableSignal<Task[]> = signal([]);
	public exams: WritableSignal<Exam[]> = signal([]);
	public students: WritableSignal<Student[]> = signal([]);
	public subjects$: Observable<schoolSubject[]> = this.apiService.get(
		Endpoints.SUBJECTS
	);
	public courses$: Observable<Course[]> = this.apiService.get(
		Endpoints.COURSES
	);
	public markings: WritableSignal<Marking[]> = signal([]);
	public filteredStudents: WritableSignal<Student[]> = signal([]);
	public filteredTasks: WritableSignal<Task[]> = signal([]);
	public filteredExams: WritableSignal<Exam[]> = signal([]);
	public filtersForm = this.fb.nonNullable.group({
		student: [{ value: '', disabled: true }],
		task: [{ value: '', disabled: true }],
		exam: [{ value: '', disabled: true }],
		subject: [{ value: 0, disabled: true }],
		course: 0,
		dateRange: this.fb.group({
			start: { value: null, disabled: true },
			end: { value: null, disabled: true },
		}),
	});
	public allWord = AllWord;
	public WorkEnum = Work;
	private taskAndExamsParams: taskAndExamsParams | null = null;
	private studentsParams: StudentsParams | null = null;
	private destroy: Subject<boolean> = new Subject<boolean>();
	@ViewChildren('tabChildren') tabChildren!: QueryList<MatTabGroup>;
	@ViewChild('clearRangeButton', { static: false })
	clearRangeButton!: MatMiniFabButton;

	constructor(private apiService: ApiService, private fb: FormBuilder) {
		//  effect() can only be used within an injection context such as a constructor, a factory function, a field initializer, or a function used with `runInInjectionContext`. Find more at https://angular.io/errors/NG0203
		this.scrollToLatestEffect();
	}

	ngOnInit() {
		this.getMarkings();
		this.listenCourseChanges();
	}

	ngOnDestroy(): void {
		this.destroy.next(true);
		this.destroy.unsubscribe();
	}

	private getMarkings() {
		this.apiService.get<Marking[]>(Endpoints.MARKINGS).subscribe(result => {
			this.markings.set(result);
		});
	}

	private getTasksAndExams() {
		const tasksObs$ = this.apiService.get<Task[]>(Endpoints.TASKS, {
			params: this.taskAndExamsParams,
		});
		const examsObs$ = this.apiService.get<Exam[]>(Endpoints.EXAMS, {
			params: this.taskAndExamsParams,
		});

		forkJoin([tasksObs$, examsObs$]).subscribe(result => {
			const tasks = result[0];
			const exams = result[1];

			this.tasks.set(tasks);
			this.exams.set(exams);
			this.filteredTasks.set(tasks);
			this.filteredExams.set(exams);
		});
	}

	private getStudents() {
		this.apiService
			.get<Student[]>(Endpoints.STUDENTS, {
				params: this.studentsParams,
			})
			.subscribe(students => {
				this.students.set(students);
				this.filteredStudents.set(students);

				if (this.filtersForm.get('subject')?.disabled)
					this.enableControls();
			});
	}

	private scrollToLatestEffect() {
		effect(() => {
			// cuando emita cualquiera de los siguientes signals se va a disparar
			this.filteredStudents();
			this.exams();
			this.tasks();
			this.filteredExams();
			this.filteredTasks();

			setTimeout(() => {
				for (const tab of this.tabChildren) {
					const containerElement = tab._elementRef.nativeElement;
					const scrollOwnerElement: Element =
						containerElement.lastChild?.firstChild?.firstChild; //.mat-mdc-tab-body-content

					if (scrollOwnerElement)
						scrollOwnerElement.scrollTo({
							left: containerElement.scrollWidth + 1000000, // Establece la posición a la derecha (al final)
						});
				}
			}, 0);
		});
	}

	private listenFiltersChanges() {
		this.listenSubjectChanges();
		this.listenRangeDates();

		this.processValueChangesObservable(
			this.filtersForm.get('student')?.valueChanges
		)?.subscribe(result => {
			this.filteredStudents.set(result as Student[]);
		});

		this.processValueChangesObservable(
			this.filtersForm.get('task')?.valueChanges,
			'Tasks'
		)?.subscribe(result => {
			this.filteredTasks.set(result as Task[]);
		});

		this.processValueChangesObservable(
			this.filtersForm.get('exam')?.valueChanges,
			'Exams'
		)?.subscribe(result => {
			this.filteredExams.set(result as Exam[]);
		});
	}

	private processValueChangesObservable(
		valueChanges$: Observable<string | null> | undefined,
		controlType: ControlType = 'Students'
	) {
		return valueChanges$?.pipe(
			startWith(''),
			map(value => this.filterValues(value, controlType)),
			takeUntil(this.destroy)
		);
	}

	private filterValues(
		value: string | null,
		controlType: ControlType = 'Students'
	): Student[] | Task[] | Exam[] {
		let selectedArray: Student[] | Task[] | Exam[] = this.students();

		if (controlType === 'Tasks') selectedArray = this.tasks();
		if (controlType === 'Exams') selectedArray = this.exams();

		if (!value) return selectedArray;

		return this.processAutocompleteOutput(
			value!.toLowerCase(),
			selectedArray
		);
	}

	private processAutocompleteOutput(
		filterValue: string,
		arrayToFilter: any[]
	) {
		return arrayToFilter.filter((element: Student | Task | Exam) => {
			if (this.isStudentElement(element)) {
				return `${element.name} ${element.lastname}`
					.toLowerCase()
					.includes(filterValue);
			}

			return element.name.toLowerCase().includes(filterValue);
		});
	}

	//es una función Type Guard de Tyepscript
	private isStudentElement(
		element: Student | Task | Exam
	): element is Student {
		return 'lastname' in element;
	}

	private listenSubjectChanges() {
		this.filtersForm
			.get('subject')
			?.valueChanges.pipe(takeUntil(this.destroy))
			.subscribe(subjectId => {
				this.taskAndExamsParams = {
					...this.taskAndExamsParams,
					subjectId,
				};

				this.getTasksAndExams();
			});
	}

	private listenCourseChanges() {
		this.filtersForm
			.get('course')
			?.valueChanges.pipe(takeUntil(this.destroy))
			.subscribe(courseId => {
				this.studentsParams = {
					...this.studentsParams,
					courseId,
				};

				this.taskAndExamsParams = {
					...this.taskAndExamsParams,
					courseId,
				};

				this.getStudents();
				this.getTasksAndExams();
			});
	}

	private listenRangeDates() {
		this.filtersForm
			.get('dateRange')
			?.valueChanges.pipe(
				filter((value: any) => value.start && value.end),
				takeUntil(this.destroy)
			)
			.subscribe((value: { start: Date; end: Date }) => {
				this.taskAndExamsParams = {
					...this.taskAndExamsParams,
					startDate: value.start.getTime(),
					endDate: value.end.getTime(),
				};

				this.disableRangeClearButton(false);
				this.getTasksAndExams();
			});
	}

	private enableControls() {
		this.filtersForm.enable({ emitEvent: false });
		this.listenFiltersChanges();
	}

	public showSelectedStudent(option: MatAutocompleteSelectedEvent) {
		const value = option.option.value;

		if (value === AllWord.INCLUSIVE)
			return this.filteredStudents.set(this.students());

		const student = this.students().find(
			student => `${student.name} ${student.lastname}` === value
		);

		this.filteredStudents.set([student as Student]);
	}

	public showSelectedTaskOrExam(
		option: MatAutocompleteSelectedEvent,
		type = this.WorkEnum.TASK
	) {
		const valueSelected = option.option.value;
		let completeArray: Task[] | Exam[] = this.tasks();
		let signalSelectedToFilter:
			| WritableSignal<Task[]>
			| WritableSignal<Exam[]> = this.filteredTasks;

		if (type === this.WorkEnum.EXAM) {
			completeArray = this.exams();
			signalSelectedToFilter = this.filteredExams;
		}

		if (valueSelected === AllWord.FEMALE || valueSelected === AllWord.MALE)
			return signalSelectedToFilter.set(completeArray);

		const objectToEmit = completeArray.find(
			element => element.name === valueSelected
		);

		return signalSelectedToFilter.set([objectToEmit as Task | Exam]);
	}

	private disableRangeClearButton(disable = true) {
		this.clearRangeButton.disabled = disable;
	}

	public resetDatePeriod() {
		this.filtersForm.get('dateRange')?.reset();
		delete this.taskAndExamsParams?.startDate;
		delete this.taskAndExamsParams?.endDate;
		this.getTasksAndExams();
		this.disableRangeClearButton();
	}
}
