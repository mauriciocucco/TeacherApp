import { StudentToExam } from './student-to-exam.interface';
import { WorkBase } from './work-base.interface';

export interface Exam extends WorkBase {
	studentToExam: StudentToExam[];
}
