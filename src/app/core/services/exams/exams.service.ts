import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Endpoints } from '../../enums/endpoints.enum';
import { CreateExam } from '../../interfaces/create-exam.interface';
import { TasksAndExamsQueryParams } from '../../../modules/main/qualifications/interfaces/tasks-and-exams-query-params.interface';
import { Exam } from '../../interfaces/exam.interface';
import { catchError, of } from 'rxjs';
import { UpdateExam } from '../../interfaces/update-exam.interface';

@Injectable({
	providedIn: 'root',
})
export class ExamsService {
	api = inject(ApiService);

	public createExam(task: CreateExam) {
		return this.api.post(Endpoints.EXAMS, task).pipe(
			catchError(error => {
				console.error('Error en createExam:', error);

				return of(error);
			})
		);
	}

	public getExams(tasksAndExamsQueryParams: TasksAndExamsQueryParams | null) {
		return tasksAndExamsQueryParams
			? this.api.get<Exam[]>(Endpoints.EXAMS, {
					params: tasksAndExamsQueryParams,
			  })
			: of([]);
	}

	public getExam(examId: number) {
		return this.api.get<Exam>(`${Endpoints.EXAMS}/${examId}`);
	}

	public updateExam(task: UpdateExam, examId: number) {
		return this.api.patch<Exam>(`${Endpoints.EXAMS}/${examId}`, task);
	}

	public deleteExam(examId: number) {
		return this.api.delete(`${Endpoints.EXAMS}/${examId}`).pipe(
			catchError(error => {
				console.error('Error en deleteExam:', error);

				return of(error);
			})
		);
	}
}
