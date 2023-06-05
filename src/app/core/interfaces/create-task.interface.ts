import { StudentToTask } from './student-to-task.interface';

export interface CreateTask {
	name: string;
	description: string;
	date: Date;
	subjectId: number;
	courseId: number;
	studentToTask: StudentToTask[];
}
