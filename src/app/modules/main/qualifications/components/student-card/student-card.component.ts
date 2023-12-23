import {
	ChangeDetectionStrategy,
	Component,
	Input,
	Signal,
	computed,
	signal,
} from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { Student } from '../../../../../core/interfaces/student.interface';
import { ScreenType } from '../../../../../core/enums/screen-type.enum';
import { QualificationsService } from '../../../../../core/services/qualifications/qualifications.service';
import { Work } from '../../../../../core/enums/work.enum';
import { Task } from '../../../../../core/interfaces/task.interface';
import { Exam } from '../../../../../core/interfaces/exam.interface';
import { ViewService } from '../../../../../core/services/view/view.service';
import { WorkCardComponent } from '../work-card/work-card.component';

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
	public WorkEnum = Work;
	public selectedTab = signal(0);
	private selectedWorkType = this.qs.selectedWorkType;
	public tasks: Signal<Task[]> = this.qs.tasks;
	public exams: Signal<Exam[]> = this.qs.exams;
	public selectedSubjectId = this.qs.selectedSubjectId;
	public taskMatchSomeFilter = computed(() =>
		this.tasks().some(task => task.show)
	);
	public onlyOneTaskMatch = computed(
		() => this.tasks().filter(task => task.show).length === 1
	);
	public examMatchSomeFilter = computed(() =>
		this.exams().some(exam => exam.show)
	);
	public onlyOneExamMatch = computed(
		() => this.exams().filter(exam => exam.show).length === 1
	);
	@Input() student: Student | null = null;

	constructor(private qs: QualificationsService, private vs: ViewService) {}

	public changeToCorrectTab() {
		if (this.selectedWorkType() === Work.TASK) this.selectedTab.set(0);
		if (this.selectedWorkType() === Work.EXAM) this.selectedTab.set(1);
	}

	public selectWorkType(taskTab: number) {
		taskTab
			? this.qs.selectedWorkType.set(Work.EXAM)
			: this.qs.selectedWorkType.set(Work.TASK);
	}
}
