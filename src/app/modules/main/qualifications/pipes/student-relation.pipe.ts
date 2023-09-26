import { Pipe, PipeTransform } from '@angular/core';

interface StudentRelation {
	works: any[] | undefined; //TODO: tipar esto
	studentId: number | undefined;
}

type Argument = 'markingId' | 'marking' | 'observation' | 'onTime';

@Pipe({
	name: 'studentRelation',
})
export class StudentRelationPipe implements PipeTransform {
	transform(studentInfo: StudentRelation, argument: Argument): string {
		if (!studentInfo.studentId || !studentInfo.works) return '';

		for (const work of studentInfo.works) {
			if (work.studentId === studentInfo.studentId) return work[argument];
		}

		return '';
	}
}
