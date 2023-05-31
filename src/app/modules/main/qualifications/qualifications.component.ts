import {
	Component,
	OnDestroy,
	OnInit,
	QueryList,
	Signal,
	ViewChild,
	ViewChildren,
	WritableSignal,
	effect,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Subject, combineLatest, filter, takeUntil, tap } from 'rxjs';
import { Task } from '../../../core/interfaces/task.interface';
import { Marking } from '../../../core/interfaces/marking.interface';
import { Exam } from '../../../core/interfaces/exam.interface';
import { Student } from '../../../core/interfaces/student.interface';
import { MatTabGroup } from '@angular/material/tabs';
import { Course } from '../../../core/interfaces/course.interface';
import { TasksAndExamsParams } from './interfaces/tasks-and-exams-params.interface';
import { StudentsParams } from './interfaces/students-params.interface';
import { Work } from './enums/work.enum';
import { MatMiniFabButton } from '@angular/material/button';
import { AllWord } from './enums/all-word.enum';
import { QualificationsService } from '../../../core/services/qualifications/qualifications.service';
import { Subject as SchoolSubject } from '../../../core/interfaces/subject.interface';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
	selector: 'app-qualifications',
	templateUrl: './qualifications.component.html',
	styleUrls: ['./qualifications.component.scss'],
})
export class QualificationsComponent implements OnInit, OnDestroy {
	public tasks: Signal<Task[]> = this.qs.tasks;
	public exams: Signal<Exam[]> = this.qs.exams;
	public students: Signal<Student[]> = this.qs.students;
	public subjects: Signal<SchoolSubject[]> = this.qs.subjects;
	public courses: Signal<Course[]> = this.qs.courses;
	public markings: Signal<Marking[]> = this.qs.markings;
	public filteredTasks: WritableSignal<Task[]> = this.qs.filteredTasks;
	public filteredExams: WritableSignal<Exam[]> = this.qs.filteredExams;
	public filteredStudents: WritableSignal<Student[]> =
		this.qs.filteredStudents;
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
	public allWord = AllWord;
	public WorkEnum = Work;
	private taskAndExamsParams: TasksAndExamsParams | null = null;
	private studentsParams: StudentsParams | null = null;
	private destroy: Subject<boolean> = new Subject<boolean>();
	@ViewChildren('tabChildren') tabChildren!: QueryList<MatTabGroup>;
	@ViewChild('clearRangeButton', { static: false })
	clearRangeButton!: MatMiniFabButton;

	constructor(public qs: QualificationsService, private fb: FormBuilder) {
		//  effect() can only be used within an injection context such as a constructor, a factory function, a field initializer, or a function used with `runInInjectionContext`. Find more at https://angular.io/errors/NG0203
		this.scrollToLatestEffect();
		this.enableFormWhenChooseCourse();
		this.subscribeToFilteredObservablesChanges();
	}

	ngOnInit() {
		this.listenCourseChanges();
	}

	ngOnDestroy(): void {
		this.destroy.next(true);
		this.destroy.unsubscribe();
	}

	private listenFiltersChanges() {
		this.listenSubjectChanges();
		this.listenRangeDates();

		this.qs
			.processValueChanges(this.filtersForm.get('student')?.valueChanges)
			?.pipe(takeUntil(this.destroy))
			.subscribe(result =>
				this.filteredStudents.set(result as Student[])
			);

		this.qs
			.processValueChanges(
				this.filtersForm.get('task')?.valueChanges,
				'Tasks'
			)
			?.pipe(takeUntil(this.destroy))
			.subscribe(result => this.filteredTasks.set(result as Task[]));

		this.qs
			.processValueChanges(
				this.filtersForm.get('exam')?.valueChanges,
				'Exams'
			)
			?.pipe(takeUntil(this.destroy))
			.subscribe(result => this.filteredExams.set(result as Exam[]));
	}

	private listenSubjectChanges() {
		this.filtersForm
			.get('subject')
			?.valueChanges.pipe(takeUntil(this.destroy))
			.subscribe(subjectId => {
				this.qs.filterTasksAndExamsBySubject(subjectId);
			});
	}

	private listenCourseChanges() {
		this.filtersForm
			.get('course')
			?.valueChanges.pipe(takeUntil(this.destroy))
			.subscribe(courseId => {
				this.studentsParams = {
					...this.studentsParams,
					courseId,
				};

				this.taskAndExamsParams = {
					...this.taskAndExamsParams,
					courseId,
				};

				this.resetForm();
				this.qs.getStudents(this.studentsParams);
				this.qs.getTasksAndExams(this.taskAndExamsParams);
			});
	}

	private listenRangeDates() {
		this.filtersForm
			.get('dateRange')
			?.valueChanges.pipe(
				filter((value: any) => value.start && value.end),
				takeUntil(this.destroy)
			)
			.subscribe((value: { start: Date; end: Date }) => {
				this.taskAndExamsParams = {
					...this.taskAndExamsParams,
					startDate: value.start.getTime(),
					endDate: value.end.getTime(),
				};

				this.disableRangeClearButton(false);
				this.qs.getTasksAndExams(this.taskAndExamsParams);
			});
	}

	private enableControls() {
		this.filtersForm.enable({ emitEvent: false });
		this.listenFiltersChanges();
	}

	private disableRangeClearButton(disable = true) {
		this.clearRangeButton.disabled = disable;
	}

	public resetDatePeriod() {
		delete this.taskAndExamsParams?.startDate;
		delete this.taskAndExamsParams?.endDate;
		this.qs.getTasksAndExams(
			this.taskAndExamsParams as TasksAndExamsParams
		);
		this.disableRangeClearButton();
	}

	private scrollToLatestEffect() {
		effect(() => {
			// cuando emita cualquiera de los siguientes signals se va a disparar
			this.exams();
			this.tasks();
			this.filteredExams();
			this.filteredTasks();
			this.filteredStudents();

			setTimeout(() => {
				for (const tab of this.tabChildren) {
					const containerElement = tab._elementRef.nativeElement;
					const scrollOwnerElement: Element =
						containerElement.lastChild?.firstChild?.firstChild; //.mat-mdc-tab-body-content

					if (scrollOwnerElement)
						scrollOwnerElement.scrollTo({
							left: containerElement.scrollWidth + 1000000, // Establece la posición a la derecha (al final)
						});
				}
			}, 0);
		});
	}

	private enableFormWhenChooseCourse() {
		toObservable(this.students)
			.pipe(
				filter(
					value =>
						value.length > 0 &&
						(this.filtersForm.get('subject')?.disabled as boolean)
				),
				takeUntil(this.destroy)
			)
			.subscribe(() => this.enableControls());
	}

	private subscribeToFilteredObservablesChanges() {
		combineLatest([this.qs.tasks$, this.qs.exams$, this.qs.students$])
			.pipe(takeUntil(this.destroy))
			.subscribe();
	}

	private resetForm() {
		this.filtersForm.get('subject')?.patchValue(0);
		this.filtersForm.get('student')?.reset();
		this.filtersForm.get('task')?.reset();
		this.filtersForm.get('exam')?.reset();
		this.filtersForm.get('dateRange')?.reset();
	}
}
