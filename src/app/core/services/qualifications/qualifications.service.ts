import { Injectable, WritableSignal, computed, signal } from '@angular/core';
import { ApiService } from '../api/api.service';
import {
	BehaviorSubject,
	EMPTY,
	Observable,
	catchError,
	combineLatest,
	forkJoin,
	map,
	of,
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
import { TasksService } from '../tasks/tasks.service';
import { ExamsService } from '../exams/exams.service';
import { StudentsService } from '../students/students.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WorkBase } from '../../interfaces/work-base.interface';
import { UpdateTask } from '../../interfaces/update-task.interface';
import { UpdateExam } from '../../interfaces/update-exam.interface';
import { ControlType } from '../../../modules/main/qualifications/components/create-dialog/interfaces/control-type.interface';
import { DateRangeFromMaterial } from '../../../modules/main/qualifications/interfaces/range-date.interface';

@Injectable({
	providedIn: 'root',
})
export class QualificationsService {
	public spinnerProgressOn = signal(false);
	public letterSelected: WritableSignal<string | null> = signal(null);
	public cleanAlphabet = new BehaviorSubject(false);
	public cleanAlphabet$ = this.cleanAlphabet.asObservable();
	public subjects$ = this.apiService.get<SchoolSubject[]>(Endpoints.SUBJECTS);
	public courses$ = this.apiService.get<Course[]>(Endpoints.COURSES);
	public markings$ = this.apiService.get<Marking[]>(Endpoints.MARKINGS);
	public subjects = toSignal(this.subjects$, { initialValue: [] });
	public courses = toSignal(this.courses$, { initialValue: [] });
	public markings = toSignal(this.markings$, { initialValue: [] });
	public tasks: WritableSignal<Task[]> = signal([]);
	public exams: WritableSignal<Exam[]> = signal([]);
	public students: WritableSignal<Student[] | undefined> = signal(undefined);
	public studentIsSelected = computed(() =>
		this.students()
			? this.students()!.filter(s => s.show)?.length <= 1
			: false
	);
	public noStudentShowingForMobile = computed(() =>
		this.students()
			? this.students()!.filter(s => s.showForMobile)?.length === 0
			: false
	);
	public selectedCourseId: WritableSignal<number> = signal(0);
	public selectedDateRange: WritableSignal<DateRangeFromMaterial> = signal({
		start: null,
		end: null,
	});
	public selectedSubjectId = signal(0);
	public selectedWorkType: WritableSignal<Work> = signal(Work.TASK);
	public tasksExamsAndStudentsSubject = new BehaviorSubject<
		[TasksAndExamsQueryParams | null, StudentsParams | null]
	>([null, null]);
	public tasksExamsAndStudents$ = this.tasksExamsAndStudentsSubject
		.asObservable()
		.pipe(
			tap(([tasksAndExamsQueryParams, studentsQueryParams]) => {
				if (tasksAndExamsQueryParams || studentsQueryParams)
					this.spinnerProgressOn.set(true);
			}),
			map(([tasksAndExamsQueryParams, studentsQueryParams]) => {
				if (
					(!tasksAndExamsQueryParams && !studentsQueryParams) ||
					!tasksAndExamsQueryParams?.courseId
				)
					return [of([]), of([]), of([])];

				const students$ = studentsQueryParams
					? this.ss.getStudents(studentsQueryParams)
					: of(this.students());

				return [
					this.ts.getTasks(tasksAndExamsQueryParams),
					this.es.getExams(tasksAndExamsQueryParams),
					students$,
				] as Observable<Task[] | Exam[] | Student[]>[];
			}),
			switchMap(observablesArray => forkJoin(observablesArray)),
			map(([tasks, exams, students]) => {
				if ((tasks.length || exams.length) && students.length) {
					this.setSignalsValues(
						tasks as Task[],
						exams as Exam[],
						students as Student[]
					);

					return [tasks, exams, students];
				}

				return [null, null, null];
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
	private filtersChanges = new BehaviorSubject({
		course: 0,
		dateRange: { start: null, end: null },
	});
	private filtersChanges$ = this.filtersChanges.asObservable();
	public filteredData$ = combineLatest([
		this.tasksExamsAndStudents$,
		this.filtersChanges$,
	]).pipe(
		tap(([[tasks, exams, students], filtersChanges]) => {
			const { course: courseId, dateRange } = filtersChanges;

			if (courseId !== this.selectedCourseId()) {
				const queryParam = { courseId };

				this.selectedCourseId.set(courseId);
				this.getTasksExamsAndStudents(
					queryParam,
					queryParam as unknown as StudentsParams | null
				);
				return;
			}

			if (
				JSON.stringify(dateRange ?? { start: null, end: null }) !==
				JSON.stringify(this.selectedDateRange())
			) {
				const queryParams = this.checkForDateChange(dateRange);

				this.selectedDateRange.set(dateRange);

				if (queryParams) this.getTasksExamsAndStudents(queryParams);

				return;
			}

			if (
				tasks &&
				exams &&
				students &&
				((dateRange?.start && dateRange?.end) ||
					(!dateRange?.start && !dateRange?.end))
			) {
				this.filterData(filtersChanges);
			}

			this.spinnerProgressOn.set(false);
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
		studentsQueryParams: StudentsParams | null = null
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
		this.exams.set(exams);
		this.students.set(students);
		this.cleanAllShow();
	}

	public setFilters(changes: any) {
		this.filtersChanges.next(changes);
	}

	private filterData({ subject, student, task, exam }: any) {
		this.selectedSubjectId.set(subject ?? 0);
		if (!student) this.cleanAlphabet.next(true);
		this.filterValues(student);
		this.filterValues(task, 'Tasks');
		this.filterValues(exam, 'Exams');
	}

	private checkForDateChange({ start, end }: DateRangeFromMaterial) {
		const queryParams: TasksAndExamsQueryParams = {
			courseId: this.selectedCourseId(),
		};

		if (start && end)
			return {
				...queryParams,
				startDate: (start as unknown as Date).getTime(),
				endDate: (end as unknown as Date).getTime(),
			};

		if (!start && !end) return queryParams;

		return;
	}

	public filterValues(
		value: string | null,
		controlType: ControlType = 'Students'
	): void {
		const valueToFilter = value?.toLowerCase();
		let signalToFilter: WritableSignal<Student[] | Task[] | Exam[]> = this
			.students as WritableSignal<Student[]>;

		if (controlType === 'Tasks') signalToFilter = this.tasks;
		if (controlType === 'Exams') signalToFilter = this.exams;

		if (!value) return this.cleanShow(signalToFilter);

		this.processAutocompleteOutput(valueToFilter as string, signalToFilter);
	}

	private processAutocompleteOutput(
		valueToFilter: string,
		signalToFilter: WritableSignal<Student[] | Task[] | Exam[]>
	) {
		signalToFilter.mutate(elements => {
			elements.forEach(element => {
				if (this.isStudentElement(element as Task | Exam | Student)) {
					`${(element as Student).name} ${
						(element as Student).lastname
					}`
						.toLowerCase()
						.includes(valueToFilter)
						? (element.show = true)
						: (element.show = false);
				} else {
					(element as Task | Exam).name
						.toLowerCase()
						.includes(valueToFilter)
						? (element.show = true)
						: (element.show = false);
				}
			});
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
		const students = this.students() ?? [];

		this.cleanShow(this.students as WritableSignal<Student[]>);

		const studentSelected = students.find(
			student => `${student.name} ${student.lastname}` === value
		);

		this.students.mutate(students => {
			students
				? students.forEach(student => {
						if (student.id !== studentSelected?.id)
							student.show = false;

						if (student.id === studentSelected?.id)
							student.showForMobile = true;
				  })
				: null;
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

		const selectedElement = (selectedSignal() as WorkBase[]).find(
			element => element.name === valueSelected
		);

		selectedSignal.mutate(elements => {
			elements.forEach(element => {
				if (element.id !== selectedElement?.id) element.show = false;
			});
		});
	}

	public cleanShow(signal: WritableSignal<Task[] | Exam[] | Student[]>) {
		signal.update(elements => {
			elements.forEach(element => {
				element.show = true;

				if ('showForMobile' in element) element.showForMobile = false;
			});

			return JSON.parse(JSON.stringify(elements));
		});
	}

	private cleanAllShow() {
		this.cleanShow(this.tasks);
		this.cleanShow(this.exams);
		this.cleanShow(this.students as WritableSignal<Student[]>);
	}

	public handleHttpResponseMessage(
		responseMessage = 'Ocurrió un error con su pedido. Comuníquese con soporte para solucionarlo.'
	) {
		this._snackBar.open(responseMessage, '', { duration: 4000 });
	}

	public updateWorkCardInfo(
		workId: number,
		updatedWork: UpdateTask | UpdateExam
	) {
		if (this.selectedWorkType() === Work.TASK) {
			this.tasks.mutate(tasks =>
				this.filterAndUpdateSelectedWork(workId, updatedWork, tasks)
			);

			return;
		}

		this.exams.mutate(exams =>
			this.filterAndUpdateSelectedWork(workId, updatedWork, exams)
		);
	}

	private filterAndUpdateSelectedWork(
		workId: number,
		updatedWork: UpdateTask | UpdateExam,
		works: Task[] | Exam[]
	) {
		const selectedWorkIndex = works.findIndex(work => work.id === workId);

		works[selectedWorkIndex] = {
			...works[selectedWorkIndex],
			...updatedWork,
		} as Task | Exam;
	}

	public setShowByLetter(letter: string) {
		this.students.mutate(students => {
			students
				? students.forEach(student => {
						if (
							student?.lastname?.charAt(0).toUpperCase() ===
							letter.toUpperCase()
						) {
							student.showForMobile = true;
						}
				  })
				: null;
		});
	}
}
