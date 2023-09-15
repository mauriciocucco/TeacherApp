import { Injectable, WritableSignal, computed, signal } from '@angular/core';
import { ApiService } from '../api/api.service';
import {
	BehaviorSubject,
	EMPTY,
	Observable,
	catchError,
	combineLatest,
	finalize,
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
import { FormFilters } from '../../../modules/main/qualifications/interfaces/form-filters.interface';
import { MatDialogRef } from '@angular/material/dialog';
import { DeleteDialogComponent } from '../../../modules/main/qualifications/components/delete-dialog/delete-dialog.component';
import { InfoDialogComponent } from '../../../modules/main/qualifications/components/info-dialog/info-dialog.component';
import { UpdatePayload } from '../../interfaces/update-payload.interface';
import { CreateDialogComponent } from '../../../modules/main/qualifications/components/create-dialog/create-dialog.component';
import { CreatePayload } from '../../interfaces/create-payload.interface';
import { CreateTask } from '../../interfaces/create-task.interface';
import { CreateExam } from '../../interfaces/create-exam.interface';
import { MultipleMarkingSetterComponent } from '../../../modules/main/qualifications/components/multiple-marking-setter/multiple-marking-setter.component';

@Injectable({
	providedIn: 'root',
})
export class QualificationsService {
	public refreshView = signal(false);
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
	public students: WritableSignal<Student[]> = signal([]);
	public studentIsSelected = computed(() =>
		this.students()
			? this.students().filter(s => s.show)?.length <= 1
			: false
	);
	public noStudentShowingForMobile = computed(() =>
		this.students()
			? this.students().filter(s => s.showForMobile)?.length === 0
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
			map(
				([tasksAndExamsQueryParams, studentsQueryParams]) =>
					[
						this.ts.getTasks(tasksAndExamsQueryParams),
						this.es.getExams(tasksAndExamsQueryParams),
						this.ss.getStudents(studentsQueryParams),
					] as Observable<Task[] | Exam[] | Student[]>[]
			),
			switchMap(observablesArray => forkJoin(observablesArray)),
			tap(([tasks, exams, students]) =>
				this.setSignalsValues(
					tasks as Task[],
					exams as Exam[],
					students as Student[]
				)
			),
			catchError(error => {
				console.error(
					'Hubo un error en el stream de tasksExamsAndStudents$: ',
					error
				);

				return EMPTY;
			})
		);
	private filtersChanges: BehaviorSubject<FormFilters> = new BehaviorSubject({
		course: 0,
		dateRange: { start: null, end: null },
	} as FormFilters);
	private filtersChanges$ = this.filtersChanges.asObservable();
	public filteredData$ = combineLatest([
		this.tasksExamsAndStudents$,
		this.filtersChanges$,
	]).pipe(
		tap(([[tasks, exams, students], filtersChanges]) => {
			const {
				course: courseId,
				subject,
				student,
				dateRange,
			} = filtersChanges;

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

			if (!student) this.cleanAlphabet.next(true);

			if (tasks.length && exams.length && students.length) {
				this.selectedSubjectId.set(subject ?? 0);
				this.filterData(filtersChanges);
			}
		})
	);
	private deleteDialogRef!: MatDialogRef<DeleteDialogComponent>;
	private deleteWork = new BehaviorSubject(0);
	public deleteWork$ = this.deleteWork.asObservable().pipe(
		switchMap(workId => {
			if (!workId) return of(true);

			const delete$ =
				this.selectedWorkType() === Work.TASK
					? this.ts.deleteTask(workId)
					: this.es.deleteExam(workId);

			return delete$.pipe(
				catchError(error => {
					console.error(
						'Hubo un error en el stream de deleteWork$: ',
						error
					);
					this.handleHttpResponseMessage();

					return EMPTY;
				}),
				finalize(() => {
					this.deleteDialogRef.close();
				})
			);
		}),
		tap(deletedWork => {
			if (!deletedWork.name) return;

			this.resetWorks();
			this.handleHttpResponseMessage(`Se eliminó "${deletedWork.name}".`);
		})
	);
	private updateDialogRef!: MatDialogRef<
		InfoDialogComponent | MultipleMarkingSetterComponent
	>;
	private updateWork = new BehaviorSubject({
		workId: 0,
		name: '',
		description: '',
		date: '',
	});
	public updateWork$ = this.updateWork.asObservable().pipe(
		switchMap(({ workId, ...payload }) => {
			if (!workId) return of(true);

			const update$ =
				this.selectedWorkType() === Work.TASK
					? this.ts.updateTask(payload, workId)
					: this.es.updateExam(payload, workId);

			return update$.pipe(
				catchError(error => {
					console.error(
						'Hubo un error en el stream de updateWork$: ',
						error
					);
					this.handleHttpResponseMessage();

					return EMPTY;
				}),
				finalize(() => {
					this.updateDialogRef.close();
					this.updateWork.next({ workId: 0 } as UpdatePayload);
				})
			);
		}),
		tap(updatedWork => {
			if (!updatedWork.name) return;

			this.refreshView()
				? this.resetWorks()
				: this.updateWorkCardInfo(updatedWork.id, updatedWork);
			this.handleHttpResponseMessage('La edición fue exitosa.');
		})
	);
	private createDialogRef!: MatDialogRef<CreateDialogComponent>;
	private createWork = new BehaviorSubject({
		name: '',
	});
	public createWork$ = this.createWork.asObservable().pipe(
		switchMap(payload => {
			if (!payload.name) return of(true);

			const create$ =
				this.selectedWorkType() === Work.TASK
					? this.ts.createTask(payload as CreateTask)
					: this.es.createExam(payload as CreateExam);

			return create$.pipe(
				catchError(error => {
					console.error(
						'Hubo un error en el stream de createWork$: ',
						error
					);
					this.handleHttpResponseMessage();

					return EMPTY;
				}),
				finalize(() => {
					this.createDialogRef.close();
					this.createWork.next({ name: '' });
				})
			);
		}),
		tap(createdWork => {
			if (!createdWork.name) return;

			this.resetWorks();
			this.handleHttpResponseMessage('La creación fue exitosa.');
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
		this.resetDataSignals();
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
	}

	public setFilters(changes: FormFilters) {
		this.filtersChanges.next(changes);
	}

	private filterData({ student, task, exam }: FormFilters) {
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

	public create(
		payload: CreatePayload,
		dialogRef: MatDialogRef<CreateDialogComponent>
	) {
		this.createDialogRef = dialogRef;
		this.createWork.next(payload);
	}

	public update(
		payload: UpdatePayload,
		dialogRef: MatDialogRef<
			InfoDialogComponent | MultipleMarkingSetterComponent
		>,
		resetView = false
	) {
		this.refreshView.set(resetView);
		this.updateDialogRef = dialogRef;
		this.updateWork.next(payload);
	}

	public delete(
		workId: number,
		dialogRef: MatDialogRef<DeleteDialogComponent>
	) {
		this.deleteDialogRef = dialogRef;
		this.deleteWork.next(workId);
	}

	private resetWorks() {
		const queryParam = { courseId: this.selectedCourseId() };

		this.getTasksExamsAndStudents(queryParam, queryParam);
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
		const nameAndLastName = option.option.value;
		const students = this.students();
		const studentSelected = students.find(
			student => `${student.name} ${student.lastname}` === nameAndLastName
		);

		this.cleanShow(this.students as WritableSignal<Student[]>);

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

	public showSelectedTaskOrExam(option: MatAutocompleteSelectedEvent) {
		const selectedValue = option.option.value;
		const workSignal: WritableSignal<Task[]> | WritableSignal<Exam[]> =
			this.selectedWorkType() === Work.TASK ? this.tasks : this.exams;
		const matchedWork = (workSignal() as WorkBase[]).find(
			element => element.name === selectedValue
		);

		this.cleanShow(workSignal);

		workSignal.mutate(elements => {
			elements.forEach(element => {
				if (element.id !== matchedWork?.id) element.show = false;
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

	public resetDataSignals() {
		this.students.set([]);
		this.tasks.set([]);
		this.exams.set([]);
	}

	public handleHttpResponseMessage(
		responseMessage = 'Ocurrió un error con su pedido.'
	) {
		this._snackBar.open(responseMessage, '', { duration: 4000 });
	}

	public updateWorkCardInfo(
		workId: number,
		updatedWork: UpdateTask | UpdateExam
	) {
		this.selectedWorkType() === Work.TASK
			? this.tasks.mutate(tasks =>
					this.filterAndUpdateSelectedWork(workId, updatedWork, tasks)
			  )
			: this.exams.mutate(exams =>
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

	public trackItems(index: number, item: Student | Task | Exam): number {
		return item.id;
	}
}
