import {
	ChangeDetectionStrategy,
	Component,
	Inject,
	signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@angular/forms';
import { QualificationsService } from '../../../../../core/services/qualifications/qualifications.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { CreatePayload } from '../../components/create-dialog/interfaces/create-payload.interface';
import { Work } from '../../../../../core/enums/work.enum';
import { CreateTask } from '../../../../../core/interfaces/create-task.interface';
import { CreateExam } from '../../../../../core/interfaces/create-exam.interface';
import { ButtonState } from '../../enums/button-state.enum';
import { CreateForm } from '../../components/create-dialog/interfaces/create-form.interface';
import { CreatePayload as Payload } from '../../../../../core/interfaces/create-payload.interface';

@Component({
	selector: 'app-create-dialog',
	standalone: true,
	imports: [SharedModule],
	templateUrl: './create-dialog.component.html',
	styleUrls: ['./create-dialog.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateDialogComponent {
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
	public createWork$ = this.qs.createWork$;
	private students = this.qs.students;

	constructor(
		public dialogRef: MatDialogRef<CreateDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public payload: CreatePayload,
		private fb: FormBuilder,
		private qs: QualificationsService
	) {}

	public closeDialog(reloadData = false): void {
		this.dialogRef.close(reloadData);
	}

	public create() {
		const payload = this.setPayload();

		this.saveButtonMessage.set(ButtonState.SAVING);
		this.qs.create(payload as Payload, this.dialogRef);
	}

	private setPayload(): CreateTask | CreateExam {
		const formDeepCopy: CreateForm = JSON.parse(
			JSON.stringify(this.createForm.value)
		);

		formDeepCopy.type === Work.TASK
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
		return this.students().map(student => ({
			studentId: student.id,
		}));
	}
}
