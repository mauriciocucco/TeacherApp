import { Task } from './task.interface';
import { PaginatedInfo } from './paginated-info.interface';

export interface PaginatedTasks {
	data: Task[];
	meta: PaginatedInfo;
}
