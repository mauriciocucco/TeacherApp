import {
	Component,
	Inject,
	signal,
	inject,
	DestroyRef,
	ViewChild,
	ChangeDetectionStrategy,
} from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Student } from '../../../../../core/interfaces/student.interface';
import { ButtonState } from '../../enums/button-state.enum';
import { Work } from '../../../../../core/enums/work.enum';
import { Marking } from '../../../../../core/interfaces/marking.interface';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MultipleMarkingPayload } from './interfaces/multiple-marking-payload.interface';
import { MatSelectionList } from '@angular/material/list';
import { TasksService } from '../../../../../core/services/tasks/tasks.service';
import { ExamsService } from '../../../../../core/services/exams/exams.service';
import { Observable, of } from 'rxjs';
import { Task } from '../../../../../core/interfaces/task.interface';
import { Exam } from '../../../../../core/interfaces/exam.interface';
import { UpdateTask } from '../../../../../core/interfaces/update-task.interface';
import { UpdateExam } from '../../../../../core/interfaces/update-exam.interface';
import { QualificationsService } from '../../../../../core/services/qualifications/qualifications.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
	selector: 'app-multiple-marking-setter',
	standalone: true,
	imports: [SharedModule],
	templateUrl: './multiple-marking-setter.component.html',
	styleUrls: ['./multiple-marking-setter.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultipleMarkingSetterComponent {
	public students: Student[] = [];
	public saveButtonMessage = signal(ButtonState.RATE);
	public workEnum = Work;
	public works: Task[] = []; //si pongo Task[] | Exam[] falla en el html
	public markings: Marking[] = [];
	public workControl: FormControl<Work | null> = new FormControl(null);
	private destroyRef = inject(DestroyRef);
	private fb = inject(FormBuilder);
	private ts = inject(TasksService);
	private es = inject(ExamsService);
	private qs = inject(QualificationsService);
	public markingsForm = this.fb.group({
		workId: ['', Validators.required],
		marking: ['', Validators.required],
		observation: [''],
	});
	@ViewChild('studentsList', { static: false })
	studentsList?: MatSelectionList;

	constructor(
		public dialogRef: MatDialogRef<MultipleMarkingSetterComponent>,
		@Inject(MAT_DIALOG_DATA) public payload: MultipleMarkingPayload
	) {
		this.setInitialData();
		this.listeningWorkElection();
	}

	public closeDialog(reloadData = false): void {
		this.dialogRef.close(reloadData);
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

	private cleanForm() {
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

	public sendForm() {
		const workId = this.markingsForm.get('workId')
			?.value as unknown as number;
		const cleanForm = this.cleanForm();
		let update$: Observable<Task | Exam | undefined> = of(undefined);

		this.saveButtonMessage.set(ButtonState.SAVING);
		this.workControl.value === Work.TASK
			? (update$ = this.ts.updateTask(cleanForm as UpdateTask, workId))
			: (update$ = this.es.updateExam(cleanForm as UpdateExam, workId));

		update$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: () => {
				this.qs.handleHttpResponseMessage('La edición fue exitosa.');
				this.closeDialog(true);
			},
			error: (error: HttpErrorResponse) => {
				this.qs.handleHttpResponseMessage(error.error?.message);
				this.closeDialog();
			},
		});
	}
}
