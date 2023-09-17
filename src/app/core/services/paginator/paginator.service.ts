import { Injectable, signal } from '@angular/core';
import { PaginatedInfo } from '../../interfaces/paginated-info.interface';

@Injectable({
	providedIn: 'root',
})
export class PaginatorService {
	public tasksPaginatorInfo = signal({ total: 0, page: 1, lastPage: 1 });
	public examsPaginatorInfo = signal({ total: 0, page: 1, lastPage: 1 });

	public setPages(
		tasksInfo: PaginatedInfo | null,
		examsInfo: PaginatedInfo | null
	) {
		if (tasksInfo) this.tasksPaginatorInfo.set(tasksInfo);
		if (examsInfo) this.examsPaginatorInfo.set(examsInfo);
	}
}
