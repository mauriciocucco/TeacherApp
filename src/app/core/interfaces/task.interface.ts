import { StudentToTask } from './student-to-task.interface';
import { Subject } from './subject.interface';
import { WorkBase } from './work-base.interface';

export interface Task extends WorkBase {
	studentToTask: StudentToTask[];
	totalDelivered: number;
	subject: Subject;
}
