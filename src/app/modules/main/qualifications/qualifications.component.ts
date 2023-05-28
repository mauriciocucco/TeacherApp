import {
	Component,
	OnDestroy,
	OnInit,
	QueryList,
	ViewChild,
	ViewChildren,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
	BehaviorSubject,
	Observable,
	Subject,
	combineLatest,
	filter,
	forkJoin,
	map,
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
import { Work } from './enums/work.enum';
import { Endpoints } from './enums/endpoints.enum';
import { MatMiniFabButton } from '@angular/material/button';

type ControlType = 'Students' | 'Tasks' | 'Exams';
enum AllWord {
	MALE = 'Todos',
	FEMALE = 'Todas',
	INCLUSIVE = 'Todxs',
}

@Component({
	selector: 'app-qualifications',
	templateUrl: './qualifications.component.html',
	styleUrls: ['./qualifications.component.scss'],
})
export class QualificationsComponent implements OnInit, OnDestroy {
	private tasks$: BehaviorSubject<Task[]> = new BehaviorSubject([] as Task[]); //es un Subject para poder emitir valores luego de ser filtrado por materia
	private exams$: BehaviorSubject<Exam[]> = new BehaviorSubject([] as Exam[]); //es un Subject para poder emitir valores luego de ser filtrado por materia
	private taskAndExamsParams: taskAndExamsParams | null = null;
	private studentsParams: StudentsParams | null = null;
	private formControlsEnabled = false;
	private destroy: Subject<boolean> = new Subject<boolean>();
	public WorkEnum = Work;
	public students$: Subject<Student[]> = new Subject(); //es un Subject para poder emitir valores luego de ser filtrado por curso
	public studentsInACourse: Student[] = []; //para el filtro por nombre del estudiante
	public subjects$: Observable<schoolSubject[]> = this.apiService.get(
		Endpoints.SUBJECTS
	);
	public courses$: Observable<Course[]> = this.apiService.get(
		Endpoints.COURSES
	);
	public markings: Marking[] = [];
	public filteredTasksBySubject: Task[] = []; //para el filtro por nombre de la tarea
	public filteredExamsBySubject: Exam[] = []; //para el filtro por nombre del exámen
	public studentFilterControl = new FormControl({
		value: '',
		disabled: true,
	});
	public taskFilterControl = new FormControl({
		value: '',
		disabled: true,
	});
	public examFilterControl = new FormControl({
		value: '',
		disabled: true,
	});
	public filteredStudents: Student[] = [];
	public filteredTasks: Task[] = [];
	public filteredExams: Exam[] = [];
	public subjectFormControl = new FormControl<number>(
		{ value: 0, disabled: true },
		{
			nonNullable: true,
		}
	);
	public courseFormControl = new FormControl<number>(0, {
		nonNullable: true,
	});
	public dateRangeFormControl = new FormGroup({
		start: new FormControl<Date | number | null>({
			value: null,
			disabled: true,
		}),
		end: new FormControl<Date | number | null>({
			value: null,
			disabled: true,
		}),
	});
	public vm$ = combineLatest([this.tasks$, this.exams$, this.students$]).pipe(
		map(([tasks, exams, students]) => ({
			tasks,
			exams,
			students,
		})),
		tap(() => this.scrollToLatest())
	);
	public allWord = AllWord;
	@ViewChildren('tabChildren') tabChildren!: QueryList<MatTabGroup>;
	@ViewChild('clearRangeButton', { static: false })
	clearRangeButton!: MatMiniFabButton;

	constructor(private apiService: ApiService) {}

	ngOnInit() {
		this.getMarkings();
		this.listenCourseChanges();
	}

	ngOnDestroy(): void {
		this.destroy.next(true);
		this.destroy.unsubscribe();
	}

	private getMarkings() {
		this.apiService.get(Endpoints.MARKINGS).subscribe(result => {
			/** no se deja como observable (marking$) porque sino con el pipe async
			 *  se va a subscribir por cada tarea en cada card */
			this.markings = result as Marking[];
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

			this.tasks$.next(tasks); // esto es para que emita el combineLatest de vm$
			this.exams$.next(exams); // esto es para que emita el combineLatest de vm$
			this.filteredTasksBySubject = tasks; //guarda el total de los elementos filtrados por materia
			this.filteredExamsBySubject = exams; //guarda el total de los elementos filtrados por materia
			this.filteredTasks = tasks;
			this.filteredExams = exams;
		});
	}

	private getStudents() {
		this.apiService
			.get<Student[]>(Endpoints.STUDENTS, {
				params: this.studentsParams,
			})
			.subscribe(students => {
				this.students$.next(students);
				this.studentsInACourse = students;
				this.filteredStudents = students;
				if (!this.formControlsEnabled) this.enableControls();
			});
	}

	private scrollToLatest() {
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
	}

	private listenFiltersChanges() {
		this.processValueChangesObservable(
			this.studentFilterControl.valueChanges
		).subscribe(result => {
			this.filteredStudents = result as Student[];
		});

		this.processValueChangesObservable(
			this.taskFilterControl.valueChanges,
			'Tasks'
		).subscribe(result => {
			this.filteredTasks = result as Task[];
		});

		this.processValueChangesObservable(
			this.examFilterControl.valueChanges,
			'Exams'
		).subscribe(result => {
			this.filteredExams = result as Exam[];
		});
	}

	private processValueChangesObservable(
		valueChanges$: Observable<string | null>,
		controlType: ControlType = 'Students'
	) {
		return valueChanges$.pipe(
			startWith(''),
			map(value => this.filterValues(value, controlType)),
			takeUntil(this.destroy)
		);
	}

	private filterValues(
		value: string | null,
		controlType: ControlType = 'Students'
	): Student[] | Task[] | Exam[] {
		let selectedArray: Student[] | Task[] | Exam[] = this.studentsInACourse;

		if (controlType === 'Tasks')
			selectedArray = this.filteredTasksBySubject;
		if (controlType === 'Exams')
			selectedArray = this.filteredExamsBySubject;

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

	private listenRangeDates() {
		this.dateRangeFormControl.valueChanges
			.pipe(
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
		this.subjectFormControl.enable({ emitEvent: false });
		this.studentFilterControl.enable({ emitEvent: false });
		this.taskFilterControl.enable({ emitEvent: false });
		this.examFilterControl.enable({ emitEvent: false });
		this.dateRangeFormControl.enable({ emitEvent: false });
		this.listenFiltersChanges();
		this.listenSubjectChanges();
		this.listenRangeDates();
		this.formControlsEnabled = true;
	}

	public showSelectedStudent(option: MatAutocompleteSelectedEvent) {
		const value = option.option.value;

		if (value === AllWord.INCLUSIVE)
			return this.students$.next(this.studentsInACourse);

		const student = this.studentsInACourse.find(
			student => `${student.name} ${student.lastname}` === value
		);

		this.students$.next([student as Student]);
	}

	public showSelectedTaskOrExam(
		option: MatAutocompleteSelectedEvent,
		type = this.WorkEnum.TASK
	) {
		const valueSelected = option.option.value;
		let arraySelected: Task[] | Exam[] = this.filteredTasksBySubject;
		let behaviorSubjectSelected:
			| BehaviorSubject<Task[]>
			| BehaviorSubject<Exam[]> = this.tasks$;

		if (type === this.WorkEnum.EXAM) {
			arraySelected = this.filteredExamsBySubject;
			behaviorSubjectSelected = this.exams$;
		}

		if (valueSelected === AllWord.FEMALE || valueSelected === AllWord.MALE)
			return behaviorSubjectSelected.next(arraySelected);

		const objectToEmit = arraySelected.find(
			element => element.name === valueSelected
		);

		return behaviorSubjectSelected.next([objectToEmit as Task | Exam]);
	}

	private disableRangeClearButton(disable = true) {
		this.clearRangeButton.disabled = disable;
	}

	public resetDatePeriod() {
		this.dateRangeFormControl.reset();
		delete this.taskAndExamsParams?.startDate;
		delete this.taskAndExamsParams?.endDate;
		this.getTasksAndExams();
		this.disableRangeClearButton();
	}
}
