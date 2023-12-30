import { UpdateStudentToWork } from './update-student-to-work.interface';

export interface UpdateWork {
	name?: string;
	description?: string;
	date?: string;
	workTypeId?: number;
	subjectId?: number;
	courseId?: number;
	studentToWork?: UpdateStudentToWork[];
}
