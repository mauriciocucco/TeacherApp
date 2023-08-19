import { Pipe, PipeTransform } from '@angular/core';
import { Shift } from '../../core/interfaces/course.interface';

const shifts = {
	MORNING: 'Mañana',
	AFTERNOON: 'Tarde',
};

@Pipe({
	name: 'shift',
})
export class ShiftPipe implements PipeTransform {
	transform(shift: Shift = 'MORNING'): string {
		return shifts[shift];
	}
}
