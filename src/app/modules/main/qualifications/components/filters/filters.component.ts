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
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ViewService } from '../../../../../core/services/view/view.service';
import { StudentsParams } from '../../interfaces/students-params.interface';
import { ScreenType } from '../../../../../core/enums/screen-type.enum';
import { TasksAndExamsQueryParams } from '../../interfaces/tasks-and-exams-query-params.interface';
import { debounce, distinctUntilChanged, filter, tap, timer } from 'rxjs';
import { DateRange } from '../../interfaces/range-date.interface';
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

@Component({
	selector: 'app-filters',
	templateUrl: './filters.component.html',
	styleUrls: ['./filters.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltersComponent implements OnInit {
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
	public selectedStudent = this.qs.selectedStudent;
	private studentsQueryParams: StudentsParams | null = null;
	private taskAndExamsQueryParams: TasksAndExamsQueryParams | null = null;
	private deselectedOption = '*';
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
		this.enableFormWhenCourseIsSelected();
	}

	ngOnInit(): void {
		this.listenCourseFilterChanges();
		this.listenResetFilters();
		this.vs.setScreenType();
	}

	private startToListenFiltersChanges() {
		this.listenSubjectFilterChanges();
		this.listenDatesRange();
		this.listenTasksFilterChanges();
		this.listenExamsFilterChanges();
		this.listenStudentsFilterChanges();
	}

	private listenResetFilters() {
		this.qs.resetFilters$
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(reset => {
				if (reset) this.resetForm(true);
			});
	}

	private listenSubjectFilterChanges() {
		this.filtersForm
			.get('subject')
			?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(subject => {
				this.qs.filterTasksAndExamsBySubject(subject);
				this.qs.selectedSubjectIdFilter.set(subject); //necesito setear el filtro por materia en el servicio

				if (this.screenType() === ScreenType.MOBILE)
					this.toggleFiltersMenu(false);
			});
	}

	private listenCourseFilterChanges() {
		this.filtersForm
			.get('course')
			?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(course => {
				const queryParam = { courseId: course };

				this.studentsQueryParams = queryParam;
				this.taskAndExamsQueryParams = queryParam;

				if (this.screenType() === ScreenType.MOBILE)
					this.toggleFiltersMenu(false);

				this.qs.selectedCourseId.set(course);
				this.qs.selectedSubjectIdFilter.set(0);
				this.qs.getTasksExamsAndStudents(
					this.taskAndExamsQueryParams,
					this.studentsQueryParams
				);
				this.resetForm();
			});
	}

	private listenDatesRange() {
		this.filtersForm
			.get('dateRange')
			?.valueChanges.pipe(
				filter<DateRange>(({ start, end }) =>
					start && end ? true : false
				),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(({ start, end }) => {
				this.taskAndExamsQueryParams = {
					...this.taskAndExamsQueryParams,
					startDate: start?.getTime(),
					endDate: end?.getTime(),
				};

				if (this.screenType() === ScreenType.MOBILE)
					this.toggleFiltersMenu(false);

				this.getNewTasksAndExams();
			});
	}

	private getNewTasksAndExams(
		queryParams: TasksAndExamsQueryParams | null = null
	) {
		this.qs.getTasksExamsAndStudents(
			queryParams ? queryParams : this.taskAndExamsQueryParams
		);
	}

	private listenStudentsFilterChanges() {
		this.qs
			.processValueChanges(
				this.filtersForm.get('student')?.valueChanges.pipe(
					tap(value => {
						if (!value) {
							this.qs.cleanShow(
								this.students as WritableSignal<Student[]>
							);
						}
					}),
					debounce(value => (value ? timer(500) : timer(0))),
					distinctUntilChanged(),
					filter(value => this.filterByDeselectedOption(value)),
					tap(value =>
						this.cleanSelectedAutocompleteOption(
							value,
							this.studentsAutocomplete,
							'student'
						)
					)
				)
			)
			?.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe();
	}

	private listenTasksFilterChanges() {
		this.qs
			.processValueChanges(
				this.filtersForm.get('task')?.valueChanges.pipe(
					tap(value => {
						if (!value)
							this.qs.cleanShow(
								this.tasks as WritableSignal<Task[]>
							);
					}),
					debounce(value => (value ? timer(500) : timer(0))),
					distinctUntilChanged(),
					filter(value => this.filterByDeselectedOption(value)),
					tap(value =>
						this.cleanSelectedAutocompleteOption(
							value,
							this.tasksAutocomplete,
							'task'
						)
					)
				),
				'Tasks'
			)
			?.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe();
	}

	private listenExamsFilterChanges() {
		this.qs
			.processValueChanges(
				this.filtersForm.get('exam')?.valueChanges.pipe(
					tap(value => {
						if (!value)
							this.qs.cleanShow(
								this.exams as WritableSignal<Exam[]>
							);
					}),
					debounce(value => (value ? timer(500) : timer(0))),
					distinctUntilChanged(),
					filter(value => this.filterByDeselectedOption(value)),
					tap(value =>
						this.cleanSelectedAutocompleteOption(
							value,
							this.examsAutocomplete,
							'exam'
						)
					)
				),
				'Exams'
			)
			?.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe();
	}

	// esto sirve para que cuando se limpie el autocomplete también se limpie cualquier opción ya seleccionada previamente
	private cleanSelectedAutocompleteOption(
		value: string,
		autocomplete: MatAutocomplete | undefined,
		controlName: string
	) {
		if (!value) {
			autocomplete?.options.forEach(option => {
				if (option.selected) {
					this.deselectedOption = option.value;
					option.deselect();
					this.filtersForm.get(controlName)?.patchValue('', {
						//esto es porque al hacer el deselect se selecciona de vuelta
						emitEvent: false,
					});
				}
			});
		}
	}

	private enableControls() {
		this.filtersForm.enable({ emitEvent: false });
	}

	public resetDateRange() {
		this.filtersForm.get('dateRange')?.reset();
		this.cleanDateQueryParams();
		this.getNewTasksAndExams();
		if (this.screenType() === ScreenType.MOBILE)
			this.toggleFiltersMenu(false);
	}

	private enableFormWhenCourseIsSelected() {
		toObservable(this.students) //puede ser students, exams o tasks ya que se setean al mismo tiempo
			.pipe(
				filter(students =>
					students
						? students.length > 0 &&
						  (this.filtersForm.get('subject')?.disabled as boolean) //puede ser cualquier control de un filtro que esté disabled
						: false
				),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(() => {
				this.enableControls();
				this.startToListenFiltersChanges();
			});
	}

	private resetForm(emit = false) {
		this.filtersForm.reset(
			{
				subject: 0,
				student: '',
				task: '',
				exam: '',
				course: this.filtersForm.get('course')?.value,
			},
			{ emitEvent: emit }
		);
		this.qs.resetFilters.next(false);
	}

	public studentSelected(option: MatAutocompleteSelectedEvent) {
		if (this.screenType() === ScreenType.MOBILE)
			this.toggleFiltersMenu(false);

		if (this.deselectedOption === option.option.value) return; // esto es por que al hacer el deselect() llama al click

		this.qs.showSelectedStudent(option);
	}

	public taskOrExamSelected(
		option: MatAutocompleteSelectedEvent,
		type = Work.TASK
	) {
		if (this.screenType() === ScreenType.MOBILE)
			this.toggleFiltersMenu(false);

		if (this.deselectedOption === option.option.value) return;

		this.qs.showSelectedTaskOrExam(option, type);
	}

	private filterByDeselectedOption(value: string): boolean {
		if (this.deselectedOption === value) {
			this.deselectedOption = '*';
			return false;
		}
		return true;
	}

	private cleanDateQueryParams() {
		delete this.taskAndExamsQueryParams?.startDate;
		delete this.taskAndExamsQueryParams?.endDate;
	}

	public toggleFiltersMenu(open: null | boolean = null) {
		this.openFiltersMenu.set(open ?? !this.openFiltersMenu());
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

	public trackItems(index: number, item: any): number {
		return item.id;
	}
}
