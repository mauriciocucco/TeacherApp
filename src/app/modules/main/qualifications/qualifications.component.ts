import {
	Component,
	OnDestroy,
	OnInit,
	QueryList,
	Renderer2,
	Signal,
	ViewChild,
	ViewChildren,
	WritableSignal,
	computed,
	effect,
	inject,
	signal,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Observable, Subject, filter, of, takeUntil } from 'rxjs';
import { Task } from '../../../core/interfaces/task.interface';
import { Marking } from '../../../core/interfaces/marking.interface';
import { Exam } from '../../../core/interfaces/exam.interface';
import { Student } from '../../../core/interfaces/student.interface';
import { MatTabGroup } from '@angular/material/tabs';
import { Course } from '../../../core/interfaces/course.interface';
import { TasksAndExamsQueryParams } from './interfaces/tasks-and-exams-query-params.interface';
import { StudentsParams } from './interfaces/students-params.interface';
import { Work } from '../../../core/enums/work.enum';
import { MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { AllWord } from '../../../core/enums/all-word.enum';
import { QualificationsService } from '../../../core/services/qualifications/qualifications.service';
import { Subject as SchoolSubject } from '../../../core/interfaces/subject.interface';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { CreateDialogComponent } from './create-dialog/create-dialog.component';
import { MatSelect } from '@angular/material/select';
import { TasksService } from 'src/app/core/services/tasks/tasks.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { InfoDialogComponent } from './info-dialog/info-dialog.component';
import { UpdateTask } from '../../../core/interfaces/update-task.interface';
import { UpdateExam } from '../../../core/interfaces/update-exam.interface';
import { ExamsService } from '../../../core/services/exams/exams.service';

@Component({
	selector: 'app-qualifications',
	templateUrl: './qualifications.component.html',
	styleUrls: ['./qualifications.component.scss'],
})
export class QualificationsComponent implements OnInit, OnDestroy {
	public tasks: Signal<Task[]> = this.qs.tasks;
	public exams: Signal<Exam[]> = this.qs.exams;
	public students: Signal<Student[]> = this.qs.students;
	public subjects: Signal<SchoolSubject[]> = this.qs.subjects;
	public courses: Signal<Course[]> = this.qs.courses;
	public markings: Signal<Marking[]> = this.qs.markings;
	public filteredTasksForAutocomplete: WritableSignal<Task[]> =
		this.qs.filteredTasksForAutocomplete;
	public filteredExamsForAutocomplete: WritableSignal<Exam[]> =
		this.qs.filteredExamsForAutocomplete;
	public filteredStudentsForAutocomplete: WritableSignal<Student[]> =
		this.qs.filteredStudentsForAutocomplete;
	public tasksExamsAndStudents$ = this.qs.tasksExamsAndStudents$;
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
	public allWordEnum = AllWord;
	public WorkEnum = Work;
	public spinnerProgressOn = this.qs.spinnerProgressOn;
	public taskMatchSomeFilter = computed(() =>
		this.tasks().some(task => task.show)
	);
	public examMatchSomeFilter = computed(() =>
		this.exams().some(exam => exam.show)
	);
	public editMode = signal(false);
	private taskAndExamsQueryParams: TasksAndExamsQueryParams | null = null;
	private studentsQueryParams: StudentsParams | null = null;
	private ts = inject(TasksService);
	private es = inject(ExamsService);
	private destroy: Subject<boolean> = new Subject<boolean>();
	@ViewChildren('tabChildren') tabChildren!: QueryList<MatTabGroup>;
	@ViewChild('clearRangeButton', { static: false })
	clearDateRangeButton!: MatMiniFabButton;

	constructor(
		private qs: QualificationsService,
		private fb: FormBuilder,
		public dialog: MatDialog,
		private renderer: Renderer2,
		private _snackBar: MatSnackBar
	) {
		//  effect() can only be used within an injection context such as a constructor, a factory function, a field initializer, or a function used with `runInInjectionContext`. Find more at https://angular.io/errors/NG0203
		this.scrollToLatestTaskOrExam();
		this.enableFormWhenCourseIsSelected();
	}

	ngOnInit() {
		this.listenCourseFilterChanges();
	}

	ngOnDestroy(): void {
		this.destroy.next(true);
		this.destroy.unsubscribe();
	}

	private startToListenFiltersChanges() {
		this.listenSubjectFilterChanges();
		this.listenDatesRange();
		this.listenTasksFilterChanges();
		this.listenExamsFilterChanges();
		this.listenStudentsFilterChanges();
	}

	private listenSubjectFilterChanges() {
		this.filtersForm
			.get('subject')
			?.valueChanges.pipe(takeUntil(this.destroy))
			.subscribe(subjectId => {
				this.qs.filterTasksAndExamsBySubject(subjectId);
			});
	}

	private listenCourseFilterChanges() {
		this.filtersForm
			.get('course')
			?.valueChanges.pipe(takeUntil(this.destroy))
			.subscribe(courseId => {
				const queryParam = { courseId };

				this.studentsQueryParams = queryParam;
				this.taskAndExamsQueryParams = queryParam;

				this.resetForm();
				this.qs.getTasksExamsAndStudents(
					this.taskAndExamsQueryParams,
					this.studentsQueryParams
				);
			});
	}

	private listenDatesRange() {
		this.filtersForm
			.get('dateRange')
			?.valueChanges.pipe(
				filter((value: any) => value.start && value.end),
				takeUntil(this.destroy)
			)
			.subscribe((value: { start: Date; end: Date }) => {
				this.taskAndExamsQueryParams = {
					...this.taskAndExamsQueryParams,
					startDate: value.start.getTime(),
					endDate: value.end.getTime(),
				};

				this.disableRangeClearButton(false);
				this.qs.getTasksExamsAndStudents(
					this.taskAndExamsQueryParams,
					null
				);
			});
	}

	private listenTasksFilterChanges() {
		this.qs
			.processValueChanges(this.filtersForm.get('student')?.valueChanges)
			?.pipe(takeUntil(this.destroy))
			.subscribe(studentSelected =>
				this.filteredStudentsForAutocomplete.set(
					studentSelected as Student[]
				)
			);
	}

	private listenExamsFilterChanges() {
		this.qs
			.processValueChanges(
				this.filtersForm.get('task')?.valueChanges,
				'Tasks'
			)
			?.pipe(takeUntil(this.destroy))
			.subscribe(taskSelected =>
				this.filteredTasksForAutocomplete.set(taskSelected as Task[])
			);
	}

	private listenStudentsFilterChanges() {
		this.qs
			.processValueChanges(
				this.filtersForm.get('exam')?.valueChanges,
				'Exams'
			)
			?.pipe(takeUntil(this.destroy))
			.subscribe(examSelected =>
				this.filteredExamsForAutocomplete.set(examSelected as Exam[])
			);
	}

	private enableControls() {
		this.filtersForm.enable({ emitEvent: false });
	}

	private disableRangeClearButton(disable = true) {
		this.clearDateRangeButton.disabled = disable;
	}

	public resetDateRange() {
		this.filtersForm.get('dateRange')?.reset();
		this.cleanDateQueryParams();
		this.qs.getTasksExamsAndStudents(this.taskAndExamsQueryParams, null);
		this.disableRangeClearButton();
	}

	private cleanDateQueryParams() {
		delete this.taskAndExamsQueryParams?.startDate;
		delete this.taskAndExamsQueryParams?.endDate;
	}

	private scrollToLatestTaskOrExam() {
		effect(() => {
			// cuando emita cualquiera de los siguientes signals se va a disparar
			this.tasks(); //puede ser students, exams o tasks ya que se setean al mismo tiempo
			this.filteredExamsForAutocomplete();
			this.filteredTasksForAutocomplete();
			this.filteredStudentsForAutocomplete();

			setTimeout(() => {
				for (const tab of this.tabChildren) {
					const containerElement = tab._elementRef.nativeElement;
					const scrollOwnerElement: Element =
						containerElement.lastChild?.firstChild?.firstChild; //.mat-mdc-tab-body-content

					if (scrollOwnerElement)
						scrollOwnerElement.scrollTo({
							left: containerElement.scrollWidth + 1000000, // Establece la posición a la derecha (al final),
							behavior: 'smooth',
						});
				}
			}, 0);
		});
	}

	private enableFormWhenCourseIsSelected() {
		toObservable(this.students) //puede ser students, exams o tasks ya que se setean al mismo tiempo
			.pipe(
				filter(
					students =>
						students.length > 0 &&
						(this.filtersForm.get('subject')?.disabled as boolean) //puede ser cualquier control de un filtro que esté disabled
				),
				takeUntil(this.destroy)
			)
			.subscribe(() => {
				this.enableControls();
				this.startToListenFiltersChanges();
			});
	}

	private resetForm() {
		this.filtersForm.get('subject')?.patchValue(0);
		this.filtersForm.get('student')?.reset();
		this.filtersForm.get('task')?.reset();
		this.filtersForm.get('exam')?.reset();
		this.filtersForm.get('dateRange')?.reset();
	}

	public studentSelected(option: MatAutocompleteSelectedEvent) {
		this.qs.showSelectedStudent(option);
	}

	public taskOrExamSelected(
		option: MatAutocompleteSelectedEvent,
		type = Work.TASK
	) {
		this.qs.showSelectedTaskOrExam(option, type);
	}

	public openCreateDialog(): void {
		const dialogRef = this.dialog.open(CreateDialogComponent, {
			data: { courseId: this.filtersForm.get('course')?.value },
		});

		dialogRef
			.afterClosed()
			.pipe(takeUntil(this.destroy))
			.subscribe(() => {
				this.resetForm();
			});
	}

	public openInfoDialog(work: Task | Exam, workType = this.WorkEnum.TASK) {
		const dialogRef = this.dialog.open(InfoDialogComponent, {
			data: {
				name: work.name,
				date: work.date,
				description: work.description,
				workId: work.id,
				workType,
			},
		});

		dialogRef.afterClosed().pipe(takeUntil(this.destroy)).subscribe();
	}

	public allowEditOnSelectedItem(
		controlElement: MatSelect | HTMLInputElement,
		textarea: HTMLTextAreaElement,
		editButton: MatIconButton,
		confirmDiv: HTMLDivElement,
		deleteButton: MatIconButton
	) {
		controlElement instanceof MatSelect
			? controlElement.setDisabledState(false)
			: (controlElement.disabled = false);
		textarea.readOnly = false;
		this.toggleDisappearClass(
			confirmDiv,
			editButton._elementRef.nativeElement
		);
		deleteButton.disabled = true;
	}

	public cancelEditOnSelectedItem(
		controlElement: MatSelect | HTMLInputElement,
		textarea: HTMLTextAreaElement,
		editButton: MatIconButton,
		confirmDiv: HTMLDivElement,
		deleteButton: MatIconButton
	) {
		controlElement instanceof MatSelect
			? controlElement.setDisabledState(true)
			: (controlElement.disabled = true);
		textarea.readOnly = true;
		this.toggleDisappearClass(
			editButton._elementRef.nativeElement,
			confirmDiv
		);
		deleteButton.disabled = false;
	}

	public updateWork(
		controlElement: MatSelect | HTMLInputElement,
		textarea: HTMLTextAreaElement,
		studentId: number,
		workId: number,
		cardContent: HTMLElement,
		cardLoading: HTMLDivElement,
		cancelEditButton: MatIconButton,
		workType = this.WorkEnum.TASK
	) {
		const toTaskValues = {
			studentId,
			observation: textarea.value,
		};
		const updatedWork = this.setUpdatedWork(
			workType,
			toTaskValues,
			controlElement.value
		);
		let update$: Observable<UpdateTask | UpdateExam | undefined> =
			of(undefined);

		this.toggleDisappearClass(cardLoading, cardContent);

		workType === this.WorkEnum.TASK
			? (update$ = this.ts.updateTask(updatedWork as UpdateTask, workId))
			: (update$ = this.es.updateExam(updatedWork as UpdateExam, workId));

		update$.pipe(takeUntil(this.destroy)).subscribe(result => {
			if (result instanceof HttpErrorResponse) {
				this.returnToPreviousState(
					controlElement,
					textarea,
					workId,
					studentId
				);
				this.qs.handleHttpResponseMessage(result.error?.message);
			}

			this.toggleDisappearClass(cardContent, cardLoading);
			cancelEditButton._elementRef.nativeElement.click();
		});
	}

	private setUpdatedWork(
		workType: string,
		toTaskValues: { studentId: number; observation: string },
		marking: number | string
	) {
		return workType === this.WorkEnum.TASK
			? {
					studentToTask: {
						...toTaskValues,
						markingId: marking,
					},
			  }
			: {
					studentToExam: {
						...toTaskValues,
						marking,
					},
			  };
	}

	private toggleDisappearClass(removeFrom: HTMLElement, addTo: HTMLElement) {
		this.renderer.removeClass(removeFrom, 'disappear');
		this.renderer.addClass(addTo, 'disappear');
	}

	private returnToPreviousState(
		controlElement: MatSelect | HTMLInputElement,
		textarea: HTMLTextAreaElement,
		taskId: number,
		studentId: number
	) {
		const task = this.tasks().find(task => task.id === taskId);
		const previousState = task?.studentToTask?.find(
			relation => (relation.studentId = studentId)
		);

		controlElement.value = previousState?.markingId;
		textarea.value = previousState?.observation ?? '';
	}
}
