import { StudentToExam } from './student-to-exam.interface';

export interface CreateExam {
	name: string;
	description: string;
	date: Date;
	subjectId: number;
	courseId: number;
	studentToExam: StudentToExam[];
}
