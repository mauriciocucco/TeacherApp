import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	OnDestroy,
	QueryList,
	Signal,
	ViewChildren,
	computed,
	inject,
	signal,
} from '@angular/core';
import { Observable, fromEvent, map } from 'rxjs';
import { Task } from '../../../core/interfaces/task.interface';
import { Exam } from '../../../core/interfaces/exam.interface';
import { Student } from '../../../core/interfaces/student.interface';
import { MatTabGroup } from '@angular/material/tabs';
import { Work } from '../../../core/enums/work.enum';
import { QualificationsService } from '../../../core/services/qualifications/qualifications.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { DOCUMENT, ViewportScroller } from '@angular/common';
import { MultipleMarkingSetterComponent } from './components/multiple-marking-setter/multiple-marking-setter.component';
import { CreateDialogComponent } from './components/create-dialog/create-dialog.component';
import { Marking } from '../../../core/interfaces/marking.interface';

@Component({
	selector: 'app-qualifications',
	templateUrl: './qualifications.component.html',
	styleUrls: ['./qualifications.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QualificationsComponent implements OnDestroy {
	public tasks: Signal<Task[]> = this.qs.tasks;
	public exams: Signal<Exam[]> = this.qs.exams;
	public students: Signal<Student[] | undefined> = this.qs.students;
	public markings: Signal<Marking[]> = this.qs.markings;
	public tasksExamsAndStudents$ = this.qs.tasksExamsAndStudents$;
	public WorkEnum = Work;
	public spinnerProgressOn = this.qs.spinnerProgressOn;
	public taskMatchSomeFilter = computed(() =>
		this.tasks().some(task => task.show)
	);
	public examMatchSomeFilter = computed(() =>
		this.exams().some(exam => exam.show)
	);
	public editMode = signal(false);
	public defaultRowsNumber = signal(5);
	public selectedTab = signal(0);
	public selectedStudent = this.qs.selectedStudent;
	private selectedWorkType = this.qs.selectedWorkType;
	private destroyRef = inject(DestroyRef);
	private readonly document = inject(DOCUMENT);
	private readonly viewport = inject(ViewportScroller);
	public readonly showScroll$: Observable<boolean> = fromEvent(
		this.document,
		'scroll'
	).pipe(
		map(() => this.viewport.getScrollPosition()?.[1] > 0), // chequea que el usuario scrolee hacia abajo
		takeUntilDestroyed(this.destroyRef)
	);
	@ViewChildren('tabChildren') tabChildren?: QueryList<MatTabGroup>;

	constructor(private qs: QualificationsService, public dialog: MatDialog) {}

	ngOnDestroy(): void {
		this.cleanSignals();
	}

	public openCreateDialog(): void {
		const courseId = this.qs.selectedCourseId();
		const dialogRef = this.dialog.open(CreateDialogComponent, {
			data: { course: courseId },
		});

		dialogRef
			.afterClosed()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(reloadData => {
				if (reloadData) {
					const queryParams = {
						courseId,
					};
					this.changeToCorrectTab();
					this.qs.getTasksExamsAndStudents(queryParams);
				}
			});
	}

	private changeToCorrectTab() {
		if (this.selectedWorkType() === Work.TASK) this.selectedTab.set(0);
		if (this.selectedWorkType() === Work.EXAM) this.selectedTab.set(1);

		this.qs.resetFilters.next(true);
	}

	public openMultipleMarkingSetterDialog() {
		const dialogRef = this.dialog.open(MultipleMarkingSetterComponent, {
			data: {
				students: this.students(),
				markings: this.markings(),
				tasks: this.tasks(),
				exams: this.exams(),
			},
		});

		dialogRef
			.afterClosed()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(reloadData => {
				if (reloadData) {
					const queryParams = {
						courseId: this.qs.selectedCourseId(),
					};
					this.qs.getTasksExamsAndStudents(queryParams);
				}
			});
	}

	public onScrollToTop(): void {
		this.viewport.scrollToPosition([0, 0]);
	}

	public trackItems(index: number, item: any): number {
		return item.id;
	}

	private cleanSignals() {
		this.qs.students.set(undefined);
		this.qs.tasks.set([]);
		this.qs.exams.set([]);
		this.qs.tasksExamsAndStudentsSubject.next([null, null]);
	}
}
