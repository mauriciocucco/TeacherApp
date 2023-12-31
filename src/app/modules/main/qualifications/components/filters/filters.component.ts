import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	HostListener,
	OnInit,
	Signal,
	ViewChild,
	WritableSignal,
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
import { Work } from '../../../../../core/enums/work.enum';
import { Course } from '../../../../../core/interfaces/course.interface';
import { Marking } from '../../../../../core/interfaces/marking.interface';
import { Subject as SchoolSubject } from '../../../../../core/interfaces/subject.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormFilters } from '../../interfaces/form-filters.interface';
import { Quarter } from '../../../../../core/interfaces/quarter.interface';
import { WorkUnion } from '../../../../../core/interfaces/work-union.interface';

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
	public tasks: WritableSignal<WorkUnion[]> = this.qs.tasks;
	public exams: WritableSignal<WorkUnion[]> = this.qs.exams;
	public openFiltersMenu = signal(false);
	public filtersForm = this.fb.nonNullable.group({
		student: [{ value: '', disabled: true }],
		task: [{ value: '', disabled: true }],
		exam: [{ value: '', disabled: true }],
		subject: [{ value: 0, disabled: true }],
		course: 0,
		quarter: [{ value: this.selectActualQuarter(), disabled: true }],
	});
	public WorkEnum = Work;
	public screenType = this.vs.screenType;
	public ScreenTypeEnum = ScreenType;
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
	) {}

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
					this.filtersForm.get('student')?.value
				) {
					this.filtersForm
						.get('student')
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
						filters.course &&
						filters.course !== this.qs.selectedCourseId()
					) {
						this.resetForm();
						filters.subject = 0; // Porque el emitEvent del reset está en false
						this.enableControls();
					}

					this.qs.setFilters({
						...filters,
						quarter: this.filtersForm.get('quarter')?.value,
					} as FormFilters);
				}),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe();
	}

	private enableControls() {
		if (this.filtersForm.get('subject')?.enabled) return;

		this.filtersForm.enable({ emitEvent: false });
	}

	public clearControl(control: ControlType) {
		switch (control) {
			case 'Tasks':
				this.filtersForm.get('task')?.setValue('');
				this.qs.cleanShow(this.tasks);
				break;
			case 'Students':
				this.filtersForm.get('student')?.setValue('');
				this.cleanSelectedLetter();
				this.qs.cleanShow(this.students);
				break;
			default:
				this.filtersForm.get('exam')?.setValue('');
				this.qs.cleanShow(this.exams);
				break;
		}
	}

	public resetForm() {
		this.filtersForm.patchValue(
			{
				course: this.filtersForm.get('course')?.value,
				subject: 0,
				student: '',
				task: '',
				exam: '',
				quarter: this.selectActualQuarter(),
			},
			{ emitEvent: false }
		);
	}

	public studentSelected(option: MatAutocompleteSelectedEvent) {
		this.cleanSelectedLetter();
		this.qs.showSelectedStudent(option);
	}

	public taskOrExamSelected(option: MatAutocompleteSelectedEvent) {
		this.qs.showSelectedTaskOrExam(option);
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
