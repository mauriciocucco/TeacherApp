import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	Inject,
	inject,
	signal,
} from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TasksService } from '../../../../../core/services/tasks/tasks.service';
import { ExamsService } from '../../../../../core/services/exams/exams.service';
import { DeletePayload } from '../../components/delete-dialog/interfaces/delete-payload.interface';
import { ButtonState } from '../../enums/button-state.enum';
import { Work } from '../../../../../core/enums/work.enum';
import { Observable, of } from 'rxjs';
import { Task } from '../../../../../core/interfaces/task.interface';
import { Exam } from '../../../../../core/interfaces/exam.interface';
import { QualificationsService } from '../../../../../core/services/qualifications/qualifications.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
	selector: 'app-delete-dialog',
	standalone: true,
	imports: [SharedModule],
	templateUrl: './delete-dialog.component.html',
	styleUrls: ['./delete-dialog.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteDialogComponent {
	public deleteButtonMessage = signal(ButtonState.DELETE);
	public buttonStateEnum = ButtonState;
	public workName = '';
	private ts = inject(TasksService);
	private es = inject(ExamsService);
	private qs = inject(QualificationsService);
	private selectedWorkType = this.qs.selectedWorkType;
	private destroyRef = inject(DestroyRef);

	constructor(
		public dialogRef: MatDialogRef<DeleteDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public payload: DeletePayload
	) {
		this.workName = this.payload.workName;
	}

	public closeDialog(): void {
		this.dialogRef.close();
	}

	public sendForm() {
		const queryParams = { courseId: this.payload.courseId };
		let delete$: Observable<Task | Exam | undefined> = of(undefined);

		this.deleteButtonMessage.set(ButtonState.DELETING);

		this.selectedWorkType() === Work.TASK
			? (delete$ = this.ts.deleteTask(this.payload.workId))
			: (delete$ = this.es.deleteExam(this.payload.workId));

		delete$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: () => {
				this.qs.getTasksExamsAndStudents(queryParams, queryParams);
				this.qs.handleHttpResponseMessage(
					`Se eliminó a "${this.payload.workName}" con éxito.`
				);
				this.closeDialog();
			},
			error: () => {
				this.qs.handleHttpResponseMessage();
				this.closeDialog();
			},
		});
	}
}
