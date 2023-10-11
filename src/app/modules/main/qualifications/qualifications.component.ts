import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	HostListener,
	OnDestroy,
	OnInit,
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
import { ViewService } from '../../../core/services/view/view.service';
import { ScreenType } from '../../../core/enums/screen-type.enum';
import { ResetFiltersType } from '../../../core/interfaces/reset-filters.type';

@Component({
	selector: 'app-qualifications',
	templateUrl: './qualifications.component.html',
	styleUrls: ['./qualifications.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QualificationsComponent implements OnInit, OnDestroy {
	public screenType = this.vs.screenType;
	public ScreenTypeEnum = ScreenType;
	public tasks: Signal<Task[]> = this.qs.tasks;
	public exams: Signal<Exam[]> = this.qs.exams;
	public students: Signal<Student[]> = this.qs.students;
	public filteredData$ = this.qs.filteredData$;
	public WorkEnum = Work;
	public taskMatchSomeFilter = computed(() =>
		this.tasks().some(task => task.show)
	);
	public examMatchSomeFilter = computed(() =>
		this.exams().some(exam => exam.show)
	);
	public onlyOneTaskMatch = computed(
		() => this.tasks().filter(task => task.show).length === 1
	);
	public onlyOneExamMatch = computed(
		() => this.exams().filter(exam => exam.show).length === 1
	);
	public noStudentShowingForMobile = this.qs.noStudentShowingForMobile;
	public letterSelected = this.qs.letterSelected;
	public courseIsSelected = this.qs.selectedCourseId;
	public selectedTab = signal(0);
	public selectedSubjectId = this.qs.selectedSubjectId;
	public studentIsSelected = this.qs.studentIsSelected;
	public trackItems = this.qs.trackItems;
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
	@HostListener('window:resize', ['$event'])
	onResize(): void {
		this.vs.setScreenType();
	}

	constructor(
		private qs: QualificationsService,
		public dialog: MatDialog,
		private vs: ViewService
	) {}

	ngOnInit(): void {
		this.vs.setScreenType();
	}

	ngOnDestroy(): void {
		this.qs.restartQualificationsService();
	}

	public openCreateDialog(): void {
		const matConfig =
			this.vs.screenType() === ScreenType.MOBILE
				? { width: '100vw', height: '100vh', maxWidth: '100vw' }
				: {};
		const dialogRef = this.dialog.open(CreateDialogComponent, matConfig);

		dialogRef
			.afterClosed()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(reloadData => {
				if (reloadData) {
					const queryParams = {
						courseId: this.qs.selectedCourseId(),
					};

					this.changeToCorrectTab();
					this.resetFilters();
					this.qs.getTasksExamsAndStudents(queryParams, queryParams);
				}
			});
	}

	private changeToCorrectTab() {
		if (this.selectedWorkType() === Work.TASK) this.selectedTab.set(0);
		if (this.selectedWorkType() === Work.EXAM) this.selectedTab.set(1);
	}

	private resetFilters(reset: ResetFiltersType = 'All') {
		this.qs.resetFilters.next(reset);
	}

	public openMultipleMarkingSetterDialog() {
		const matConfig =
			this.vs.screenType() === ScreenType.MOBILE
				? { width: '100vw', height: '100vh', maxWidth: '100vw' }
				: {};
		const dialogRef = this.dialog.open(
			MultipleMarkingSetterComponent,
			matConfig
		);

		dialogRef
			.afterClosed()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(reloadData => {
				if (reloadData) {
					const queryParams = {
						courseId: this.qs.selectedCourseId(),
					};
					this.qs.getTasksExamsAndStudents(queryParams, queryParams);
				}
			});
	}

	public onScrollToTop(): void {
		this.viewport.scrollToPosition([0, 0]);
	}

	public selectWorkType(taskTab: number) {
		taskTab
			? this.qs.selectedWorkType.set(Work.EXAM)
			: this.qs.selectedWorkType.set(Work.TASK);
	}
}
