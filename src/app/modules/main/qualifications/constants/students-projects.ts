export const STUDENTS_PROJECTS = [
	{
		id: 1,
		name: 'Pepe',
		lastName: 'Lui',
		image: 'assets/images/perrito-estudiante.webp',
		projects: [
			{
				id: 1,
				name: 'Tarea de la Triple Alianza',
				date: '2023-04-20T04:30:03.442Z',
				qualification: {
					id: 2,
					name: 'MB',
				},
				observation: '',
			},
			{
				id: 2,
				name: 'Completar carpeta',
				date: new Date().toISOString(),
				qualification: {
					id: 1,
					name: 'B',
				},
				observation: 'Ayuda de los padres',
			},
		],
		exams: [
			{
				id: 1,
				name: 'Exámen de Sociales',
				qualification: 8,
				observation: '',
			},
		],
	},
	{
		id: 2,
		name: 'Carlin',
		lastName: 'Calvo',
		image: 'assets/images/perrito-estudiante.webp',
		projects: [
			{
				id: 2,
				name: 'Completar carpeta',
				date: new Date().toISOString(),
				qualification: {
					id: 1,
					name: 'B',
				},
				observation: 'Muy atento a las clases',
			},
		],
		exams: [
			{
				id: 1,
				name: 'Exámen de Sociales',
				qualification: 7,
				observation: 'Zafando',
			},
		],
	},
	{
		id: 3,
		name: 'Diego',
		lastName: 'Maradona',
		image: 'assets/images/perrito-estudiante.webp',
		projects: [
			{
				id: 1,
				name: 'Tarea de la Triple Alianza',
				date: '2023-04-20T04:30:03.442Z',
				qualification: {
					id: 4,
					name: 'S/H',
				},
				observation: 'Se la pasa hablando',
			},
		],
		exams: [
			{
				id: 1,
				name: 'Exámen de Sociales',
				qualification: 9,
				observation: 'Sobresaliente',
			},
		],
	},
	{
		id: 4,
		name: 'Ricardo',
		lastName: 'Darin',
		image: 'assets/images/perrito-estudiante.webp',
		projects: [
			{
				id: 1,
				name: 'Tarea de la Triple Alianza',
				date: '2023-04-20T04:30:03.442Z',
				qualification: {
					id: 4,
					name: 'S/H',
				},
				observation: 'Muy mal desempeño',
			},
			{
				id: 2,
				name: 'Completar carpeta',
				date: new Date().toISOString(),
				qualification: {
					id: 3,
					name: 'E',
				},
				observation: '',
			},
		],
		exams: [
			{
				id: 1,
				name: 'Exámen de Sociales',
				qualification: 5,
				observation: 'Muy mal',
			},
		],
	},
];
