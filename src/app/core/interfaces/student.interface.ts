import { StudentToExam } from './student-to-exam.interface';
import { StudentToTask } from './student-to-task.interface';
export interface Student {
	id: number;
	name: string;
	lastname: string;
	studentToExam: StudentToExam[];
	studentToTask: StudentToTask[];
	show: boolean;
}
