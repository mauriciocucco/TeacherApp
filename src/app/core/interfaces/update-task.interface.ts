import { StudentToTask } from './student-to-task.interface';
import { Subject } from './subject.interface';

export interface UpdateTask {
	name?: string;
	description?: string;
	date?: string;
	subject?: number | Subject;
	course?: number;
	studentToTask?: StudentToTask[];
}
