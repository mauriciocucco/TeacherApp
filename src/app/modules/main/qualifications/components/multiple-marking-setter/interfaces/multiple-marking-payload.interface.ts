import { Student } from '../../../../../../core/interfaces/student.interface';
import { Marking } from '../../../../../../core/interfaces/marking.interface';
import { Task } from '../../../../../../core/interfaces/task.interface';
import { Exam } from '../../../../../../core/interfaces/exam.interface';

export interface MultipleMarkingPayload {
	students: Student[];
	markings: Marking[];
	tasks: Task[];
	exams: Exam[];
}
