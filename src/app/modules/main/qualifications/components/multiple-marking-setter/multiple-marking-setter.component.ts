import {
	Component,
	signal,
	inject,
	DestroyRef,
	ViewChild,
	ChangeDetectionStrategy,
} from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { MatDialogRef } from '@angular/material/dialog';
import { Student } from '../../../../../core/interfaces/student.interface';
import { ButtonState } from '../../enums/button-state.enum';
import { WorkTypeId } from '../../../../../core/enums/work-type-id.enum';
import { Marking } from '../../../../../core/interfaces/marking.interface';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatSelectionList } from '@angular/material/list';
import { QualificationsService } from '../../../../../core/services/qualifications/qualifications.service';
import { UpdateStudentToWork } from '../../../../../core/interfaces/update-student-to-work.interface';
import { WorkName } from '../../../../../core/enums/work-name.enum';

@Component({
    selector: 'app-multiple-marking-setter',
    imports: [SharedModule],
    templateUrl: './multiple-marking-setter.component.html',
    styleUrls: ['./multiple-marking-setter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultipleMarkingSetterComponent {
	public students: Student[] = this.qs.students();
	public saveButtonMessage = signal(ButtonState.RATE);
	public WorkTypeId = WorkTypeId;
	public workName = WorkName;
	public markings: Marking[] = this.qs.markings();
	public workControl: FormControl<WorkTypeId | null> = new FormControl(null);
	public markingsForm = this.fb.group({
		workId: ['', Validators.required],
		marking: ['', Validators.required],
		observation: [''],
	});
	public updateWork$ = this.qs.updateWork$;
	public works = this.qs.works;
	private destroyRef = inject(DestroyRef);
	@ViewChild('studentsList', { static: false })
	studentsList?: MatSelectionList;

	constructor(
		private fb: FormBuilder,
		private qs: QualificationsService,
		public dialogRef: MatDialogRef<MultipleMarkingSetterComponent>
	) {
		// this.listenForWorkElection();
	}

	public closeDialog(reloadData = false): void {
		this.dialogRef.close(reloadData);
	}

	// private listenForWorkElection() {
	// 	this.workControl.valueChanges
	// 		.pipe(takeUntilDestroyed(this.destroyRef))
	// 		.subscribe(value => {
	// 			value === Work.TASK
	// 				? (this.works = this.tasks as Task[] & Exam[])
	// 				: (this.works = this.exams as Task[] & Exam[]);
	// 		});
	// }

	private setPayload() {
		const markingsArray = this.studentsList?._value?.map(studentId => ({
			studentId,
			markingId: this.markingsForm.get('marking')?.value,
			observation: this.markingsForm.get('observation')?.value,
		}));

		return { studentToWork: markingsArray as UpdateStudentToWork[] };
	}

	public setMarkings() {
		const workId = this.markingsForm.get('workId')
			?.value as unknown as number;
		const payload = this.setPayload();

		this.saveButtonMessage.set(ButtonState.SAVING);
		this.qs.update([workId, payload], this.dialogRef, true);
	}
}
