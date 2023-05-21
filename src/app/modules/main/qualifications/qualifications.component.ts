import {
	AfterViewInit,
	Component,
	QueryList,
	ViewChildren,
} from '@angular/core';
import { STUDENTS_PROJECTS } from './constants/students-projects';
import { PROJECTS } from './constants/projects';
import { QUALIFICATIONS } from './constants/qualifications';
import { EXAMS } from './constants/exams';
import { MatTabGroup } from '@angular/material/tabs';

@Component({
	selector: 'app-qualifications',
	templateUrl: './qualifications.component.html',
	styleUrls: ['./qualifications.component.scss'],
})
export class QualificationsComponent implements AfterViewInit {
	public projects: any = [];
	public qualifications: any = [];
	public exams: any = [];
	public students = STUDENTS_PROJECTS;
	@ViewChildren('tabChildren') tabChildren!: QueryList<MatTabGroup>;

	constructor() {
		this.projects = PROJECTS;
		this.qualifications = QUALIFICATIONS;
		this.exams = EXAMS;
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
}
