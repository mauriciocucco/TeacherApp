import { Component, Inject, OnDestroy, inject, signal } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TasksService } from '../../../../core/services/tasks/tasks.service';
import { ExamsService } from '../../../../core/services/exams/exams.service';
import { DeletePayload } from './interfaces/delete-payload.interface';
import { ButtonState } from '../enums/button-state.enum';
import { Work } from '../../../../core/enums/work.enum';
import { Observable, Subject, of, takeUntil } from 'rxjs';
import { Task } from '../../../../core/interfaces/task.interface';
import { Exam } from '../../../../core/interfaces/exam.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { QualificationsService } from '../../../../core/services/qualifications/qualifications.service';

@Component({
	selector: 'app-delete-dialog',
	standalone: true,
	imports: [SharedModule],
	templateUrl: './delete-dialog.component.html',
	styleUrls: ['./delete-dialog.component.scss'],
})
export class DeleteDialogComponent implements OnDestroy {
	public deleteButtonMessage = signal(ButtonState.DELETE);
	public buttonStateEnum = ButtonState;
	public workName = '';
	private ts = inject(TasksService);
	private es = inject(ExamsService);
	private qs = inject(QualificationsService);
	private selectedWorkType = this.qs.selectedWorkType;
	private destroy: Subject<boolean> = new Subject<boolean>();

	constructor(
		public dialogRef: MatDialogRef<DeleteDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public payload: DeletePayload
	) {
		this.workName = this.payload.workName;
	}

	ngOnDestroy(): void {
		this.destroy.next(true);
		this.destroy.unsubscribe();
	}

	public closeDialog(): void {
		this.dialogRef.close(this.selectedWorkType());
	}

	public sendForm() {
		const queryParams = { courseId: this.payload.courseId };
		let delete$: Observable<Task | Exam | undefined> = of(undefined);

		this.deleteButtonMessage.set(ButtonState.DELETING);

		this.selectedWorkType() === Work.TASK
			? (delete$ = this.ts.deleteTask(this.payload.workId))
			: (delete$ = this.es.deleteExam(this.payload.workId));

		delete$.pipe(takeUntil(this.destroy)).subscribe({
			next: () => {
				this.qs.getTasksExamsAndStudents(queryParams, null);
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
