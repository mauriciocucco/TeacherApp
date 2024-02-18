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
import { WorkTypeId } from '../../../../../core/enums/work-type-id.enum';
import { Marking } from '../../../../../core/interfaces/marking.interface';
import { InfoDialogComponent } from '../info-dialog/info-dialog.component';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
	BehaviorSubject,
	EMPTY,
	catchError,
	filter,
	switchMap,
	tap,
	debounce,
	timer,
	distinctUntilChanged,
} from 'rxjs';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { ViewService } from '../../../../../core/services/view/view.service';
import { ScreenType } from '../../../../../core/enums/screen-type.enum';
import { SharedModule } from '../../../../../shared/shared.module';
import { WorksService } from '../../../../../core/services/works/works.service';
import { StudentToWork } from '../../../../../core/interfaces/student-to-work.interface';

@Component({
	selector: 'app-work-card',
	standalone: true,
	imports: [SharedModule],
	templateUrl: './work-card.component.html',
	styleUrls: ['./work-card.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkCardComponent implements OnInit {
	public workTypeId = WorkTypeId;
	public students: Signal<Student[]> = this.qs.students;
	public works = this.qs.works;
	public markings: Signal<Marking[]> = this.qs.markings;
	private markingIdChanged = signal(false);
	public editMode = signal(false);
	public initialState: Partial<{
		markingId: number | null;
		score: number | null;
		observation: string;
	}> = {
		markingId: null,
		score: null,
		observation: '',
	};
	public updateForm = this.fb.nonNullable.group(this.initialState);
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
			this.ws.updateWork(payload, workId)
		),
		tap(({ id: updatedWorkId }) => {
			this.handleUpdateSuccess({ id: updatedWorkId });
			this.loading.next(false);
		}),
		catchError(error => {
			console.error('Hubo un error en el stream de updateWork$: ', error);

			this.backToInitialState();
			this.qs.handleHttpResponseMessage();
			this.loading.next(false);

			return EMPTY;
		})
	);
	private destroyRef = inject(DestroyRef);
	@Input() set work(value: Partial<StudentToWork> | undefined) {
		if (!value) return;

		const { markingId, score, observation } = value;

		this.updateForm.patchValue({ markingId, score, observation });
	}
	@Input() student: Student | undefined = undefined;

	constructor(
		private qs: QualificationsService,
		public dialog: MatDialog,
		private fb: FormBuilder,
		private ws: WorksService,
		private vs: ViewService
	) {}

	ngOnInit(): void {
		this.changeInitialState();
		this.listenForChanges();
	}

	private handleUpdateSuccess({ id: updatedWorkId }: { id: number }) {
		if (this.markingIdChanged())
			this.qs.updateDeliveredValue(
				updatedWorkId,
				this.student?.id ?? 0,
				Number(this.updateForm.get('markingId')?.value)
			);
		this.changeInitialState();
		this.qs.handleHttpResponseMessage('La edición fue exitosa.');
	}

	public setDeliveredOnTime({ checked: onTime }: MatCheckboxChange) {
		if (!this.work?.workId) return;

		const payload = {
			studentToWork: [
				{
					studentId: this.student?.id,
					onTime,
				},
			],
		};

		this.ws
			.updateWork(payload, this.work.workId)
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
			.subscribe(({ markingId, score, observation }) => {
				if (markingId !== this.initialState.markingId) {
					this.markingIdChanged.set(true);
					return this.update();
				}

				score != this.initialState.score ||
				observation != this.initialState.observation
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
		this.initialState = this.updateForm.value;
		this.markingIdChanged.set(false);
	}

	public openInfoDialog(studentToWork: Partial<StudentToWork> | undefined) {
		if (!studentToWork) return;

		const matConfig =
			this.vs.screenType() === ScreenType.MOBILE
				? { width: '100vw', height: '100vh', maxWidth: '100vw' }
				: {};

		this.dialog.open(InfoDialogComponent, {
			data: studentToWork,
			...matConfig,
		});
	}

	public openDeleteDialog(studentToWork: Partial<StudentToWork> | undefined) {
		if (!studentToWork) return;

		this.dialog.open(DeleteDialogComponent, {
			data: studentToWork.work,
		});
	}

	private setPayload() {
		return {
			studentToWork: [
				{
					studentId: this.student?.id,
					markingId: this.updateForm.get('markingId')?.value ?? null,
					score: this.updateForm.get('score')?.value ?? null,
					observation:
						this.updateForm.get('observation')?.value ?? '',
				},
			],
		};
	}

	public update() {
		const payload = this.setPayload();

		this.updateWork.next({
			workId: this.work?.workId as number,
			...payload,
		});
	}
}
