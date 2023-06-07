import { Component, Inject, OnDestroy, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@angular/forms';
import { QualificationsService } from '../../../../core/services/qualifications/qualifications.service';
import { SharedModule } from '../../../../shared/shared.module';
import { CreatePayload } from './interfaces/create-payload.interface';
import { Work } from '../../../../core/enums/work.enum';
import { TasksService } from '../../../../core/services/tasks/tasks.service';
import { ExamsService } from '../../../../core/services/exams/exams.service';
import { Observable, Subject, of, takeUntil } from 'rxjs';
import { CreateTask } from '../../../../core/interfaces/create-task.interface';
import { CreateExam } from '../../../../core/interfaces/create-exam.interface';
import { ButtonState } from '../enums/button-state.enum';
import { CreateForm } from './interfaces/create-form.interface';
import { HttpErrorResponse } from '@angular/common/http';

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
		course: '',
		subject: '',
		date: '',
		name: '',
		description: '',
	});
	public courses = this.qs.courses;
	public subjects = this.qs.subjects;
	public workEnum = Work;
	public buttonStateEnum = ButtonState;
	public saveButtonMessage = signal(ButtonState.CREATE);
	private ts = inject(TasksService);
	private es = inject(ExamsService);
	private students = this.qs.students;
	private destroy: Subject<boolean> = new Subject<boolean>();

	constructor(
		public dialogRef: MatDialogRef<CreateDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public payload: CreatePayload,
		private fb: FormBuilder,
		private qs: QualificationsService
	) {}

	ngOnDestroy(): void {
		this.destroy.next(true);
		this.destroy.unsubscribe();
	}

	public closeDialog(): void {
		this.dialogRef.close(this.createForm.get('type')?.value);
	}

	public sendForm() {
		const cleanedForm = this.setForm();
		const queryParams = { course: cleanedForm.course };
		let create$: Observable<CreateTask | CreateExam | undefined> =
			of(undefined);

		this.saveButtonMessage.set(ButtonState.SAVING);

		this.createForm.get('type')?.value === this.workEnum.TASK
			? (create$ = this.ts.createTask(cleanedForm as CreateTask))
			: (create$ = this.es.createExam(cleanedForm as CreateExam));

		create$.pipe(takeUntil(this.destroy)).subscribe(result => {
			if (result instanceof HttpErrorResponse) {
				this.qs.handleHttpResponseMessage();
			} else {
				this.qs.getTasksExamsAndStudents(queryParams, null);
			}

			this.closeDialog();
		});
	}

	private setForm(): CreateTask | CreateExam {
		const formDeepCopy: CreateForm = JSON.parse(
			JSON.stringify(this.createForm.value)
		);

		formDeepCopy.type === this.workEnum.TASK
			? (formDeepCopy.studentToTask =
					this.setTaskOrExamToStudentAttribute())
			: (formDeepCopy.studentToExam =
					this.setTaskOrExamToStudentAttribute());

		delete formDeepCopy.type;

		formDeepCopy.course = this.payload.course;
		formDeepCopy.description = formDeepCopy.description?.trimEnd();

		return formDeepCopy as unknown as CreateTask | CreateExam;
	}

	private setTaskOrExamToStudentAttribute() {
		const students = this.students() ?? [];

		return students.map(student => ({
			student: student.id,
		}));
	}
}
