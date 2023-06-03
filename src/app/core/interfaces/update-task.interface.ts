import { StudentToTask } from './student-to-task.interface';

export interface UpdateTask {
	name?: string;
	description?: string;
	date?: string;
	subjectId?: number;
	courseId?: number;
	studentToTask?: StudentToTask;
}
