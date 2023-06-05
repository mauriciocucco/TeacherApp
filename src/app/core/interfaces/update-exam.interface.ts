import { StudentToExam } from './student-to-exam.interface';

export interface UpdateExam {
	name?: string;
	description?: string;
	date?: string;
	subjectId?: number;
	courseId?: number;
	studentToExam?: StudentToExam;
}
