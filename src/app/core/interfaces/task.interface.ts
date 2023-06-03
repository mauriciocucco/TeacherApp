import { StudentToTask } from './student-to-task.interface';

export interface Task {
	id: number;
	name: string;
	description: string;
	date: string;
	subjectId: number;
	show: boolean;
	studentToTask: StudentToTask[];
}
