import { StudentToWork } from './student-to-work.interface';

export interface WorkI {
	id: number;
	name: string;
	workTypeId: number;
	description: string;
	date: string;
	courseId: number;
	subjectId: number;
	totalDelivered: number;
	studentToWork: StudentToWork[];
	show: boolean;
}
