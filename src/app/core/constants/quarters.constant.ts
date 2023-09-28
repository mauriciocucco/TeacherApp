const actualYear = new Date().getFullYear();

export const QUARTERS = [
	{
		id: 1,
		name: 'Primer trimestre',
		description: '01/03 - 31/05',
		start: new Date(actualYear, 2, 1),
		end: new Date(actualYear, 4, 30),
	},
	{
		id: 2,
		name: 'Segundo trimestre',
		description: '01/06 - 31/08',
		start: new Date(actualYear, 5, 1),
		end: new Date(actualYear, 7, 30),
	},
	{
		id: 3,
		name: 'Tercer trimestre',
		description: '01/09 - 31/12',
		start: new Date(actualYear, 8, 1),
		end: new Date(actualYear, 11, 31),
	},
];
