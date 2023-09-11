import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	HostListener,
	Input,
	OnChanges,
	OnInit,
	Signal,
	SimpleChanges,
	ViewChild,
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
import { Task } from '../../../../../core/interfaces/task.interface';
import { Exam } from '../../../../../core/interfaces/exam.interface';
import {
	MatAutocomplete,
	MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { Work } from '../../../../../core/enums/work.enum';
import { Course } from '../../../../../core/interfaces/course.interface';
import { Marking } from '../../../../../core/interfaces/marking.interface';
import { Subject as SchoolSubject } from '../../../../../core/interfaces/subject.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
	selector: 'app-filters',
	templateUrl: './filters.component.html',
	styleUrls: ['./filters.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltersComponent implements OnInit, OnChanges {
	public students: Signal<Student[] | undefined> = this.qs.students;
	public subjects: Signal<SchoolSubject[]> = this.qs.subjects;
	public courses: Signal<Course[]> = this.qs.courses;
	public markings: Signal<Marking[]> = this.qs.markings;
	public tasks: Signal<Task[]> = this.qs.tasks;
	public exams: Signal<Exam[]> = this.qs.exams;
	public openFiltersMenu = signal(false);
	public filtersForm = this.fb.nonNullable.group({
		student: [{ value: '', disabled: true }],
		task: [{ value: '', disabled: true }],
		exam: [{ value: '', disabled: true }],
		subject: [{ value: 0, disabled: true }],
		course: 0,
		dateRange: this.fb.group({
			start: { value: null, disabled: true },
			end: { value: null, disabled: true },
		}),
	});
	public WorkEnum = Work;
	public screenType = this.vs.screenType;
	public ScreenTypeEnum = ScreenType;
	private emittedFormData = {};
	private destroyRef = inject(DestroyRef);
	@Input() resetFilters = { reset: false };
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
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['resetFilters']?.currentValue?.reset) this.resetForm();
	}

	private listenForFormChanges() {
		this.filtersForm.valueChanges
			.pipe(
				tap(filters => {
					const { course } = filters;

					if (
						JSON.stringify(filters) ===
						JSON.stringify(this.emittedFormData)
					)
						return; // Para que no se vuelva a emitir lo que ya se emitió previamente

					this.emittedFormData = filters;

					if (course && course !== this.qs.selectedCourseId()) {
						this.resetForm();
						filters.subject = 0; // Porque el emitEvent del reset está en false
						this.enableControls();
					}

					this.qs.setFilters(filters);
				}),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe();
	}

	private enableControls() {
		if (this.filtersForm.get('subject')?.enabled) return;

		this.filtersForm.enable({ emitEvent: false });
	}

	public clearDateRange() {
		this.filtersForm.get('dateRange')?.reset();
		this.toggleFiltersMenu(false);
	}

	public clearControl(control: ControlType) {
		switch (control) {
			case 'Tasks':
				this.filtersForm.get('task')?.setValue('');
				break;
			case 'Students':
				this.filtersForm.get('student')?.setValue('');
				break;
			default:
				this.filtersForm.get('exam')?.setValue('');
				break;
		}

		this.toggleFiltersMenu(false);
	}

	public resetForm() {
		this.filtersForm.patchValue(
			{
				course: this.filtersForm.get('course')?.value,
				subject: 0,
				student: '',
				task: '',
				exam: '',
			},
			{ emitEvent: false }
		);
	}

	public studentSelected(option: MatAutocompleteSelectedEvent) {
		this.toggleFiltersMenu(false);
		this.qs.cleanAlphabet.next(true);
		this.qs.showSelectedStudent(option);
	}

	public taskOrExamSelected(
		option: MatAutocompleteSelectedEvent,
		type = Work.TASK
	) {
		this.toggleFiltersMenu(false);
		this.qs.showSelectedTaskOrExam(option, type);
	}

	public toggleFiltersMenu(open: null | boolean = null) {
		if (this.screenType() === ScreenType.DESKTOP) return;

		this.openFiltersMenu.set(open ?? !this.openFiltersMenu());
	}

	public cleanSelectedLetter() {
		this.qs.cleanAlphabet.next(true);
		this.qs.letterSelected.set(null);
	}

	public trackItems(index: number, item: any): number {
		return item.id;
	}
}
