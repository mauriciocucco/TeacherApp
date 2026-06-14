const actualYear = new Date().getFullYear();

export const QUARTERS = [
	{
		id: 1,
		name: 'Primer trimestre',
		description: '01/03 - 31/05',
		start: new Date(new Date(actualYear, 0, 1).setHours(0, 0, 0, 0)),
		end: new Date(new Date(actualYear, 4, 30).setHours(23, 59, 59, 999)),
	},
	{
		id: 2,
		name: 'Segundo trimestre',
		description: '01/06 - 31/08',
		start: new Date(new Date(actualYear, 5, 1).setHours(0, 0, 0, 0)),
		end: new Date(new Date(actualYear, 7, 30).setHours(23, 59, 59, 999)),
	},
	{
		id: 3,
		name: 'Tercer trimestre',
		description: '01/09 - 31/12',
		start: new Date(new Date(actualYear, 8, 1).setHours(0, 0, 0, 0)),
		end: new Date(new Date(actualYear, 11, 31).setHours(23, 59, 59, 999)),
	},
];
