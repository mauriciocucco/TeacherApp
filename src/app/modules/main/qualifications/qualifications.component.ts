import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	OnDestroy,
	QueryList,
	Renderer2,
	Signal,
	ViewChildren,
	WritableSignal,
	computed,
	inject,
	signal,
} from '@angular/core';
import { Observable, concatMap, fromEvent, map, of } from 'rxjs';
import { Task } from '../../../core/interfaces/task.interface';
import { Exam } from '../../../core/interfaces/exam.interface';
import { Student } from '../../../core/interfaces/student.interface';
import { MatTabGroup } from '@angular/material/tabs';
import { Work } from '../../../core/enums/work.enum';
import { QualificationsService } from '../../../core/services/qualifications/qualifications.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
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
import { DOCUMENT, ViewportScroller } from '@angular/common';
import { MultipleMarkingSetterComponent } from './components/multiple-marking-setter/multiple-marking-setter.component';
import { CreateDialogComponent } from './components/create-dialog/create-dialog.component';
import { Marking } from '../../../core/interfaces/marking.interface';

@Component({
	selector: 'app-qualifications',
	templateUrl: './qualifications.component.html',
	styleUrls: ['./qualifications.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QualificationsComponent implements OnDestroy {
	public tasks: Signal<Task[]> = this.qs.tasks;
	public exams: Signal<Exam[]> = this.qs.exams;
	public students: Signal<Student[] | undefined> = this.qs.students;
	public markings: Signal<Marking[]> = this.qs.markings;
	public tasksExamsAndStudents$ = this.qs.tasksExamsAndStudents$;
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
	public selectedStudent = this.qs.selectedStudent;
	private selectedWorkType = this.qs.selectedWorkType;
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
	private destroyRef = inject(DestroyRef);
	private readonly document = inject(DOCUMENT);
	private readonly viewport = inject(ViewportScroller);
	public readonly showScroll$: Observable<boolean> = fromEvent(
		this.document,
		'scroll'
	).pipe(
		map(() => this.viewport.getScrollPosition()?.[1] > 0), // chequea que el usuario scrolee hacia abajo
		takeUntilDestroyed(this.destroyRef)
	);
	@ViewChildren('tabChildren') tabChildren?: QueryList<MatTabGroup>;

	constructor(
		private qs: QualificationsService,
		public dialog: MatDialog,
		private renderer: Renderer2,
		private vs: ViewService
	) {}

	ngOnDestroy(): void {
		this.cleanSignals();
	}

	public openCreateDialog(): void {
		const courseId = this.qs.selectedCourseId();
		const dialogRef = this.dialog.open(CreateDialogComponent, {
			data: { course: courseId },
		});

		dialogRef
			.afterClosed()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(reloadData => {
				if (reloadData) {
					const queryParams = {
						courseId,
					};
					this.changeToCorrectTab();
					this.qs.getTasksExamsAndStudents(queryParams);
				}
			});
	}

	private changeToCorrectTab() {
		if (this.selectedWorkType() === Work.TASK) this.selectedTab.set(0);
		if (this.selectedWorkType() === Work.EXAM) this.selectedTab.set(1);

		this.qs.resetFilters.next(true);
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
				courseId: this.qs.selectedCourseId(),
				workId: work.id,
				workName: work.name,
			},
		});
	}

	public openMultipleMarkingSetterDialog() {
		const dialogRef = this.dialog.open(MultipleMarkingSetterComponent, {
			data: {
				students: this.students(),
				markings: this.markings(),
				tasks: this.tasks(),
				exams: this.exams(),
			},
		});

		dialogRef
			.afterClosed()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(reloadData => {
				if (reloadData) {
					const queryParams = {
						courseId: this.qs.selectedCourseId(),
					};
					this.qs.getTasksExamsAndStudents(queryParams);
				}
			});
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

		update$
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				concatMap(() => {
					return updateWorkInfo.workType === Work.TASK
						? this.ts.getTask(updateWorkInfo.workId)
						: this.es.getExam(updateWorkInfo.workId);
				})
			)
			.subscribe({
				next: updatedWork => {
					this.qs.updateWorkCardInfo(
						updateWorkInfo.workId,
						updatedWork
					);
					this.resetUI();
					this.qs.handleHttpResponseMessage(
						'La edición fue exitosa.'
					);
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

		return this.selectedWorkType() === Work.TASK
			? {
					studentToTask: [
						{
							...commonValues,
							markingId: marking,
						},
					],
			  }
			: {
					studentToExam: [
						{
							...commonValues,
							marking,
						},
					],
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

	public onScrollToTop(): void {
		this.viewport.scrollToPosition([0, 0]);
	}

	public trackItems(index: number, item: any): number {
		return item.id;
	}

	private cleanSignals() {
		this.qs.students.set(undefined);
		this.qs.tasks.set([]);
		this.qs.exams.set([]);
		this.qs.tasksExamsAndStudentsSubject.next([null, null]);
	}
}
