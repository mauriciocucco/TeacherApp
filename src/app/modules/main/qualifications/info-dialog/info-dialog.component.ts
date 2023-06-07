import { Component, Inject, signal, inject, OnDestroy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ButtonState } from '../enums/button-state.enum';
import { InfoPayload } from './interfaces/info-payload.interface';
import { TasksService } from '../../../../core/services/tasks/tasks.service';
import { Observable, Subject, of, takeUntil } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { QualificationsService } from '../../../../core/services/qualifications/qualifications.service';
import { UpdateTask } from '../../../../core/interfaces/update-task.interface';
import { UpdateExam } from '../../../../core/interfaces/update-exam.interface';
import { Work } from '../../../../core/enums/work.enum';
import { ExamsService } from '../../../../core/services/exams/exams.service';

@Component({
	selector: 'app-info-dialog',
	templateUrl: './info-dialog.component.html',
	styleUrls: ['./info-dialog.component.scss'],
})
export class InfoDialogComponent implements OnDestroy {
	public infoForm = this.fb.nonNullable.group({
		name: '',
		date: '',
		description: '',
	});
	public buttonStateEnum = ButtonState;
	public editButtonMessage = signal('Editar');
	public editMode = signal(false);
	private ts = inject(TasksService);
	private es = inject(ExamsService);
	private qs = inject(QualificationsService);
	private destroy: Subject<boolean> = new Subject<boolean>();
	private workEnum = Work;

	constructor(
		public dialogRef: MatDialogRef<InfoDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public payload: InfoPayload,
		private fb: FormBuilder
	) {
		this.setFormValues();
	}

	ngOnDestroy(): void {
		this.destroy.next(true);
		this.destroy.unsubscribe();
	}

	public closeDialog(): void {
		this.dialogRef.close();
	}

	public sendForm() {
		if (this.editButtonMessage() === this.buttonStateEnum.EDIT) {
			this.editMode.set(true);
			this.editButtonMessage.set(this.buttonStateEnum.SAVE);
			return;
		}

		const updatedWork = this.infoForm.value;
		const workId = this.payload.workId;
		let update$: Observable<UpdateTask | UpdateExam | undefined> =
			of(undefined);

		this.editButtonMessage.set(this.buttonStateEnum.SAVING);

		this.payload.workType === this.workEnum.TASK
			? (update$ = this.ts.updateTask(updatedWork as UpdateTask, workId))
			: (update$ = this.es.updateExam(updatedWork as UpdateExam, workId));

		update$.pipe(takeUntil(this.destroy)).subscribe(result => {
			if (result instanceof HttpErrorResponse) {
				this.qs.handleHttpResponseMessage(result.error?.message);
			} else {
				this.qs.handleHttpResponseMessage('La edición fue exitosa.');
				this.qs.updateWorkCardInfo(
					this.payload.workType,
					workId,
					updatedWork
				);
			}

			this.closeDialog();
		});
	}

	private setFormValues() {
		this.infoForm.patchValue({
			name: this.payload.name,
			date: this.payload.date,
			description: this.payload.description?.trimEnd(),
		});
	}
}
