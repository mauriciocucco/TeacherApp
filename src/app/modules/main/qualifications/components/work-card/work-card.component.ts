/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	Component,
	DestroyRef,
	Input,
	Signal,
	inject,
	signal,
	ChangeDetectionStrategy,
	OnInit,
} from '@angular/core';
import { Student } from '../../../../../core/interfaces/student.interface';
import { QualificationsService } from '../../../../../core/services/qualifications/qualifications.service';
import { Task } from '../../../../../core/interfaces/task.interface';
import { Exam } from '../../../../../core/interfaces/exam.interface';
import { Work } from '../../../../../core/enums/work.enum';
import { Marking } from '../../../../../core/interfaces/marking.interface';
import { InfoDialogComponent } from '../info-dialog/info-dialog.component';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StudentRelationPipe } from '../../pipes/student-relation.pipe';
import { UpdateControl } from '../../interfaces/update-control.type';
import { UpdateState } from '../../interfaces/update-state.interface';
import { debounce, timer, distinctUntilChanged } from 'rxjs';
import { TasksService } from '../../../../../core/services/tasks/tasks.service';
import { ExamsService } from '../../../../../core/services/exams/exams.service';
import {
	BehaviorSubject,
	EMPTY,
	catchError,
	filter,
	switchMap,
	tap,
} from 'rxjs';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { UpdateTask } from '../../../../../core/interfaces/update-task.interface';

@Component({
	selector: 'app-work-card',
	templateUrl: './work-card.component.html',
	styleUrls: ['./work-card.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkCardComponent implements OnInit {
	public studentRelationPipe = new StudentRelationPipe();
	public workEnum = Work;
	public students: Signal<Student[]> = this.qs.students;
	public tasks: Signal<Task[]> = this.qs.tasks;
	public exams: Signal<Exam[]> = this.qs.exams;
	public markings: Signal<Marking[]> = this.qs.markings;
	public editMode = signal(false);
	public initialState: UpdateState = {
		markingId: '',
		examMarking: '',
		observation: '',
	};
	public updateForm = this.fb.nonNullable.group(this.initialState);
	private markingIdEdited = false;
	private loading = new BehaviorSubject(false);
	public loading$ = this.loading.asObservable();
	private updateWork = new BehaviorSubject({ workId: 0 });
	public updateWork$ = this.updateWork.asObservable().pipe(
		filter(({ workId }) => Boolean(workId)),
		tap(() => {
			this.editMode.set(false);
			this.loading.next(true);
		}),
		switchMap(({ workId, ...payload }) =>
			this.workType === Work.TASK
				? this.ts.updateTask(payload, workId)
				: this.es.updateExam(payload, workId)
		),
		tap(({ id: updatedWorkId }) => {
			this.changeInitialState();
			this.loading.next(false);
			this.qs.updateDeliveredValue(
				updatedWorkId,
				Number(this.updateForm.get('markingId')?.value),
				this.markingIdEdited
			);
			this.qs.handleHttpResponseMessage('La edición fue exitosa.');
		}),
		catchError(error => {
			console.error('Hubo un error en el stream de updateWork$: ', error);

			this.backToInitialState();
			this.loading.next(false);
			this.qs.handleHttpResponseMessage();

			return EMPTY;
		})
	);
	private destroyRef = inject(DestroyRef);
	@Input() work: Partial<Task & Exam> | undefined = undefined;
	@Input() student: Student | undefined = undefined;
	@Input() workType: Work = Work.TASK;

	constructor(
		private qs: QualificationsService,
		public dialog: MatDialog,
		private fb: FormBuilder,
		private ts: TasksService,
		private es: ExamsService
	) {}

	ngOnInit(): void {
		this.setInitialFormValues();
		this.changeInitialState();
		this.listenForChanges();
	}

	public setDeliveredOnTime({ checked: onTime }: MatCheckboxChange) {
		const payload = {
			studentToTask: [
				{
					studentId: this.student?.id,
					onTime,
				},
			],
		};

		this.ts
			.updateTask(payload as UpdateTask, this.work!.id as number)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.qs.handleHttpResponseMessage(
						'La edición fue exitosa.'
					);
				},
				error: () => {
					this.qs.handleHttpResponseMessage();
				},
			});
	}

	private setInitialFormValues() {
		this.updateForm.patchValue(
			{
				markingId: this.studentRelationPipe.transform(
					{
						works: this.work?.studentToTask,
						studentId: this.student?.id,
					},
					'markingId'
				),
				examMarking: this.studentRelationPipe.transform(
					{
						works: this.work?.studentToExam,
						studentId: this.student?.id,
					},
					'marking'
				),
				observation: this.studentRelationPipe.transform(
					{
						works: this.work?.studentToTask
							? this.work?.studentToTask
							: this.work?.studentToExam,
						studentId: this.student?.id,
					},
					'observation'
				),
			},
			{ emitEvent: false }
		);
	}

	private listenForChanges() {
		this.updateForm.valueChanges
			.pipe(
				debounce(({ observation }) =>
					observation !== this.initialState.observation
						? timer(500)
						: timer(0)
				),
				distinctUntilChanged(),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(({ markingId, examMarking, observation }) => {
				if (markingId !== this.initialState.markingId) {
					this.update('markingId');
					this.markingIdEdited = true;
				} else {
					this.markingIdEdited = false;
				}

				examMarking !== this.initialState.examMarking ||
				observation !== this.initialState.observation
					? this.editMode.set(true)
					: this.editMode.set(false);
			});
	}

	public cancelEdition() {
		this.editMode.set(false);
		this.backToInitialState();
	}

	private backToInitialState() {
		this.updateForm.patchValue(this.initialState, { emitEvent: false });
	}

	private changeInitialState() {
		this.initialState = this.updateForm.value as UpdateState;
	}

	public openInfoDialog(work: Partial<Task & Exam> | undefined) {
		if (!work) return;

		this.dialog.open(InfoDialogComponent, {
			data: work,
		});
	}

	public openDeleteDialog(work: Partial<Task & Exam> | undefined) {
		if (!work) return;

		this.dialog.open(DeleteDialogComponent, {
			data: work,
		});
	}

	public update(controlName?: UpdateControl) {
		const payload = controlName
			? this.setPayloadByControlName(controlName)
			: this.setPayload();

		this.updateWork.next({ workId: this.work?.id as number, ...payload });
	}

	private setPayloadByControlName(controlName: UpdateControl) {
		const firstLevel =
			this.workType === Work.TASK ? 'studentToTask' : 'studentToExam';

		return {
			[firstLevel]: [
				{
					studentId: this.student?.id,
					[controlName]: this.updateForm.get(controlName)?.value,
				},
			],
		};
	}

	private setPayload() {
		const commonProps = {
			studentId: this.student?.id,
			observation: this.updateForm.get('observation')?.value ?? '',
		};

		return this.workType === Work.TASK
			? {
					studentToTask: [commonProps],
			  }
			: {
					studentToExam: [
						{
							...commonProps,
							marking:
								this.updateForm.get('examMarking')?.value ?? '',
						},
					],
			  };
	}
}
