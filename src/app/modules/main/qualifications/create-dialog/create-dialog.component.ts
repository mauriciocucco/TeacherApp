import { Component, Inject, OnDestroy, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@angular/forms';
import { QualificationsService } from '../../../../core/services/qualifications/qualifications.service';
import { SharedModule } from '../../../../shared/shared.module';
import { Payload } from './interfaces/payload.interface';
import { Work } from '../../../../core/enums/work.enum';
import { TasksService } from '../../../../core/services/tasks/tasks.service';
import { ExamsService } from '../../../../core/services/exams/exams.service';
import { Observable, Subject, catchError, of, takeUntil } from 'rxjs';
import { CreateTask } from '../../../../core/interfaces/create-task.interface';
import { CreateExam } from '../../../../core/interfaces/create-exam.interface';
import { ButtonState } from './enums/button-state.enum';

@Component({
	selector: 'app-create-dialog',
	standalone: true,
	imports: [SharedModule],
	templateUrl: './create-dialog.component.html',
	styleUrls: ['./create-dialog.component.scss'],
})
export class CreateDialogComponent implements OnDestroy {
	public createForm = this.fb.nonNullable.group({
		type: '',
		courseId: [{ value: '' }],
		subjectId: [{ value: '' }],
		date: [{ value: '' }],
		name: '',
		description: '',
	});
	public courses = this.qs.courses;
	public subjects = this.qs.subjects;
	public workEnum = Work;
	public buttonStateEnum = ButtonState;
	public saveButtonMessage = signal('Guardar');
	private ts = inject(TasksService);
	private es = inject(ExamsService);
	private destroy: Subject<boolean> = new Subject<boolean>();

	constructor(
		public dialogRef: MatDialogRef<CreateDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public payload: Payload,
		private fb: FormBuilder,
		private qs: QualificationsService
	) {}

	ngOnDestroy(): void {
		this.destroy.next(true);
		this.destroy.unsubscribe();
	}

	public closeDialog(): void {
		this.dialogRef.close();
	}

	public sendForm() {
		const cleanedForm = this.cleanForm();
		const queryParams = { courseId: cleanedForm.courseId };
		let create$:
			| Observable<CreateTask>
			| Observable<CreateExam>
			| Observable<undefined> = of(undefined);

		this.saveButtonMessage.set(ButtonState.SAVING);

		this.createForm.get('type')?.value === this.workEnum.TASK
			? (create$ = this.ts.createTask(cleanedForm))
			: (create$ = this.es.createExam(cleanedForm));

		create$
			.pipe(
				takeUntil(this.destroy),
				catchError(error => {
					this.saveButtonMessage.set(ButtonState.SAVE);
					return of(false);
				})
			)
			.subscribe(result => {
				if (!result) return;

				this.qs.getTasksExamsAndStudents(queryParams, null);
				this.closeDialog();
			});
	}

	private cleanForm(): CreateTask | CreateExam {
		const formDeepCopy = JSON.parse(JSON.stringify(this.createForm.value));

		delete formDeepCopy.type;

		formDeepCopy.courseId = this.payload.courseId;

		return formDeepCopy;
	}
}
