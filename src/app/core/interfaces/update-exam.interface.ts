import { StudentToExam } from './student-to-exam.interface';

export interface UpdateExam {
	name?: string;
	description?: string;
	date?: string;
	subject?: number;
	course?: number;
	studentToExam?: StudentToExam[];
}
