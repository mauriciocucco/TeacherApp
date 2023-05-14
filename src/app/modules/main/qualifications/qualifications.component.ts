import { Component, OnInit } from '@angular/core';

@Component({
	selector: 'app-qualifications',
	templateUrl: './qualifications.component.html',
	styleUrls: ['./qualifications.component.scss'],
})
export class QualificationsComponent implements OnInit {
	public projects: any = [];
	public dataSource = [
		{
			id: 1,
			student: 'Pepe Lui',
			projects: [
				{
					id: 1,
					name: 'Tarea de la Triple Alianza',
					qualification: 'MB',
					observation: '',
				},
				{
					id: 2,
					name: 'Completar carpeta',
					qualification: 'B',
					observation: 'Ayuda de los padres',
				},
			],
		},
		{
			id: 2,
			student: 'Carlin Calvo',
			projects: [
				{
					id: 2,
					name: 'Completar carpeta',
					qualification: 'B',
					observation: 'Muy atento a las clases',
				},
			],
		},
		{
			id: 3,
			student: 'Diego Maradona',
			projects: [
				{
					id: 1,
					name: 'Tarea de la Triple Alianza',
					qualification: 'S/H',
					observation: 'Se la pasa hablando',
				},
			],
		},
		{
			id: 4,
			student: 'Ricardo Darin',
			projects: [
				{
					id: 1,
					name: 'Tarea de la Triple Alianza',
					qualification: 'S/H',
					observation: 'Muy mal desempeño',
				},
				{
					id: 2,
					name: 'Completar carpeta',
					qualification: 'E',
					observation: '',
				},
			],
		},
	];
	public displayedColumns: string[] = ['student'];

	ngOnInit(): void {
		this.projects = [
			{
				id: 1,
				name: 'Tarea de la Triple Alianza',
				date: '2023-04-20T04:30:03.442Z',
			},
			{
				id: 2,
				name: 'Completar carpeta',
				date: new Date().toISOString(),
			},
		];

		this.addColumns();
	}

	private addColumns() {
		for (const project of this.projects) {
			this.displayedColumns.push(project.name);
		}
	}
}
