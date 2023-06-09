import { Pipe, PipeTransform } from '@angular/core';

interface StudentRelation {
	works: any[]; //TODO: tipar esto
	studentId: number;
}

@Pipe({
	name: 'studentRelation',
})
export class StudentRelationPipe implements PipeTransform {
	transform(studentInfo: StudentRelation, argument: any): string {
		for (const work of studentInfo.works) {
			if (work.studentId === studentInfo.studentId) return work[argument];
		}

		return '';
	}
}
