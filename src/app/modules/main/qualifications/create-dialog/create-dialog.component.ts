import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@angular/forms';
import { QualificationsService } from '../../../../core/services/qualifications/qualifications.service';

@Component({
	selector: 'app-create-dialog',
	templateUrl: './create-dialog.component.html',
	styleUrls: ['./create-dialog.component.scss'],
})
export class CreateDialogComponent {
	public createForm = this.fb.nonNullable.group({
		type: [{ value: '' }],
		courseId: [{ value: '' }],
		subjectId: [{ value: '' }],
		date: [{ value: '' }],
		description: [{ value: '' }],
	});
	public courses = this.qs.courses;
	public subjects = this.qs.subjects;

	constructor(
		public dialogRef: MatDialogRef<CreateDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any,
		private fb: FormBuilder,
		private qs: QualificationsService
	) {}

	onNoClick(): void {
		this.dialogRef.close();
	}
}
