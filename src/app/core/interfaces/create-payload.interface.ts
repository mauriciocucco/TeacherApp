import { StudentToTask } from './student-to-task.interface';
import { StudentToExam } from './student-to-exam.interface';

export interface CreatePayload {
	name: string;
	description: string;
	date: Date;
	subject: number;
	course: number;
	studentToTask?: StudentToTask[];
	studentToExam?: StudentToExam[];
}
