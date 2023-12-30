import { WorkI } from './work.interface';

export interface StudentToWork {
	studentId: number;
	workId: number;
	observation: string;
	onTime: boolean;
	score: number | null;
	markingId: number | null;
	work: WorkI;
	show?: boolean;
}
