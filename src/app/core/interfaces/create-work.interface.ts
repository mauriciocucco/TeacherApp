import { CreateStudentToWork } from './create-student-to-work.interface';

export interface CreateWork {
	name: string;
	description: string;
	date: string;
	workTypeId: number;
	subjectId: number;
	courseId: number;
	studentToWork: CreateStudentToWork[];
}
