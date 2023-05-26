export type Shift = 'MORNING' | 'AFTERNOON';

export interface Course {
	id: number;
	year: string;
	shift: Shift;
}
