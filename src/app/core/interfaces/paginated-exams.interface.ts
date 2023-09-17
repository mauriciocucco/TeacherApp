import { Exam } from './exam.interface';
import { PaginatedInfo } from './paginated-info.interface';

export interface PaginatedExams {
	data: Exam[];
	meta: PaginatedInfo;
}
