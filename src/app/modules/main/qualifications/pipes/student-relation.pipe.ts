import { Pipe, PipeTransform } from '@angular/core';

interface StudentRelation {
	works: any[] | undefined; //TODO: tipar esto
	studentId: number | undefined;
}

@Pipe({
	name: 'studentRelation',
})
export class StudentRelationPipe implements PipeTransform {
	transform(studentInfo: StudentRelation, argument: any): string {
		if (!studentInfo.studentId || !studentInfo.works) return '';

		for (const work of studentInfo.works) {
			if (work.studentId === studentInfo.studentId) return work[argument];
		}

		return '';
	}
}
