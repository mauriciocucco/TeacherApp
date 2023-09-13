import { DateRangeFromMaterial } from './range-date.interface';

export interface FormFilters {
	course: number;
	subject: number;
	student: string;
	task: string;
	exam: string;
	dateRange: DateRangeFromMaterial;
}
