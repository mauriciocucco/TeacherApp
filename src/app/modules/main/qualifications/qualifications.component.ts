import {
	Component,
	DestroyRef,
	HostListener,
	OnInit,
	QueryList,
	Renderer2,
	Signal,
	ViewChild,
	ViewChildren,
	WritableSignal,
	computed,
	inject,
	signal,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
	Observable,
	debounceTime,
	distinctUntilChanged,
	filter,
	of,
	tap,
} from 'rxjs';
import { Task } from '../../../core/interfaces/task.interface';
import { Marking } from '../../../core/interfaces/marking.interface';
import { Exam } from '../../../core/interfaces/exam.interface';
import { Student } from '../../../core/interfaces/student.interface';
import { MatTabGroup } from '@angular/material/tabs';
import { Course } from '../../../core/interfaces/course.interface';
import { TasksAndExamsQueryParams } from './interfaces/tasks-and-exams-query-params.interface';
import { StudentsParams } from './interfaces/students-params.interface';
import { Work } from '../../../core/enums/work.enum';
import { MatMiniFabButton } from '@angular/material/button';
import { QualificationsService } from '../../../core/services/qualifications/qualifications.service';
import { Subject as SchoolSubject } from '../../../core/interfaces/subject.interface';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
	MatAutocomplete,
	MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { CreateDialogComponent } from './components/create-dialog/create-dialog.component';
import { MatSelect } from '@angular/material/select';
import { TasksService } from 'src/app/core/services/tasks/tasks.service';
import { InfoDialogComponent } from './components/info-dialog/info-dialog.component';
import { UpdateTask } from '../../../core/interfaces/update-task.interface';
import { UpdateExam } from '../../../core/interfaces/update-exam.interface';
import { ExamsService } from '../../../core/services/exams/exams.service';
import { ToggleEditElements } from './interfaces/toggle-edit.interface';
import { StudentToTask } from '../../../core/interfaces/student-to-task.interface';
import { StudentToExam } from '../../../core/interfaces/student-to-exam.interface';
import { DeleteDialogComponent } from './components/delete-dialog/delete-dialog.component';
import { UpdateWorkElements } from './interfaces/update-work.interface';
import { WorkInfo } from './interfaces/work-info.interface';
import { ViewService } from '../../../core/services/view/view.service';
import { DateRange } from './interfaces/range-date.interface';

@Component({
	selector: 'app-qualifications',
	templateUrl: './qualifications.component.html',
	styleUrls: ['./qualifications.component.scss'],
})
export class QualificationsComponent implements OnInit {
	public tasks: Signal<Task[]> = this.qs.tasks;
	public exams: Signal<Exam[]> = this.qs.exams;
	public students: Signal<Student[] | undefined> = this.qs.students;
	public subjects: Signal<SchoolSubject[]> = this.qs.subjects;
	public courses: Signal<Course[]> = this.qs.courses;
	public markings: Signal<Marking[]> = this.qs.markings;
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
	public WorkEnum = Work;
	public spinnerProgressOn = this.qs.spinnerProgressOn;
	public taskMatchSomeFilter = computed(() =>
		this.tasks().some(task => task.show)
	);
	public examMatchSomeFilter = computed(() =>
		this.exams().some(exam => exam.show)
	);
	public editMode = signal(false);
	public defaultRowsNumber = signal(5);
	public selectedTab = signal(0);
	public screenType = this.vs.screenType;
	public openFiltersMenu = signal(false);
	private selectedWorkType = this.qs.selectedWorkType;
	private taskAndExamsQueryParams: TasksAndExamsQueryParams | null = null;
	private studentsQueryParams: StudentsParams | null = null;
	private ts = inject(TasksService);
	private es = inject(ExamsService);
	private defaultWorkInfo = {
		workId: 0,
		studentId: 0,
		workType: Work.TASK,
	};
	private editHTMLElements: WritableSignal<
		ToggleEditElements | UpdateWorkElements | undefined
	> = signal(undefined);
	private selectedWorkInfo: WritableSignal<WorkInfo> = signal(
		this.defaultWorkInfo
	);
	private deselectedOption = '*';
	private destroyRef = inject(DestroyRef);
	@ViewChildren('tabChildren') tabChildren?: QueryList<MatTabGroup>;
	@ViewChild('clearRangeButton', { static: false })
	clearDateRangeButton?: MatMiniFabButton;
	@ViewChild('studentsAutocomplete', { static: false })
	studentsAutocomplete?: MatAutocomplete;
	@ViewChild('tasksAutocomplete', { static: false })
	tasksAutocomplete?: MatAutocomplete;
	@ViewChild('examsAutocomplete', { static: false })
	examsAutocomplete?: MatAutocomplete;
	@HostListener('window:resize', ['$event'])
	onResize(): void {
		this.vs.setScreenType();
	}

	constructor(
		private qs: QualificationsService,
		private fb: FormBuilder,
		public dialog: MatDialog,
		private renderer: Renderer2,
		private vs: ViewService
	) {
		this.enableFormWhenCourseIsSelected();
	}

	ngOnInit() {
		this.listenCourseFilterChanges();
		this.vs.setScreenType();
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
			?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(subject => {
				this.qs.filterTasksAndExamsBySubject(subject);
				if (this.screenType() === 'MOBILE')
					this.toggleFiltersMenu(false);
			});
	}

	private listenCourseFilterChanges() {
		this.filtersForm
			.get('course')
			?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(course => {
				const queryParam = { courseId: course };

				this.studentsQueryParams = queryParam;
				this.taskAndExamsQueryParams = queryParam;

				if (this.screenType() === 'MOBILE')
					this.toggleFiltersMenu(false);

				this.qs.getTasksExamsAndStudents(
					this.taskAndExamsQueryParams,
					this.studentsQueryParams
				);
				this.resetForm();
			});
	}

	private listenDatesRange() {
		this.filtersForm
			.get('dateRange')
			?.valueChanges.pipe(
				filter<DateRange>(({ start, end }) =>
					start && end ? true : false
				),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(({ start, end }) => {
				this.taskAndExamsQueryParams = {
					...this.taskAndExamsQueryParams,
					startDate: start?.getTime(),
					endDate: end?.getTime(),
				};
				if (this.screenType() === 'MOBILE')
					this.toggleFiltersMenu(false);
				this.disableRangeClearButton(false);
				this.qs.getTasksExamsAndStudents(
					this.taskAndExamsQueryParams,
					null
				);
			});
	}

	private listenStudentsFilterChanges() {
		this.qs
			.processValueChanges(
				this.filtersForm.get('student')?.valueChanges.pipe(
					debounceTime(500),
					distinctUntilChanged(),
					filter(() =>
						this.screenType() === 'MOBILE' ? false : true
					),
					filter(value => this.filterByDeselectedOption(value)),
					tap(value =>
						this.cleanSelectedAutocompleteOption(
							value,
							this.studentsAutocomplete,
							'student'
						)
					)
				)
			)
			?.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe();
	}

	private listenTasksFilterChanges() {
		this.qs
			.processValueChanges(
				this.filtersForm.get('task')?.valueChanges.pipe(
					debounceTime(500),
					distinctUntilChanged(),
					filter(() =>
						this.screenType() === 'MOBILE' ? false : true
					),
					filter(value => this.filterByDeselectedOption(value)),
					tap(value =>
						this.cleanSelectedAutocompleteOption(
							value,
							this.tasksAutocomplete,
							'task'
						)
					)
				),
				'Tasks'
			)
			?.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe();
	}

	private listenExamsFilterChanges() {
		this.qs
			.processValueChanges(
				this.filtersForm.get('exam')?.valueChanges.pipe(
					debounceTime(500),
					distinctUntilChanged(),
					filter(() =>
						this.screenType() === 'MOBILE' ? false : true
					),
					filter(value => this.filterByDeselectedOption(value)),
					tap(value =>
						this.cleanSelectedAutocompleteOption(
							value,
							this.examsAutocomplete,
							'exam'
						)
					)
				),
				'Exams'
			)
			?.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe();
	}

	private filterByDeselectedOption(value: string): boolean {
		if (this.deselectedOption === value) {
			this.deselectedOption = '*';
			return false;
		}

		return true;
	}

	private cleanSelectedAutocompleteOption(
		value: string,
		autocomplete: MatAutocomplete | undefined,
		controlName: string
	) {
		if (!value)
			autocomplete?.options.forEach(option => {
				if (option.selected) {
					this.deselectedOption = option.value;
					option.deselect();
					this.filtersForm.get(controlName)?.patchValue('', {
						emitEvent: false,
					});
				}
			});
	}

	private enableControls() {
		this.filtersForm.enable({ emitEvent: false });
	}

	private disableRangeClearButton(disable = true) {
		if (!this.clearDateRangeButton) return;

		this.clearDateRangeButton.disabled = disable;
	}

	public resetDateRange() {
		this.filtersForm.get('dateRange')?.reset();
		this.cleanDateQueryParams();
		this.qs.getTasksExamsAndStudents(this.taskAndExamsQueryParams, null);
		this.disableRangeClearButton();
		this.toggleFiltersMenu(false);
	}

	private cleanDateQueryParams() {
		delete this.taskAndExamsQueryParams?.startDate;
		delete this.taskAndExamsQueryParams?.endDate;
	}

	private enableFormWhenCourseIsSelected() {
		toObservable(this.students) //puede ser students, exams o tasks ya que se setean al mismo tiempo
			.pipe(
				filter(students =>
					students
						? students.length > 0 &&
						  (this.filtersForm.get('subject')?.disabled as boolean) //puede ser cualquier control de un filtro que esté disabled
						: false
				),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(() => {
				this.enableControls();
				this.startToListenFiltersChanges();
			});
	}

	private resetForm() {
		this.filtersForm.reset(
			{
				subject: 0,
				student: '',
				task: '',
				exam: '',
				course: this.filtersForm.get('course')?.value,
			},
			{ emitEvent: false }
		);
	}

	public studentSelected(option: MatAutocompleteSelectedEvent) {
		if (this.screenType() === 'MOBILE') this.toggleFiltersMenu(false);
		if (this.deselectedOption === option.option.value) return;

		this.qs.showSelectedStudent(option);
	}

	public taskOrExamSelected(
		option: MatAutocompleteSelectedEvent,
		type = Work.TASK
	) {
		if (this.screenType() === 'MOBILE') this.toggleFiltersMenu(false);
		if (this.deselectedOption === option.option.value) return;

		this.qs.showSelectedTaskOrExam(option, type);
	}

	public openCreateDialog(): void {
		const dialogRef = this.dialog.open(CreateDialogComponent, {
			data: { course: this.filtersForm.get('course')?.value },
		});

		dialogRef
			.afterClosed()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(queryParams => {
				if (queryParams?.courseId) {
					this.changeToCorrectTab();
					this.qs.getTasksExamsAndStudents(queryParams, null);
				}
			});
	}

	public openInfoDialog(work: Task | Exam, workType = Work.TASK) {
		this.selectedWorkType.set(workType);
		this.dialog.open(InfoDialogComponent, {
			data: {
				name: work.name,
				date: work.date,
				description: work.description,
				workId: work.id,
				workSubject: work.subject,
			},
		});
	}

	public openDeleteDialog(work: Task | Exam, workType = Work.TASK) {
		this.selectedWorkType.set(workType);
		this.dialog.open(DeleteDialogComponent, {
			data: {
				courseId: this.filtersForm.get('course')?.value,
				workId: work.id,
				workName: work.name,
			},
		});
	}

	private changeToCorrectTab() {
		if (this.selectedWorkType() === Work.TASK) this.selectedTab.set(0);
		if (this.selectedWorkType() === Work.EXAM) this.selectedTab.set(1);

		this.resetForm();
	}

	public toggleEditOnSelectedItem(
		toggleEditElements: ToggleEditElements,
		toggleEditInfo: WorkInfo = this.defaultWorkInfo,
		allowEdit = true
	) {
		this.setEditSignals(toggleEditElements, toggleEditInfo);
		this.changeEditUIStatus(allowEdit);

		if (!allowEdit) {
			this.returnToPreviousState();
		}
	}

	private changeEditUIStatus(allowEdit: boolean) {
		const {
			controlElement,
			textArea,
			confirmDiv,
			editButton,
			deleteButton,
		} = this.editHTMLElements() as ToggleEditElements;

		controlElement instanceof MatSelect
			? null
			: (controlElement.readOnly = !allowEdit);
		if (textArea) textArea.readOnly = !allowEdit;
		if (confirmDiv && editButton)
			this.toggleDisappearClass(
				allowEdit ? confirmDiv : editButton._elementRef.nativeElement,
				allowEdit ? editButton._elementRef.nativeElement : confirmDiv
			);
		if (deleteButton) deleteButton.disabled = allowEdit;
	}

	public updateWork(
		updateWorkElements: UpdateWorkElements,
		updateWorkInfo: WorkInfo
	) {
		this.setEditSignals(updateWorkElements, updateWorkInfo);

		const commonValues: { studentId: number; observation?: string } = {
			studentId: updateWorkInfo.studentId,
		};

		if (updateWorkElements.textArea)
			commonValues.observation =
				updateWorkElements.textArea.value.trimEnd();

		const updatedWork = this.setUpdatedWorkBody(commonValues);
		let update$: Observable<Task | Exam | undefined> = of(undefined);

		this.loadingCardContent();
		updateWorkInfo.workType === Work.TASK
			? (update$ = this.ts.updateTask(
					updatedWork as UpdateTask,
					updateWorkInfo.workId
			  ))
			: (update$ = this.es.updateExam(
					updatedWork as UpdateExam,
					updateWorkInfo.workId
			  ));

		update$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: () => {
				this.qs.updateWorkCardInfo(updateWorkInfo.workId, updatedWork);
				this.resetUI();
				this.qs.handleHttpResponseMessage('La edición fue exitosa.');
			},
			error: () => {
				this.returnToPreviousState();
				this.resetUI();
				this.qs.handleHttpResponseMessage();
			},
		});
	}

	private resetUI() {
		this.loadingCardContent(false);
		this.changeEditUIStatus(false);
	}

	private setEditSignals(
		workElements: ToggleEditElements | UpdateWorkElements,
		workInfo: WorkInfo
	) {
		this.selectedWorkType.set(workInfo.workType);
		this.editHTMLElements.set(workElements);
		this.selectedWorkInfo.set(workInfo);
	}

	private loadingCardContent(loading = true) {
		const { cardLoading, cardContent } =
			this.editHTMLElements() as UpdateWorkElements;

		loading
			? this.toggleDisappearClass(cardLoading, cardContent)
			: this.toggleDisappearClass(cardContent, cardLoading);
	}

	private setUpdatedWorkBody(commonValues: {
		studentId: number;
		observation?: string;
	}) {
		const actualMarking =
			this.selectedWorkType() === Work.TASK
				? (this.getOldState() as StudentToTask)?.markingId
				: this.getOldState()?.marking;
		const marking =
			this.editHTMLElements()?.controlElement?.value ?? actualMarking;

		if (!commonValues.observation) delete commonValues.observation;

		return this.selectedWorkType() === Work.TASK
			? {
					studentToTask: {
						...commonValues,
						markingId: marking,
						taskId: this.selectedWorkInfo()?.workId,
					},
			  }
			: {
					studentToExam: {
						...commonValues,
						marking,
						examId: this.selectedWorkInfo()?.workId,
					},
			  };
	}

	private toggleDisappearClass(removeFrom: HTMLElement, addTo: HTMLElement) {
		this.renderer.removeClass(removeFrom, 'disappear');
		this.renderer.addClass(addTo, 'disappear');
	}

	private returnToPreviousState() {
		const { controlElement, textArea } =
			this.editHTMLElements() as ToggleEditElements;
		const previousState = this.getOldState();

		controlElement.value =
			this.selectedWorkType() === Work.TASK
				? (previousState as StudentToTask)?.markingId
				: previousState?.marking;
		if (textArea) textArea.value = previousState?.observation ?? '';
	}

	private getOldState() {
		const { workId, studentId } = this.selectedWorkInfo() as WorkInfo;
		let previousState: StudentToTask | StudentToExam | undefined =
			undefined;

		if (this.selectedWorkType() === Work.TASK) {
			const task = this.tasks().find(task => task.id === workId);

			previousState = (task as Task)?.studentToTask?.find(
				relation => relation.studentId === studentId
			);
		} else {
			const exam = this.exams().find(exam => exam.id === workId);

			previousState = (exam as Exam)?.studentToExam?.find(
				relation => relation.studentId === studentId
			);
		}

		return previousState;
	}

	public toggleFiltersMenu(open: null | boolean = null) {
		this.openFiltersMenu.set(open ?? !this.openFiltersMenu());
	}
}
