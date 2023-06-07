import { StudentToTask } from './student-to-task.interface';

export interface UpdateTask {
	name?: string;
	description?: string;
	date?: string;
	subject?: number;
	course?: number;
	studentToTask?: StudentToTask;
}
