import {
	ChangeDetectionStrategy,
	Component,
	Inject,
	signal,
} from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DeletePayload } from '../../components/delete-dialog/interfaces/delete-payload.interface';
import { ButtonState } from '../../enums/button-state.enum';
import { QualificationsService } from '../../../../../core/services/qualifications/qualifications.service';

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
	public deleteWork$ = this.qs.deleteWork$;

	constructor(
		private qs: QualificationsService,
		public dialogRef: MatDialogRef<DeleteDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public payload: DeletePayload
	) {}

	public closeDialog(): void {
		this.dialogRef.close();
	}

	public delete() {
		this.deleteButtonMessage.set(ButtonState.DELETING);
		this.qs.delete(this.payload.id, this.dialogRef);
	}
}
