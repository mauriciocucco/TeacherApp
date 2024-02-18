import {
	ChangeDetectionStrategy,
	Component,
	WritableSignal,
	computed,
	effect,
	input,
	signal,
} from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { Student } from '../../../../../core/interfaces/student.interface';
import { ScreenType } from '../../../../../core/enums/screen-type.enum';
import { QualificationsService } from '../../../../../core/services/qualifications/qualifications.service';
import { WorkTypeId } from '../../../../../core/enums/work-type-id.enum';
import { ViewService } from '../../../../../core/services/view/view.service';
import { WorkCardComponent } from '../work-card/work-card.component';
import { StudentToWork } from '../../../../../core/interfaces/student-to-work.interface';

@Component({
	selector: 'app-student-card',
	standalone: true,
	imports: [SharedModule, WorkCardComponent],
	templateUrl: './student-card.component.html',
	styleUrl: './student-card.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentCardComponent {
	public screenType = this.vs.screenType;
	public ScreenTypeEnum = ScreenType;
	public selectedTab = signal(0);
	public studentToTasks: WritableSignal<StudentToWork[]> = signal([]);
	public studentToExams: WritableSignal<StudentToWork[]> = signal([]);
	public selectedSubjectId = this.qs.selectedSubjectId;
	public taskMatchSomeFilter = computed(() =>
		this.studentToTasks()?.some(task => task.show)
	);
	public onlyOneTaskMatch = computed(
		() => this.studentToTasks()?.filter(task => task.show).length === 1
	);
	public examMatchSomeFilter = computed(() =>
		this.studentToExams()?.some(exam => exam.show)
	);
	public onlyOneExamMatch = computed(
		() => this.studentToExams()?.filter(exam => exam.show).length === 1
	);
	public student = input<Student>();

	constructor(private qs: QualificationsService, private vs: ViewService) {
		this.studentChange();
	}

	private studentChange() {
		effect(
			() => {
				if (!this.student()) return;

				this.updateStudentToWork(
					WorkTypeId.TASK,
					this.studentToTasks.update
				);
				this.updateStudentToWork(
					WorkTypeId.EXAM,
					this.studentToExams.update
				);
			},
			{
				allowSignalWrites: true,
			}
		);
	}

	private updateStudentToWork(
		workTypeId: number,
		updater: (value: () => StudentToWork[]) => void
	) {
		updater(() => {
			const filteredStudentToWork = this.student()?.studentToWork?.filter(
				studentToWork => studentToWork.work.workTypeId === workTypeId
			);

			if (!filteredStudentToWork?.length) return [];

			return filteredStudentToWork.sort(
				(a, b) =>
					new Date(b.work.date).getTime() -
					new Date(a.work.date).getTime()
			);
		});
	}

	public selectWorkType(taskTab: number) {
		taskTab
			? this.qs.selectedWorkType.set(WorkTypeId.EXAM)
			: this.qs.selectedWorkType.set(WorkTypeId.TASK);
	}
}
