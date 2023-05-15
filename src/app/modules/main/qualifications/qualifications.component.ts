import { Component, OnInit } from '@angular/core';
import { STUDENTS_PROJECTS } from './constants/students-projects';
import { PROJECTS } from './constants/projects';
import { QUALIFICATIONS } from './constants/qualifications';

@Component({
	selector: 'app-qualifications',
	templateUrl: './qualifications.component.html',
	styleUrls: ['./qualifications.component.scss'],
})
export class QualificationsComponent implements OnInit {
	public projects: any = [];
	public qualifications: any = [];
	public dataSource = STUDENTS_PROJECTS;
	public displayedColumns: string[] = ['student'];

	constructor() {
		this.projects = PROJECTS;
		this.qualifications = QUALIFICATIONS;
	}

	ngOnInit(): void {
		this.addColumns();
	}

	private addColumns() {
		for (const project of this.projects) {
			this.displayedColumns.push(project.name);
		}
	}
}
