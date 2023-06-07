import { StudentToTask } from './student-to-task.interface';

export interface CreateTask {
	name: string;
	description: string;
	date: Date;
	subject: number;
	course: number;
	studentToTask: StudentToTask[];
}
