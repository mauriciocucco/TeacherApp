import { Injectable, WritableSignal, computed, signal } from '@angular/core';
import { ApiService } from '../api/api.service';
import {
	BehaviorSubject,
	EMPTY,
	catchError,
	combineLatest,
	finalize,
	of,
	switchMap,
	tap,
} from 'rxjs';
import { Endpoints } from '../../enums/endpoints.enum';
import { Subject as SchoolSubject } from '../../../core/interfaces/subject.interface';
import { toSignal } from '@angular/core/rxjs-interop';
import { Course } from '../../interfaces/course.interface';
import { Marking } from '../../interfaces/marking.interface';
import { Student } from '../../interfaces/student.interface';
import { StudentsService } from '../students/students.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormFilters } from '../../../modules/main/qualifications/interfaces/form-filters.interface';
import { MatDialogRef } from '@angular/material/dialog';
import { DeleteDialogComponent } from '../../../modules/main/qualifications/components/delete-dialog/delete-dialog.component';
import { InfoDialogComponent } from '../../../modules/main/qualifications/components/info-dialog/info-dialog.component';
import { CreateDialogComponent } from '../../../modules/main/qualifications/components/create-dialog/create-dialog.component';
import { MultipleMarkingSetterComponent } from '../../../modules/main/qualifications/components/multiple-marking-setter/multiple-marking-setter.component';
import { QUARTERS } from '../../constants/quarters.constant';
import { ResetFiltersType } from '../../interfaces/reset-filters.type';
import { Quarter } from '../../interfaces/quarter.interface';
import { WorksQueryParams } from '../../../modules/main/qualifications/interfaces/works-query-params.interface';
import { WorksService } from '../works/works.service';
import { CreateWork } from '../../interfaces/create-work.interface';
import { UpdateWork } from '../../interfaces/update-work.interface';
import { WorkI } from '../../interfaces/work.interface';
import { WorkTypeId } from '../../enums/work-type-id.enum';
import { UNDELIVERED_TASKS_MARKINGS } from '../../constants/undelivered-tasks-markings.constant';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

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
	public quarters = signal(QUARTERS);
	public works: WritableSignal<Partial<WorkI>[]> = signal([]);
	public tasks = computed(() =>
		this.works()?.filter(work => work.workTypeId === WorkTypeId.TASK)
	);
	public exams = computed(() =>
		this.works()?.filter(work => work.workTypeId === WorkTypeId.EXAM)
	);
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
	public selectedCourseId = signal(0);
	public selectedSubjectId = signal(0);
	public selectedQuarterId = signal(0);
	public selectedWorkType: WritableSignal<WorkTypeId> = signal(
		WorkTypeId.TASK
	);
	public resetFilters = new BehaviorSubject<ResetFiltersType>('');
	public resetFilters$ = this.resetFilters.asObservable();
	public worksSubject = new BehaviorSubject<WorksQueryParams | null>(null);
	public works$ = this.worksSubject.asObservable().pipe(
		switchMap(worksQueryParams =>
			worksQueryParams ? this.ws.getWorks(worksQueryParams) : of(false)
		),
		tap(works => {
			if (works) {
				this.setWorksSignal(works);
				!works.length
					? this.getStudents({
							courseId: this.worksQueryParams()?.courseId,
					  })
					: this.getStudents(this.worksQueryParams());
			}
		}),
		catchError(error => {
			console.error('Hubo un error en el stream de works$: ', error);

			return EMPTY;
		})
	);
	public studentsSubject = new BehaviorSubject<WorksQueryParams | null>(null);
	public students$ = this.studentsSubject.asObservable().pipe(
		switchMap(worksQueryParams => this.ss.getStudents(worksQueryParams)),
		tap(students => this.setStudentsSignal(students)),
		catchError(error => {
			console.error('Hubo un error en el stream de students$: ', error);

			return EMPTY;
		})
	);
	private defaultFormFilters: FormFilters = {
		courseId: 0,
		quarterId: 0,
		subjectId: 0,
		studentName: '',
		taskName: '',
		examName: '',
	};
	private defaultCreateWork: CreateWork = {
		name: '',
		description: '',
		date: '',
		workTypeId: 0,
		subjectId: 0,
		courseId: 0,
		studentToWork: [],
	};
	private worksQueryParams = signal<WorksQueryParams | null>(null);
	private filtersChanges: BehaviorSubject<Partial<FormFilters>> =
		new BehaviorSubject<Partial<FormFilters>>(this.defaultFormFilters);
	private filtersChanges$ = this.filtersChanges.asObservable();
	public filteredData$ = combineLatest([
		this.students$,
		this.works$,
		this.filtersChanges$,
	]).pipe(
		tap(([students, works, filtersChanges]) =>
			this.applyChanges(filtersChanges)
		)
	);
	private deleteDialogRef!: MatDialogRef<DeleteDialogComponent>;
	private deleteWork = new BehaviorSubject(0);
	public deleteWork$ = this.deleteWork.asObservable().pipe(
		switchMap(workId => {
			if (!workId) return of(true);

			return this.ws.deleteWork(workId).pipe(
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

			this.updateWorks();
			this.handleHttpResponseMessage(`Se eliminó "${deletedWork.name}".`);
		})
	);
	private updateDialogRef!: MatDialogRef<
		InfoDialogComponent | MultipleMarkingSetterComponent
	>;
	private updateWork = new BehaviorSubject<[workId: number, UpdateWork]>([
		0,
		{},
	]);
	public updateWork$ = this.updateWork.asObservable().pipe(
		switchMap(([workId, payload]) => {
			if (!workId) return of(true);

			return this.ws.updateWork(payload, workId).pipe(
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
					this.updateWork.next([0, {}]);
				})
			);
		}),
		tap(updatedWork => {
			if (!updatedWork.name) return;

			this.updateWorks(updatedWork);
			this.handleHttpResponseMessage('La edición fue exitosa.');
		})
	);
	private createDialogRef!: MatDialogRef<CreateDialogComponent>;
	private createWork = new BehaviorSubject<CreateWork>(
		this.defaultCreateWork
	);
	public createWork$ = this.createWork.asObservable().pipe(
		switchMap(payload => {
			if (!payload.name) return of(true);

			return this.ws.createWork(payload).pipe(
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
					this.createWork.next(this.defaultCreateWork);
				})
			);
		}),
		tap(createdWork => {
			if (!createdWork.name) return;

			this.updateWorks();
			this.handleHttpResponseMessage('La creación fue exitosa.');
		})
	);

	constructor(
		private apiService: ApiService,
		private ws: WorksService,
		private ss: StudentsService,
		private _snackBar: MatSnackBar
	) {}

	public getWorks(worksQueryParams: WorksQueryParams | null) {
		this.resetWorksSignal();
		this.worksSubject.next(worksQueryParams);
	}

	public getStudents(worksQueryParams: WorksQueryParams | null) {
		this.resetStudentsSignal();
		this.studentsSubject.next(worksQueryParams);
	}

	private setWorksQueryParams(
		courseId: number | undefined,
		quarterId: number | undefined
	) {
		if (!courseId && !quarterId) return;

		const courseParam = { courseId };
		const selectedQuarter = this.quarters().find(
			(quarter: Quarter) => quarter.id === quarterId
		);

		this.worksQueryParams.set({
			...courseParam,
			startDate: selectedQuarter?.start.getTime(),
			endDate: selectedQuarter?.end.getTime(),
		});
	}

	private applyChanges(filtersChanges: Partial<FormFilters>) {
		const { courseId, subjectId, quarterId } = filtersChanges;
		const thereIsDataAvailable = this.works().length;

		this.setWorksQueryParams(courseId, quarterId);

		if (
			courseId &&
			quarterId &&
			(courseId !== this.selectedCourseId() ||
				(quarterId && quarterId !== this.selectedQuarterId()))
		) {
			this.getWorks(this.worksQueryParams());
			this.selectedCourseId.set(courseId);
			this.selectedQuarterId.set(quarterId);
			return this.letterSelected.set(null);
		}

		if (thereIsDataAvailable) {
			this.selectedSubjectId.set(subjectId ?? 0);
			// !this.letterSelected() ? this.filterValues(filtersChanges) : null;
		}
	}

	public setFilters(changes: Partial<FormFilters>) {
		this.filtersChanges.next(changes);
	}

	public create(
		payload: CreateWork,
		dialogRef: MatDialogRef<CreateDialogComponent>
	) {
		this.createDialogRef = dialogRef;
		this.createWork.next(payload);
	}

	public update(
		payload: [workId: number, UpdateWork],
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

	private setWorksSignal(works: WorkI[]) {
		this.works.set(
			works.map(({ id, name, date, workTypeId }) => ({
				id,
				name,
				date,
				workTypeId,
				show: true,
			}))
		);
	}

	private setStudentsSignal(students: Student[]) {
		this.students.set(
			students.map(student => {
				student.show = true;
				student.studentToWork.forEach(stw => (stw.show = true));

				return student;
			})
		);
	}

	private updateWorksSignal({ id, name, date, workTypeId }: WorkI) {
		this.works.update((works: Partial<WorkI>[]) => {
			return works.map(work => {
				if (work.id === id) {
					return { id, name, date, workTypeId, show: true };
				}
				return work;
			});
		});
	}

	private updateStudentsSignal({
		id,
		name,
		date,
		description,
		workTypeId,
		studentToWork: updatedStudentToWork,
	}: WorkI) {
		this.students.update((students: Student[]) => {
			return students.map((student: Student) => {
				const studentToWork = student.studentToWork.find(
					stw => stw.workId === id
				);

				if (studentToWork) {
					const matchedStudentToWork = updatedStudentToWork.find(
						updatedStw =>
							updatedStw.studentId === studentToWork.studentId
					);

					studentToWork.work.name = name;
					studentToWork.work.date = date;
					studentToWork.work.description = description;
					studentToWork.work.workTypeId = workTypeId;

					if (matchedStudentToWork) {
						studentToWork.observation =
							matchedStudentToWork.observation ?? '';
						studentToWork.score =
							matchedStudentToWork.score ?? null;
					}
				}

				return student;
			});
		});
	}

	private updateWorks(updatedWork?: WorkI) {
		if (!updatedWork) {
			return this.getWorks(this.worksQueryParams());
		}

		this.updateWorksSignal(updatedWork);
		this.updateStudentsSignal(updatedWork);
	}

	// public filterValues(
	// 	value: string | null,
	// 	controlType: ControlType = 'Students'
	// ): void {
	// 	const valueToFilter = value?.toLowerCase();
	// 	let signalToFilter: WritableSignal<Student[] | WorkUnion[]> = this
	// 		.students as WritableSignal<Student[]>;

	// 	if (controlType === 'Tasks') signalToFilter = this.tasks;

	// 	if (controlType === 'Exams') signalToFilter = this.exams;

	// 	if (!value) return this.cleanShow(signalToFilter);

	// 	this.processAutocompleteOutput(valueToFilter as string, signalToFilter);
	// }

	// private processAutocompleteOutput(
	// 	valueToFilter: string,
	// 	signalToFilter: WritableSignal<Student[] | WorkUnion[]>
	// ) {
	// 	signalToFilter.update((elements: WorkUnion[] | Student[]) => {
	// 		elements.forEach((element: WorkUnion | Student) => {
	// 			if (this.isStudentElement(element as WorkUnion | Student)) {
	// 				`${(element as Student).name} ${
	// 					(element as Student).lastname
	// 				}`
	// 					.toLowerCase()
	// 					.includes(valueToFilter)
	// 					? (element.show = true)
	// 					: (element.show = false);
	// 			} else {
	// 				(element as WorkUnion).name
	// 					.toLowerCase()
	// 					.includes(valueToFilter)
	// 					? (element.show = true)
	// 					: (element.show = false);
	// 			}
	// 		});

	// 		return elements;
	// 	});
	// }

	//es una función Type Guard de Tyepscript
	private isStudentElement(element: Student | WorkI): element is Student {
		return 'lastname' in element;
	}

	public showSelectedStudent(option: MatAutocompleteSelectedEvent) {
		const nameAndLastName = option.option.value;
		const students = this.students();
		const studentSelected = students.find(
			(student: Student) =>
				`${student.name} ${student.lastname}` === nameAndLastName
		);

		this.cleanStudentsShowProp();

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

	public showSelectedWork(
		option: MatAutocompleteSelectedEvent,
		workTypeId: WorkTypeId
	) {
		const workName = option.option.value;
		const selectedWork = this.works().find(work => work.name === workName);

		this.cleanWorksShowProp(workTypeId);

		this.works.update(works => {
			return works.map(work => {
				if (
					work.id !== selectedWork?.id &&
					work.workTypeId === workTypeId
				) {
					return { ...work, show: false };
				}

				return work;
			});
		});

		this.students.update((students: Student[]) => {
			return students.map((student: Student) => {
				student.studentToWork = student.studentToWork.map(
					studentToWork => {
						if (
							studentToWork.workId !== selectedWork?.id &&
							studentToWork.work.workTypeId === workTypeId
						) {
							return { ...studentToWork, show: false };
						}

						return studentToWork;
					}
				);

				return student;
			});
		});
	}

	public cleanWorksShowProp(workTypeId: WorkTypeId) {
		this.works.update((works: Partial<WorkI>[]) => {
			return works.map(work => {
				if (work.workTypeId === workTypeId) work.show = true;

				return work;
			});
		});

		this.students.update((students: Student[]) => {
			return students.map((student: Student) => {
				student.studentToWork = student.studentToWork.map(stw => {
					if (stw.work.workTypeId === workTypeId) {
						return { ...stw, show: true };
					}
					return stw;
				});

				return student;
			});
		});
	}

	public cleanStudentsShowProp() {
		this.students.update((students: Student[]) => {
			return students.map(student => {
				return {
					...student,
					show: true,
					showForMobile:
						'showForMobile' in student
							? false
							: (student as Student).showForMobile,
				};
			});
		});
	}

	public resetWorksSignal() {
		this.works.set([]);
	}

	public resetStudentsSignal() {
		this.students.set([]);
	}

	public handleHttpResponseMessage(
		responseMessage = 'Ocurrió un error con su pedido.'
	) {
		this._snackBar.open(responseMessage, '', { duration: 4000 });
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

	public updateDeliveredValue(
		updatedWorkId: number,
		studentId: number,
		markingIdFormValue: number
	) {
		this.students.update((students: Student[]) => {
			return students.map((student: Student) => {
				const studentToWork = student.studentToWork.find(
					stw => stw.workId === updatedWorkId
				);

				if (studentToWork) {
					if (student.id === studentId)
						studentToWork.markingId = markingIdFormValue;

					UNDELIVERED_TASKS_MARKINGS.includes(markingIdFormValue)
						? studentToWork.work.totalDelivered--
						: studentToWork.work.totalDelivered++;
				}

				return student;
			});
		});
	}

	public restartQualificationsService() {
		this.getStudents(null);
		this.resetFilters.next('All');
		this.setFilters(this.defaultFormFilters);
		this.selectedCourseId.set(0);
		this.selectedQuarterId.set(0);
		this.letterSelected.set(null);
	}
}
