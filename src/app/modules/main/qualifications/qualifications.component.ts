import {
	AfterViewInit,
	Component,
	OnInit,
	QueryList,
	ViewChildren,
} from '@angular/core';
import { STUDENTS_PROJECTS } from './constants/students-projects';
import { TASKS } from './constants/tasks';
import { QUALIFICATIONS } from './constants/qualifications';
import { EXAMS } from './constants/exams';
import { MatTabGroup } from '@angular/material/tabs';
import { FormControl } from '@angular/forms';
import { Observable, map, of, startWith, tap } from 'rxjs';
import { STUDENTS } from './constants/students';

@Component({
	selector: 'app-qualifications',
	templateUrl: './qualifications.component.html',
	styleUrls: ['./qualifications.component.scss'],
})
export class QualificationsComponent implements OnInit, AfterViewInit {
	public tasks: any = [];
	public qualifications: any = [];
	public exams: any = [];
	public students: any = [];
	public studentsProjects: any = [];
	public studentFilterControl = new FormControl('');
	public filteredOptions!: Observable<any[]>;
	@ViewChildren('tabChildren') tabChildren!: QueryList<MatTabGroup>;

	constructor() {
		this.tasks = TASKS;
		this.qualifications = QUALIFICATIONS;
		this.exams = EXAMS;
		this.students = STUDENTS;
		this.studentsProjects = STUDENTS_PROJECTS;
	}

	ngOnInit() {
		this.filteredOptions = this.studentFilterControl.valueChanges.pipe(
			startWith(''),
			map(value => this._filter(value || ''))
		);
	}

	ngAfterViewInit() {
		this.scrollToTheLeft();
	}

	private scrollToTheLeft() {
		for (const tab of this.tabChildren) {
			const containerElement = tab._elementRef.nativeElement;
			const scrollOwnerElement: Element =
				containerElement.lastChild?.firstChild?.firstChild; //.mat-mdc-tab-body-content

			if (scrollOwnerElement)
				scrollOwnerElement.scrollTo({
					left: containerElement.scrollWidth, // Establece la posición a la derecha (al final)
				});
		}
	}

	private _filter(value: any): string[] {
		const filterValue = value.toLowerCase();

		return this.students.filter((student: any) => {
			const fullName = `${student.name}${student.lastName}`.toLowerCase();
			if (fullName.includes(filterValue)) {
				return student;
			}
		});
	}
}
