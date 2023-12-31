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
import { QUARTERS } from '../../constants/quarters.constant';
import { UNDELIVERED_TASKS_MARKINGS } from '../../constants/undelivered-tasks-markings.constant';
import { ResetFiltersType } from '../../interfaces/reset-filters.type';
import { Quarter } from '../../interfaces/quarter.interface';
import { WorkUnion } from '../../interfaces/work-union.interface';
import { StudentToTask } from '../../interfaces/student-to-task.interface';

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
	public tasks: WritableSignal<WorkUnion[]> = signal([]);
	public exams: WritableSignal<WorkUnion[]> = signal([]);
	public students: WritableSignal<Student[]> = signal([]);
	public quarters = signal(QUARTERS);
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
	public selectedSubjectId = signal(0);
	public selectedQuarterId = signal(0);
	public selectedWorkType: WritableSignal<Work> = signal(Work.TASK);
	public resetFilters = new BehaviorSubject<ResetFiltersType>('');
	public resetFilters$ = this.resetFilters.asObservable();
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
			tap(([tasks, exams, students]) => {
				this.setSignalsValues(
					tasks as WorkUnion[],
					exams as WorkUnion[],
					students as Student[]
				);
				this.cleanAllShow();
			}),
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
		quarter: 0,
	} as FormFilters);
	private filtersChanges$ = this.filtersChanges.asObservable();
	public filteredData$ = combineLatest([
		this.tasksExamsAndStudents$,
		this.filtersChanges$,
	]).pipe(
		tap(([[tasks, exams, students], filtersChanges]: any) => {
			const thereIsDataAvailable = Boolean(
				tasks?.length || exams?.length || (students as Student[]).length
			);

			this.applyChanges(filtersChanges, thereIsDataAvailable);
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
					this.deleteDialogRef.close(true);
					this.deleteWork.next(0);
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
					this.updateDialogRef.close(this.refreshView());
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
					this.createDialogRef.close(true);
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
		this.resetSignalsData();
		this.tasksExamsAndStudentsSubject.next([
			tasksAndExamsQueryParams,
			studentsQueryParams,
		]);
	}

	private setSignalsValues(
		tasks: WorkUnion[],
		exams: WorkUnion[],
		students: Student[]
	) {
		this.tasks.set(tasks);
		this.exams.set(exams);
		this.students.set(students);
	}

	private applyChanges(
		filtersChanges: FormFilters,
		thereIsDataAvailable: boolean
	) {
		const {
			course: courseId,
			subject,
			quarter: quarterId,
		} = filtersChanges;
		const { courseParam, queryParamsWithQuarter } = this.setQueryParams(
			courseId,
			quarterId
		);

		if (
			courseId !== this.selectedCourseId() ||
			(quarterId && quarterId !== this.selectedQuarterId())
		) {
			this.selectedCourseId.set(courseId);
			this.selectedQuarterId.set(quarterId);
			this.letterSelected.set(null);

			return this.getTasksExamsAndStudents(
				queryParamsWithQuarter,
				courseParam
			);
		}

		if (thereIsDataAvailable) {
			this.selectedSubjectId.set(subject ?? 0);
			!this.letterSelected() ? this.filterSignals(filtersChanges) : null;
		}
	}

	public setFilters(changes: FormFilters) {
		this.filtersChanges.next(changes);
	}

	private filterSignals({ student, task, exam }: FormFilters) {
		this.filterValues(student);
		this.filterValues(task, 'Tasks');
		this.filterValues(exam, 'Exams');
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
		const { courseParam, queryParamsWithQuarter } = this.setQueryParams(
			this.selectedCourseId(),
			this.selectedQuarterId()
		);

		this.getTasksExamsAndStudents(queryParamsWithQuarter, courseParam);
	}

	public filterValues(
		value: string | null,
		controlType: ControlType = 'Students'
	): void {
		const valueToFilter = value?.toLowerCase();
		let signalToFilter: WritableSignal<Student[] | WorkUnion[]> = this
			.students as WritableSignal<Student[]>;

		if (controlType === 'Tasks') signalToFilter = this.tasks;

		if (controlType === 'Exams') signalToFilter = this.exams;

		if (!value) return this.cleanShow(signalToFilter);

		this.processAutocompleteOutput(valueToFilter as string, signalToFilter);
	}

	private processAutocompleteOutput(
		valueToFilter: string,
		signalToFilter: WritableSignal<Student[] | WorkUnion[]>
	) {
		signalToFilter.update((elements: WorkUnion[] | Student[]) => {
			elements.forEach((element: WorkUnion | Student) => {
				if (this.isStudentElement(element as WorkUnion | Student)) {
					`${(element as Student).name} ${
						(element as Student).lastname
					}`
						.toLowerCase()
						.includes(valueToFilter)
						? (element.show = true)
						: (element.show = false);
				} else {
					(element as WorkUnion).name
						.toLowerCase()
						.includes(valueToFilter)
						? (element.show = true)
						: (element.show = false);
				}
			});

			return elements;
		});
	}

	//es una función Type Guard de Tyepscript
	private isStudentElement(element: Student | WorkUnion): element is Student {
		return 'lastname' in element;
	}

	public showSelectedStudent(option: MatAutocompleteSelectedEvent) {
		const nameAndLastName = option.option.value;
		const students = this.students();
		const studentSelected = students.find(
			(student: Student) =>
				`${student.name} ${student.lastname}` === nameAndLastName
		);

		this.cleanShow(this.students as WritableSignal<Student[]>);

		this.students.update((students: Student[]) => {
			students
				? students.forEach((student: Student) => {
						if (student.id !== studentSelected?.id)
							student.show = false;

						if (student.id === studentSelected?.id)
							student.showForMobile = true;
				  })
				: null;

			return JSON.parse(JSON.stringify(students));
		});
	}

	public showSelectedTaskOrExam(option: MatAutocompleteSelectedEvent) {
		const selectedValue = option.option.value;
		const workSignal: WritableSignal<WorkUnion[]> =
			this.selectedWorkType() === Work.TASK ? this.tasks : this.exams;
		const matchedWork = (workSignal() as WorkBase[]).find(
			element => element.name === selectedValue
		);

		this.cleanShow(workSignal);

		workSignal.update((elements: WorkUnion[]) => {
			elements.forEach((element: WorkUnion) => {
				if (element.id !== matchedWork?.id) element.show = false;
			});

			return elements;
		});
	}

	public cleanShow(signal: WritableSignal<WorkUnion[] | Student[]>) {
		signal.update((elements: WorkUnion[] | Student[]) => {
			elements.forEach((element: WorkUnion | Student) => {
				element.show = true;

				if ('showForMobile' in element) element.showForMobile = false;
			});

			return JSON.parse(JSON.stringify(elements));
		});
	}

	private cleanAllShow() {
		this.cleanShow(this.tasks);
		this.cleanShow(this.exams);
		this.cleanShow(this.students);
	}

	public resetSignalsData() {
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
			? this.tasks.update((tasks: WorkUnion[]) => {
					this.filterAndUpdateSelectedWork(
						workId,
						updatedWork,
						tasks
					);

					return tasks;
			  })
			: this.exams.update((exams: WorkUnion[]) => {
					this.filterAndUpdateSelectedWork(
						workId,
						updatedWork,
						exams
					);

					return exams;
			  });
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
		this.students.update((students: Student[]) => {
			students
				? students.forEach((student: Student) => {
						if (
							this.removeAccent(
								student?.lastname?.charAt(0)
							).toUpperCase() === letter.toUpperCase()
						) {
							student.showForMobile = true;
						}
				  })
				: null;

			return students;
		});
	}

	private removeAccent(letter: string) {
		return letter.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	}

	private setQueryParams(courseId: number, quarterId: number) {
		const courseParam = { courseId };
		const selectedQuarter = this.quarters().find(
			(quarter: Quarter) => quarter.id === quarterId
		);
		const queryParamsWithQuarter = {
			...courseParam,
			startDate: selectedQuarter?.start.getTime(),
			endDate: selectedQuarter?.end.getTime(),
		};

		return { courseParam, queryParamsWithQuarter };
	}

	public updateDeliveredValue(
		updatedTaskId: number,
		studentId: number,
		markingIdFormValue: number
	) {
		this.tasks.update((tasks: WorkUnion[]) => {
			const taskToUpdate = tasks.find(
				(task: Task) => task.id === updatedTaskId
			);
			const studentTask = taskToUpdate?.studentToTask?.find(
				(studentToTask: StudentToTask) =>
					studentToTask.studentId === studentId
			);
			const changeDeliveredValue =
				(!UNDELIVERED_TASKS_MARKINGS.includes(
					studentTask?.markingId ?? -1
				) &&
					UNDELIVERED_TASKS_MARKINGS.includes(markingIdFormValue)) ||
				(UNDELIVERED_TASKS_MARKINGS.includes(
					studentTask?.markingId ?? -1
				) &&
					!UNDELIVERED_TASKS_MARKINGS.includes(markingIdFormValue));

			if (changeDeliveredValue && taskToUpdate && studentTask) {
				UNDELIVERED_TASKS_MARKINGS.includes(markingIdFormValue)
					? taskToUpdate.totalDelivered--
					: taskToUpdate.totalDelivered++;

				studentTask.markingId = markingIdFormValue;
			}

			return JSON.parse(JSON.stringify(tasks));
		});
	}

	public restartQualificationsService() {
		this.getTasksExamsAndStudents(null, null);
		this.resetFilters.next('All');
		this.setFilters({
			course: 0,
			quarter: 0,
			subject: 0,
			student: '',
			task: '',
			exam: '',
		});
		this.selectedCourseId.set(0);
		this.selectedQuarterId.set(0);
		this.letterSelected.set(null);
	}
}
