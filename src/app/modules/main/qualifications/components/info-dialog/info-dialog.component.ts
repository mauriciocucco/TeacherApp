import {
	Component,
	Inject,
	signal,
	inject,
	DestroyRef,
	ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ButtonState } from '../../enums/button-state.enum';
import { InfoPayload } from '../../components/info-dialog/interfaces/info-payload.interface';
import { TasksService } from '../../../../../core/services/tasks/tasks.service';
import { Observable, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { QualificationsService } from '../../../../../core/services/qualifications/qualifications.service';
import { UpdateTask } from '../../../../../core/interfaces/update-task.interface';
import { UpdateExam } from '../../../../../core/interfaces/update-exam.interface';
import { Work } from '../../../../../core/enums/work.enum';
import { ExamsService } from '../../../../../core/services/exams/exams.service';
import { Task } from '../../../../../core/interfaces/task.interface';
import { Exam } from '../../../../../core/interfaces/exam.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
	selector: 'app-info-dialog',
	standalone: true,
	imports: [SharedModule],
	templateUrl: './info-dialog.component.html',
	styleUrls: ['./info-dialog.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoDialogComponent {
	public infoForm = this.fb.nonNullable.group({
		name: '',
		date: '',
		description: '',
	});
	public buttonStateEnum = ButtonState;
	public editButtonMessage = signal('Editar');
	public editMode = signal(false);
	public subjectControl: FormControl<string | undefined> = new FormControl(
		{ value: undefined, disabled: true },
		{ nonNullable: true }
	);
	private ts = inject(TasksService);
	private es = inject(ExamsService);
	private qs = inject(QualificationsService);
	private selectedWorkType = this.qs.selectedWorkType;
	private destroyRef = inject(DestroyRef);

	constructor(
		public dialogRef: MatDialogRef<InfoDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public payload: InfoPayload,
		private fb: FormBuilder
	) {
		this.setFormValues();
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
		let update$: Observable<Task | Exam | undefined> = of(undefined);

		this.editButtonMessage.set(this.buttonStateEnum.SAVING);
		this.selectedWorkType() === Work.TASK
			? (update$ = this.ts.updateTask(updatedWork as UpdateTask, workId))
			: (update$ = this.es.updateExam(updatedWork as UpdateExam, workId));

		update$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: () => {
				this.qs.handleHttpResponseMessage('La edición fue exitosa.');
				this.qs.updateWorkCardInfo(workId, updatedWork);
				this.closeDialog();
			},
			error: (error: HttpErrorResponse) => {
				this.qs.handleHttpResponseMessage(error.error?.message);
				this.closeDialog();
			},
		});
	}

	private setFormValues() {
		this.infoForm.patchValue({
			name: this.payload.name,
			date: this.payload.date,
			description: this.payload.description?.trimEnd(),
		});
		this.subjectControl.setValue(this.findSubject());
	}

	private findSubject() {
		console.log('MATERIA ', this.payload.workSubject);
		return this.qs
			.subjects()
			.find(subject => subject.id === this.payload.workSubject?.id)?.name;
	}
}
