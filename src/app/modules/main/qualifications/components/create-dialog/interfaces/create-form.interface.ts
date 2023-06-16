import { Work } from '../../../../../../core/enums/work.enum';
import { StudentToTask } from '../../../../../../core/interfaces/student-to-task.interface';
import { StudentToExam } from '../../../../../../core/interfaces/student-to-exam.interface';

export interface CreateForm {
	type?: Work;
	course: number;
	subject: number;
	date: string;
	name: string;
	description: string;
	studentToTask?: Partial<StudentToTask>[];
	studentToExam?: Partial<StudentToExam>[];
}
