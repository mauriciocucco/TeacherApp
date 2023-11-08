import { StudentToExam } from './student-to-exam.interface';
import { StudentToTask } from './student-to-task.interface';
import { Subject } from './subject.interface';

export interface WorkUnion {
	id: number;
	name: string;
	description: string;
	date: string;
	show: boolean;
	studentToExam: StudentToExam[];
	subject: Subject;
	studentToTask: StudentToTask[];
	totalDelivered: number;
}
