import { StudentToExam } from './student-to-exam.interface';

export interface CreateExam {
	name: string;
	description: string;
	date: Date;
	subject: number;
	course: number;
	studentToExam: StudentToExam[];
}
