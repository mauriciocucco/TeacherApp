import { Injectable, WritableSignal, signal } from '@angular/core';
import { ApiService } from '../api/api.service';
import {
	BehaviorSubject,
	EMPTY,
	Observable,
	catchError,
	filter,
	forkJoin,
	map,
	startWith,
	switchMap,
	tap,
} from 'rxjs';
import { Endpoints } from '../../enums/endpoints.enum';
import { Subject as SchoolSubject } from '../../../core/interfaces/subject.interface';
import { toSignal } from '@angular/core/rxjs-interop';
import { Course } from '../../interfaces/course.interface';
import { Marking } from '../../interfaces/marking.interface';
import { Task } from '../../interfaces/task.interface';
import { Exam } from '../../interfaces/exam.interface';
import { Student } from '../../interfaces/student.interface';
import { TasksAndExamsQueryParams } from '../../../modules/main/qualifications/interfaces/tasks-and-exams-query-params.interface';
import { StudentsParams } from '../../../modules/main/qualifications/interfaces/students-params.interface';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Work } from '../../enums/work.enum';
import { AllWord } from '../../enums/all-word.enum';
import { TasksService } from '../tasks/tasks.service';
import { ExamsService } from '../exams/exams.service';
import { StudentsService } from '../students/students.service';
import { MatSnackBar } from '@angular/material/snack-bar';

type ControlType = 'Students' | 'Tasks' | 'Exams';

@Injectable({
	providedIn: 'root',
})
export class QualificationsService {
	private subjects$ = this.apiService.get<SchoolSubject[]>(
		Endpoints.SUBJECTS
	);
	private courses$ = this.apiService.get<Course[]>(Endpoints.COURSES);
	private markings$ = this.apiService.get<Marking[]>(Endpoints.MARKINGS);
	private tasksExamsAndStudentsSubject = new BehaviorSubject<
		[TasksAndExamsQueryParams | null, StudentsParams | null]
	>([null, null]);
	public subjects = toSignal(this.subjects$, { initialValue: [] });
	public courses = toSignal(this.courses$, { initialValue: [] });
	public markings = toSignal(this.markings$, { initialValue: [] });
	public tasks: WritableSignal<Task[]> = signal([]);
	public exams: WritableSignal<Exam[]> = signal([]);
	public students: WritableSignal<Student[]> = signal([]);
	public filteredTasksForAutocomplete: WritableSignal<Task[]> = signal([]);
	public filteredExamsForAutocomplete: WritableSignal<Exam[]> = signal([]);
	public filteredStudentsForAutocomplete: WritableSignal<Student[]> = signal(
		[]
	);
	public spinnerProgressOn = signal(false);
	public tasksExamsAndStudents$ = this.tasksExamsAndStudentsSubject
		.asObservable()
		.pipe(
			filter(
				([tasksAnExamsQueryParams, studentsQueryParams]) =>
					tasksAnExamsQueryParams !== null
			),
			tap(() => {
				this.spinnerProgressOn.set(true);
			}),
			map(([tasksAndExamsQueryParams, studentsQueryParams]) => [
				this.ts.getTasks(tasksAndExamsQueryParams),
				this.es.getExams(tasksAndExamsQueryParams),
				this.ss.getStudents(studentsQueryParams),
			]),
			switchMap(observablesArray => forkJoin(observablesArray)),
			tap(result => {
				this.setSignalsValues(
					result[0] as Task[],
					result[1] as Exam[],
					result[2] as Student[]
				);
				this.cleanAllShow();
				this.spinnerProgressOn.set(false);
			}),
			catchError(error => {
				console.log(
					'Hubo un error en el stream de tasksExamsAndStudents$: ',
					error
				);
				this.spinnerProgressOn.set(false);

				return EMPTY;
			})
		);

	constructor(
		private apiService: ApiService,
		private ts: TasksService,
		private es: ExamsService,
		private ss: StudentsService,
		private _snackBar: MatSnackBar
	) {}

	public getTasksExamsAndStudents(
		tasksAndExamsQueryParams: TasksAndExamsQueryParams | null,
		studentsQueryParams: StudentsParams | null
	) {
		this.tasksExamsAndStudentsSubject.next([
			tasksAndExamsQueryParams,
			studentsQueryParams,
		]);
	}

	private setSignalsValues(
		tasks: Task[],
		exams: Exam[],
		students: Student[]
	) {
		this.tasks.set(tasks);
		this.filteredTasksForAutocomplete.set(tasks);
		this.exams.set(exams);
		this.filteredExamsForAutocomplete.set(exams);

		if (students.length) {
			//Porque sin ellos no se muestran las tareas y exámenes en el template
			this.students.set(students);
			this.filteredStudentsForAutocomplete.set(students);
		}
	}

	public processValueChanges(
		valueChanges$: Observable<string | null> | undefined,
		controlType: ControlType = 'Students'
	) {
		return valueChanges$?.pipe(
			startWith(''),
			map(value => this.filterValues(value, controlType))
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
			value.toLowerCase(),
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

	public showSelectedStudent(option: MatAutocompleteSelectedEvent) {
		const value = option.option.value;

		this.cleanShow(this.students);

		if (value === AllWord.INCLUSIVE) return;

		const studentSelected = this.students().find(
			student => `${student.name} ${student.lastname}` === value
		);

		this.students.mutate(students => {
			students.forEach(student => {
				if (student.id !== studentSelected?.id) student.show = false;
			});
		});
	}

	public showSelectedTaskOrExam(
		option: MatAutocompleteSelectedEvent,
		type = Work.TASK
	) {
		const valueSelected = option.option.value;
		let selectedSignal: WritableSignal<Task[]> | WritableSignal<Exam[]> =
			this.tasks;

		if (type === Work.EXAM) selectedSignal = this.exams;

		this.cleanShow(selectedSignal);

		if (valueSelected === AllWord.FEMALE || valueSelected === AllWord.MALE)
			return;

		const selectedElement = selectedSignal().find(
			element => element.name === valueSelected
		);

		selectedSignal.mutate(elements => {
			elements.forEach(element => {
				if (element.id !== selectedElement?.id) element.show = false;
			});
		});
	}

	public filterTasksAndExamsBySubject(subjectId: number) {
		this.cleanShow(this.tasks);
		this.cleanShow(this.exams);

		if (!subjectId) return;

		this.tasks.mutate(tasks => {
			tasks.forEach(task => {
				if (task.subjectId !== subjectId) task.show = false;
			});
		});

		this.exams.mutate(exams => {
			exams.forEach(exam => {
				if (exam.subjectId !== subjectId) exam.show = false;
			});
		});
	}

	private cleanShow(signal: WritableSignal<Task[] | Exam[] | Student[]>) {
		signal.mutate(elements => {
			elements.forEach(element => (element.show = true));
		});
	}

	private cleanAllShow() {
		this.cleanShow(this.tasks);
		this.cleanShow(this.exams);
		this.cleanShow(this.students);
	}

	public handleHttpResponseMessage(
		responseMessage = 'Ocurrió un error con su pedido'
	) {
		this._snackBar.open(responseMessage, '', { duration: 3000 });
	}
}
