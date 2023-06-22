import { Component, Inject, signal, inject, DestroyRef } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Student } from '../../../../../core/interfaces/student.interface';
import { ButtonState } from '../../enums/button-state.enum';
import { Work } from '../../../../../core/enums/work.enum';
import { Marking } from '../../../../../core/interfaces/marking.interface';
import { FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MultipleMarkingPayload } from './interfaces/multiple-marking-payload.interface';

@Component({
	selector: 'app-multiple-marking-setter',
	standalone: true,
	imports: [SharedModule],
	templateUrl: './multiple-marking-setter.component.html',
	styleUrls: ['./multiple-marking-setter.component.scss'],
})
export class MultipleMarkingSetterComponent {
	public students: Student[] = [];
	public saveButtonMessage = signal(ButtonState.RATE);
	public workEnum = Work;
	public works: any[] = [];
	public markings: Marking[] = [];
	public workControl: FormControl<Work | null> = new FormControl(null);
	private destroyRef = inject(DestroyRef);

	constructor(
		public dialogRef: MatDialogRef<MultipleMarkingSetterComponent>,
		@Inject(MAT_DIALOG_DATA) public payload: MultipleMarkingPayload
	) {
		this.setInitialData();
		this.listeningWorkElection();
	}

	public closeDialog(): void {
		this.dialogRef.close();
	}

	private setInitialData() {
		this.students = this.payload.students;
		this.markings = this.payload.markings;
	}

	private listeningWorkElection() {
		this.workControl.valueChanges
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(value => {
				value === Work.TASK
					? (this.works = this.payload.tasks)
					: this.payload.exams;
			});
	}
}
