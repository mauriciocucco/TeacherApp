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
import { Work } from '../../../../../core/enums/work.enum';
import { Marking } from '../../../../../core/interfaces/marking.interface';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSelectionList } from '@angular/material/list';
import { Task } from '../../../../../core/interfaces/task.interface';
import { QualificationsService } from '../../../../../core/services/qualifications/qualifications.service';
import { UpdatePayload } from '../../../../../core/interfaces/update-payload.interface';
import { Exam } from '../../../../../core/interfaces/exam.interface';

@Component({
	selector: 'app-multiple-marking-setter',
	standalone: true,
	imports: [SharedModule],
	templateUrl: './multiple-marking-setter.component.html',
	styleUrls: ['./multiple-marking-setter.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultipleMarkingSetterComponent {
	public students: Student[] = this.qs.students();
	public saveButtonMessage = signal(ButtonState.RATE);
	public workEnum = Work;
	public works: Task[] & Exam[] = [];
	public markings: Marking[] = this.qs.markings();
	public workControl: FormControl<Work | null> = new FormControl(null);
	public markingsForm = this.fb.group({
		workId: ['', Validators.required],
		marking: ['', Validators.required],
		observation: [''],
	});
	public updateWork$ = this.qs.updateWork$;
	private tasks = this.qs.tasks();
	private exams = this.qs.exams();
	private destroyRef = inject(DestroyRef);
	@ViewChild('studentsList', { static: false })
	studentsList?: MatSelectionList;

	constructor(
		private fb: FormBuilder,
		private qs: QualificationsService,
		public dialogRef: MatDialogRef<MultipleMarkingSetterComponent>
	) {
		this.listeningWorkElection();
	}

	public closeDialog(reloadData = false): void {
		this.dialogRef.close(reloadData);
	}

	private listeningWorkElection() {
		this.workControl.valueChanges
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(value => {
				value === Work.TASK
					? (this.works = this.tasks as Task[] & Exam[])
					: (this.works = this.exams as Task[] & Exam[]);
			});
	}

	private setPayload() {
		let markingsArray = this.studentsList?._value?.map(studentId => ({
			studentId,
			markingId: this.markingsForm.get('marking')?.value,
			observation: this.markingsForm.get('observation')?.value,
		}));

		if (this.workControl.value === Work.TASK) {
			return { studentToTask: markingsArray };
		}

		markingsArray = markingsArray?.map(relation => {
			const examRelation = {
				...relation,
				marking: relation.markingId,
			};

			delete examRelation.markingId;

			return examRelation;
		});

		return { studentToExam: markingsArray };
	}

	public setMarkings() {
		const workId = this.markingsForm.get('workId')
			?.value as unknown as number;
		const payload = this.setPayload();

		this.saveButtonMessage.set(ButtonState.SAVING);
		this.qs.update(
			{ workId, ...payload } as unknown as UpdatePayload,
			this.dialogRef
		);
	}
}
