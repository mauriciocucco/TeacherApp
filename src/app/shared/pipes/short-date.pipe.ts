import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'shortDate',
})
export class ShortDatePipe implements PipeTransform {
	transform(incomingValue: string | Date | undefined): string {
		if (!incomingValue) return '';

		let ISOString = incomingValue;

		if (typeof ISOString === 'object') {
			ISOString = ISOString.toISOString();
		}

		const shortDate = ISOString.slice(0, ISOString.indexOf('T'));
		const splittedShortDate = shortDate.split('-').reverse();

		return splittedShortDate.join('-');
	}
}
