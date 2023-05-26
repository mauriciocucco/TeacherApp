import { Pipe, PipeTransform } from '@angular/core';
import { StudentToTask } from '../../../../core/interfaces/student-to-task.interface';

interface StudentProject {
	studentProjects: any[];
	idToMatch: number;
}

@Pipe({
	name: 'studentTask',
})
export class StudentTaskPipe implements PipeTransform {
	transform(
		studentInfo: StudentProject,
		argument: keyof StudentToTask
	): string {
		for (const project of studentInfo.studentProjects) {
			if (project['taskId'] === studentInfo.idToMatch)
				return project[argument];
		}

		return '';
	}
}
