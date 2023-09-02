import {
	Component,
	DestroyRef,
	Input,
	Renderer2,
	Signal,
	WritableSignal,
	inject,
	signal,
} from '@angular/core';
import { Student } from '../../../../../core/interfaces/student.interface';
import { QualificationsService } from '../../../../../core/services/qualifications/qualifications.service';
import { Task } from '../../../../../core/interfaces/task.interface';
import { Exam } from '../../../../../core/interfaces/exam.interface';
import { Work } from '../../../../../core/enums/work.enum';
import { Marking } from '../../../../../core/interfaces/marking.interface';
import { ToggleEditElements } from '../../interfaces/toggle-edit.interface';
import { WorkInfo } from '../../interfaces/work-info.interface';
import { UpdateWorkElements } from '../../interfaces/update-work.interface';
import { MatSelect } from '@angular/material/select';
import { StudentToTask } from '../../../../../core/interfaces/student-to-task.interface';
import { StudentToExam } from '../../../../../core/interfaces/student-to-exam.interface';
import { InfoDialogComponent } from '../info-dialog/info-dialog.component';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Observable, concatMap, of } from 'rxjs';
import { UpdateTask } from '../../../../../core/interfaces/update-task.interface';
import { UpdateExam } from '../../../../../core/interfaces/update-exam.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TasksService } from '../../../../../core/services/tasks/tasks.service';
import { ExamsService } from '../../../../../core/services/exams/exams.service';

@Component({
	selector: 'app-work-card',
	templateUrl: './work-card.component.html',
	styleUrls: ['./work-card.component.scss'],
})
export class WorkCardComponent {
	@Input() work: Partial<Task & Exam> | undefined = undefined;
	@Input() student: Student | undefined = undefined;
	@Input() workType: Work = Work.TASK;
	public students: Signal<Student[] | undefined> = this.qs.students;
	public tasks: Signal<Task[]> = this.qs.tasks;
	public exams: Signal<Exam[]> = this.qs.exams;
	public markings: Signal<Marking[]> = this.qs.markings;
	public editMode = signal(false);
	public defaultRowsNumber = signal(5);
	private ts = inject(TasksService);
	private es = inject(ExamsService);
	private destroyRef = inject(DestroyRef);
	private selectedWorkType = this.qs.selectedWorkType;
	private defaultWorkInfo = {
		workId: 0,
		studentId: 0,
	};
	private editHTMLElements: WritableSignal<
		ToggleEditElements | UpdateWorkElements | undefined
	> = signal(undefined);
	private selectedWorkInfo: WritableSignal<WorkInfo> = signal(
		this.defaultWorkInfo
	);

	constructor(
		private qs: QualificationsService,
		private renderer: Renderer2,
		public dialog: MatDialog
	) {}

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

	private setEditSignals(
		workElements: ToggleEditElements | UpdateWorkElements,
		workInfo: WorkInfo
	) {
		this.selectedWorkType.set(this.workType);
		this.editHTMLElements.set(workElements);
		this.selectedWorkInfo.set(workInfo);
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

	private toggleDisappearClass(removeFrom: HTMLElement, addTo: HTMLElement) {
		this.renderer.removeClass(removeFrom, 'disappear');
		this.renderer.addClass(addTo, 'disappear');
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

	public openInfoDialog(
		work: Partial<Task & Exam> | undefined,
		workType = Work.TASK
	) {
		if (!work) return;

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

	public openDeleteDialog(
		work: Partial<Task & Exam> | undefined,
		workType = Work.TASK
	) {
		if (!work) return;

		this.selectedWorkType.set(workType);
		this.dialog.open(DeleteDialogComponent, {
			data: {
				courseId: this.qs.selectedCourseId(),
				workId: work.id,
				workName: work.name,
			},
		});
	}

	private resetUI() {
		this.loadingCardContent(false);
		this.changeEditUIStatus(false);
	}

	private loadingCardContent(loading = true) {
		const { cardLoading, cardContent } =
			this.editHTMLElements() as UpdateWorkElements;

		loading
			? this.toggleDisappearClass(cardLoading, cardContent)
			: this.toggleDisappearClass(cardContent, cardLoading);
	}

	private setUpdatedWorkBody(commonValues: {
		studentId: number | undefined;
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

	public updateWork(
		updateWorkElements: UpdateWorkElements,
		updateWorkInfo: WorkInfo
	) {
		this.setEditSignals(updateWorkElements, updateWorkInfo);

		const commonValues: {
			studentId: number | undefined;
			observation?: string;
		} = {
			studentId: updateWorkInfo.studentId,
		};

		if (updateWorkElements.textArea)
			commonValues.observation =
				updateWorkElements.textArea.value.trimEnd();

		const updatedWork = this.setUpdatedWorkBody(commonValues);
		let update$: Observable<Task | Exam | undefined> = of(undefined);

		this.loadingCardContent();

		this.workType === Work.TASK
			? (update$ = this.ts.updateTask(
					updatedWork as UpdateTask,
					updateWorkInfo.workId as number
			  ))
			: (update$ = this.es.updateExam(
					updatedWork as UpdateExam,
					updateWorkInfo.workId as number
			  ));

		update$
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				concatMap(() => {
					return this.workType === Work.TASK
						? this.ts.getTask(updateWorkInfo.workId as number)
						: this.es.getExam(updateWorkInfo.workId as number);
				})
			)
			.subscribe({
				next: updatedWork => {
					this.qs.updateWorkCardInfo(
						updateWorkInfo.workId as number,
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
}
