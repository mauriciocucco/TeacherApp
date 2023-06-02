import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Endpoints } from '../../enums/endpoints.enum';
import { CreateExam } from '../../interfaces/create-exam.interface';
import { TasksAndExamsQueryParams } from '../../../modules/main/qualifications/interfaces/tasks-and-exams-query-params.interface';
import { Exam } from '../../interfaces/exam.interface';
import { of } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ExamsService {
	api = inject(ApiService);

	public createExam(task: CreateExam) {
		return this.api.post<CreateExam>(Endpoints.EXAMS, task);
	}

	public getExams(tasksAndExamsQueryParams: TasksAndExamsQueryParams | null) {
		return tasksAndExamsQueryParams
			? this.api.get<Exam[]>(Endpoints.EXAMS, {
					params: tasksAndExamsQueryParams,
			  })
			: of([]);
	}
}
