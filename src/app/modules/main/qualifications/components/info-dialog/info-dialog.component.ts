import {
	Component,
	Inject,
	signal,
	ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ButtonState } from '../../enums/button-state.enum';
import { InfoPayload } from '../../components/info-dialog/interfaces/info-payload.interface';
import { QualificationsService } from '../../../../../core/services/qualifications/qualifications.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { UpdatePayload } from '../../../../../core/interfaces/update-payload.interface';

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
	public updateWork$ = this.qs.updateWork$;

	constructor(
		private qs: QualificationsService,
		public dialogRef: MatDialogRef<InfoDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public payload: InfoPayload,
		private fb: FormBuilder
	) {
		this.setFormValues();
	}

	private setFormValues() {
		this.infoForm.patchValue(
			{
				name: this.payload.name,
				date: this.payload.date,
				description: this.payload.description?.trimEnd(),
			},
			{ emitEvent: false }
		);
		this.subjectControl.setValue(this.findSubject());
	}

	private findSubject() {
		const subjectPayload = this.payload.subject?.id ?? this.payload.subject;

		return this.qs.subjects().find(subject => subject.id === subjectPayload)
			?.name;
	}

	public closeDialog(): void {
		this.dialogRef.close();
	}

	public update() {
		if (this.editButtonMessage() === this.buttonStateEnum.EDIT) {
			this.editMode.set(true);
			this.editButtonMessage.set(this.buttonStateEnum.SAVE);
			return;
		}

		this.editButtonMessage.set(this.buttonStateEnum.SAVING);

		this.qs.update(
			{
				workId: this.payload.id,
				...this.infoForm.value,
			} as UpdatePayload,
			this.dialogRef
		);
	}
}
