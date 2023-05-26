import { Pipe, PipeTransform } from '@angular/core';
import { StudentToExam } from '../../../../core/interfaces/student-to-exam.interface';

interface StudentProject {
	studentProjects: any[];
	idToMatch: number;
}

@Pipe({
	name: 'studentExam',
})
export class StudentExamPipe implements PipeTransform {
	transform(
		studentInfo: StudentProject,
		argument: keyof StudentToExam
	): string {
		for (const project of studentInfo.studentProjects) {
			if (project['examId'] === studentInfo.idToMatch)
				return project[argument];
		}

		return '';
	}
}
