import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@angular/forms';
import { QualificationsService } from '../../../../../core/services/qualifications/qualifications.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { WorkName } from '../../../../../core/enums/work-name.enum';
import { ButtonState } from '../../enums/button-state.enum';
import { CreateWork } from '../../../../../core/interfaces/create-work.interface';
import { WorkTypeId } from '../../../../../core/enums/work-type-id.enum';

@Component({
    selector: 'app-create-dialog',
    imports: [SharedModule],
    templateUrl: './create-dialog.component.html',
    styleUrls: ['./create-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateDialogComponent {
	public createForm = this.fb.nonNullable.group({
		workTypeId: '',
		courseId: '',
		subjectId: '',
		date: '',
		name: '',
		description: '',
	});
	public courses = this.qs.courses;
	public subjects = this.qs.subjects;
	public workName = WorkName;
	public workTypeId = WorkTypeId;
	public buttonStateEnum = ButtonState;
	public saveButtonMessage = signal(ButtonState.CREATE);
	public createWork$ = this.qs.createWork$;
	private students = this.qs.students;

	constructor(
		public dialogRef: MatDialogRef<CreateDialogComponent>,
		private fb: FormBuilder,
		private qs: QualificationsService
	) {}

	public closeDialog(reloadData = false): void {
		this.dialogRef.close(reloadData);
	}

	public create() {
		const payload = this.setPayload();

		this.saveButtonMessage.set(ButtonState.SAVING);
		this.qs.create(payload, this.dialogRef);
	}

	private setPayload(): CreateWork {
		const formDeepCopy: CreateWork = JSON.parse(
			JSON.stringify(this.createForm.value)
		);

		formDeepCopy.studentToWork = this.setStudentToWork();
		formDeepCopy.courseId = this.qs.selectedCourseId();
		formDeepCopy.description = formDeepCopy.description?.trimEnd() ?? '';

		return formDeepCopy;
	}

	private setStudentToWork() {
		return this.students().map(student => ({
			studentId: student.id,
		}));
	}

	public selectWorkType(workOption: WorkTypeId) {
		this.qs.selectedWorkType.set(workOption);
	}
}
