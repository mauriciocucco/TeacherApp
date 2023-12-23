import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	HostListener,
	Inject,
	OnDestroy,
	OnInit,
	QueryList,
	Signal,
	ViewChild,
	ViewChildren,
	inject,
} from '@angular/core';
import { Observable, fromEvent, map } from 'rxjs';
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
import { StudentCardComponent } from './components/student-card/student-card.component';

@Component({
	selector: 'app-qualifications',
	templateUrl: './qualifications.component.html',
	styleUrls: ['./qualifications.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QualificationsComponent implements OnInit, OnDestroy {
	public screenType = this.vs.screenType;
	public ScreenTypeEnum = ScreenType;
	public students: Signal<Student[]> = this.qs.students;
	public filteredData$ = this.qs.filteredData$;
	public WorkEnum = Work;
	public noStudentShowingForMobile = this.qs.noStudentShowingForMobile;
	public letterSelected = this.qs.letterSelected;
	public courseIsSelected = this.qs.selectedCourseId;
	public studentIsSelected = this.qs.studentIsSelected;
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
	@ViewChild('studentCard') studentCard!: StudentCardComponent;
	@ViewChildren('tabChildren') tabChildren?: QueryList<MatTabGroup>;
	@HostListener('window:resize', ['$event'])
	onResize(): void {
		this.vs.setScreenType();
	}

	constructor(
		private qs: QualificationsService,
		@Inject(MatDialog) public dialog: MatDialog,
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
					this.studentCard.changeToCorrectTab();
					this.resetFilters();
				}
			});
	}

	private resetFilters(reset: ResetFiltersType = 'All') {
		this.qs.resetFilters.next(reset);
	}

	public openMultipleMarkingSetterDialog() {
		const matConfig =
			this.vs.screenType() === ScreenType.MOBILE
				? { width: '100vw', height: '100vh', maxWidth: '100vw' }
				: {};

		this.dialog.open(MultipleMarkingSetterComponent, matConfig);
	}

	public onScrollToTop(): void {
		this.viewport.scrollToPosition([0, 0]);
	}
}
