import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'studentData',
})
export class StudentDataPipe implements PipeTransform {
	transform(projectInfo: any, argument = 'qualification'): string {
		for (const project of projectInfo.studentProjects) {
			if (project.id === projectInfo.projectToMatch)
				return argument === 'qualification'
					? project[argument].id
					: argument === 'exams'
					? project.qualification
					: project[argument];
		}

		return '';
	}
}
