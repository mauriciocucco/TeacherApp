import {
	Component,
	OnDestroy,
	OnInit,
	QueryList,
	ViewChildren,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
	Observable,
	Subject,
	combineLatest,
	map,
	startWith,
	takeUntil,
	tap,
} from 'rxjs';
import { Task } from '../../../core/interfaces/task.interface';
import { Marking } from '../../../core/interfaces/marking.interface';
import { Subject as schoolSubject } from '../../../core/interfaces/subject.interface';
import { Exam } from '../../../core/interfaces/exam.interface';
import { Student } from '../../../core/interfaces/student.interface';
import { ApiService } from '../../../core/services/api/api.service';
import { MatTabGroup } from '@angular/material/tabs';
import { Course } from '../../../core/interfaces/course.interface';

@Component({
	selector: 'app-qualifications',
	templateUrl: './qualifications.component.html',
	styleUrls: ['./qualifications.component.scss'],
})
export class QualificationsComponent implements OnInit, OnDestroy {
	private tasks$: Observable<Task[]> = this.apiService.get('tasks');
	private markings$: Observable<Marking[]> = this.apiService.get('markings');
	private exams$: Observable<Exam[]> = this.apiService.get('exams');
	private subjects$: Observable<schoolSubject[]> =
		this.apiService.get('subjects');
	private courses$: Observable<Course[]> = this.apiService.get('courses');
	private students$: Observable<Student[]> = this.apiService.get('students');
	public vm$ = combineLatest([
		this.tasks$,
		this.markings$,
		this.exams$,
		this.subjects$,
		this.courses$,
		this.students$,
	]).pipe(
		map(([tasks, markings, exams, subjects, courses, students]) => ({
			tasks,
			markings,
			exams,
			subjects,
			courses,
			students,
		})),
		tap(() => this.scrollToTheLeft())
	);
	public studentFilterControl = new FormControl('');
	public filteredOptions!: Observable<any[]>;
	public defaultSubject = '*';
	private destroy: Subject<boolean> = new Subject<boolean>();
	@ViewChildren('tabChildren') tabChildren!: QueryList<MatTabGroup>;

	constructor(private apiService: ApiService) {}

	ngOnInit() {
		this.listenStudentFilterChanges();
	}

	ngOnDestroy(): void {
		this.destroy.next(true);
		this.destroy.unsubscribe();
	}

	private scrollToTheLeft() {
		this.tabChildren.changes
			.pipe(takeUntil(this.destroy))
			.subscribe((queryList: QueryList<MatTabGroup>) => {
				for (const tab of queryList.toArray()) {
					const containerElement = tab._elementRef.nativeElement;
					const scrollOwnerElement: Element =
						containerElement.lastChild?.firstChild?.firstChild; //.mat-mdc-tab-body-content

					if (scrollOwnerElement)
						scrollOwnerElement.scrollTo({
							left: containerElement.scrollWidth + 1000000, // Establece la posición a la derecha (al final)
						});
				}
			});
	}

	private listenStudentFilterChanges() {
		this.studentFilterControl.valueChanges.pipe(
			startWith(''),
			map(value => this.filterValues(value || '')),
			takeUntil(this.destroy)
		);
	}

	private filterValues(value: string): any {
		const filterValue = value.toLowerCase();

		return '';
	}
}
