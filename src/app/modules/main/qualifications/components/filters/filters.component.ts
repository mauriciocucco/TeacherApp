import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	HostListener,
	OnInit,
	Signal,
	ViewChild,
	WritableSignal,
	effect,
	inject,
	signal,
} from '@angular/core';
import { Student } from '../../../../../core/interfaces/student.interface';
import { QualificationsService } from '../../../../../core/services/qualifications/qualifications.service';
import { ControlType } from '../create-dialog/interfaces/control-type.interface';
import { FormBuilder } from '@angular/forms';
import { ViewService } from '../../../../../core/services/view/view.service';
import { ScreenType } from '../../../../../core/enums/screen-type.enum';
import { tap } from 'rxjs';
import {
	MatAutocomplete,
	MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { Course } from '../../../../../core/interfaces/course.interface';
import { Marking } from '../../../../../core/interfaces/marking.interface';
import { Subject as SchoolSubject } from '../../../../../core/interfaces/subject.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormFilters } from '../../interfaces/form-filters.interface';
import { Quarter } from '../../../../../core/interfaces/quarter.interface';
import { WorkTypeId } from '../../../../../core/enums/work-type-id.enum';

@Component({
	selector: 'app-filters',
	templateUrl: './filters.component.html',
	styleUrls: ['./filters.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltersComponent implements OnInit {
	public students: WritableSignal<Student[]> = this.qs.students;
	public subjects: Signal<SchoolSubject[]> = this.qs.subjects;
	public courses: Signal<Course[]> = this.qs.courses;
	public quarters: Signal<Quarter[]> = this.qs.quarters;
	public markings: Signal<Marking[]> = this.qs.markings;
	public tasks = this.qs.tasks;
	public exams = this.qs.exams;
	public openFiltersMenu = signal(false);
	public filtersForm = this.fb.nonNullable.group({
		studentName: [{ value: '', disabled: true }],
		taskName: [{ value: '', disabled: true }],
		examName: [{ value: '', disabled: true }],
		subjectId: [{ value: 0, disabled: true }],
		courseId: 0,
		quarterId: [{ value: this.selectActualQuarter(), disabled: true }],
	});
	public screenType = this.vs.screenType;
	public ScreenTypeEnum = ScreenType;
	public workTypeId = WorkTypeId;
	private works = this.qs.works;
	private destroyRef = inject(DestroyRef);
	@ViewChild('studentsAutocomplete', { static: false })
	studentsAutocomplete?: MatAutocomplete;
	@ViewChild('tasksAutocomplete', { static: false })
	tasksAutocomplete?: MatAutocomplete;
	@ViewChild('examsAutocomplete', { static: false })
	examsAutocomplete?: MatAutocomplete;
	@HostListener('window:resize', ['$event'])
	onResize(): void {
		this.vs.setScreenType();
	}

	constructor(
		private qs: QualificationsService,
		private fb: FormBuilder,
		private vs: ViewService
	) {
		this.enableControlsEffect();
	}

	ngOnInit(): void {
		this.vs.setScreenType();
		this.listenForFormChanges();
		this.listenForResetFilters();
	}

	private listenForResetFilters() {
		this.qs.resetFilters$
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(reset => {
				if (!reset) return;

				if (
					reset === 'Students' &&
					this.filtersForm.get('studentName')?.value
				) {
					this.filtersForm
						.get('studentName')
						?.setValue('', { emitEvent: false });
				}

				if (reset === 'All') {
					this.resetForm();
					this.qs.setFilters(this.filtersForm.value as FormFilters);
				}

				this.qs.resetFilters.next('');
			});
	}

	private listenForFormChanges() {
		this.filtersForm.valueChanges
			.pipe(
				tap(filters => {
					if (
						filters.courseId &&
						filters.courseId !== this.qs.selectedCourseId()
					) {
						this.resetForm();
						filters.subjectId = 0; // Porque el emitEvent del reset está en false
					}

					this.qs.setFilters({
						...filters,
						quarterId:
							this.filtersForm.get('quarter')?.value ??
							this.selectActualQuarter(),
					});
				}),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe();
	}

	private enableControlsEffect() {
		effect(() => {
			if (!this.works().length) return;

			this.enableControls();
		});
	}

	private enableControls() {
		if (this.filtersForm.get('subject')?.enabled) return;

		if (!this.works().length) {
			this.filtersForm.get('studentName')?.enable({ emitEvent: false });
			return this.filtersForm
				.get('quarterId')
				?.enable({ emitEvent: false });
		}

		this.filtersForm.enable({ emitEvent: false });

		if (!this.tasks().length) {
			this.filtersForm.get('taskName')?.disable({ emitEvent: false });
		}

		if (!this.exams().length) {
			this.filtersForm.get('examName')?.disable({ emitEvent: false });
		}
	}

	public clearControl(control: ControlType) {
		switch (control) {
			case 'Tasks':
				this.filtersForm.get('taskName')?.setValue('');
				this.qs.cleanWorksShowProp(this.workTypeId.TASK);
				break;
			case 'Students':
				this.filtersForm.get('studentName')?.setValue('');
				this.cleanSelectedLetter();
				this.qs.cleanStudentsShowProp();
				break;
			default:
				this.filtersForm.get('examName')?.setValue('');
				this.qs.cleanWorksShowProp(this.workTypeId.EXAM);
				break;
		}
	}

	public resetForm() {
		this.filtersForm.patchValue(
			{
				courseId: this.filtersForm.get('courseId')?.value ?? 0,
				subjectId: 0,
				studentName: '',
				taskName: '',
				examName: '',
				quarterId: this.selectActualQuarter(),
			},
			{ emitEvent: false }
		);
	}

	public studentSelected(option: MatAutocompleteSelectedEvent) {
		this.cleanSelectedLetter();
		this.qs.showSelectedStudent(option);
	}

	public workSelected(
		option: MatAutocompleteSelectedEvent,
		workTypeId: WorkTypeId
	) {
		this.qs.showSelectedWork(option, workTypeId);
	}

	public toggleFiltersMenu(open: null | boolean = null) {
		if (this.screenType() === ScreenType.DESKTOP) return;

		this.openFiltersMenu.set(open ?? !this.openFiltersMenu());
	}

	public cleanSelectedLetter() {
		this.qs.cleanAlphabet.next(true);
	}

	private selectActualQuarter() {
		const currentDate = new Date();
		let quarterId = 0;

		for (const quarter of this.quarters()) {
			if (currentDate >= quarter.start && currentDate <= quarter.end) {
				return (quarterId = quarter.id);
			}
		}

		return quarterId;
	}
}
