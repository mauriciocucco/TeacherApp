import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'shortDate',
})
export class ShortDatePipe implements PipeTransform {
	transform(ISOString: string): string {
		const shortDate = ISOString.slice(0, ISOString.indexOf('T'));
		const splittedShortDate = shortDate.split('-').reverse();

		return splittedShortDate.join('-');
	}
}
