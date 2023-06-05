import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api/api.service';
import { CreateTask } from '../../interfaces/create-task.interface';
import { Endpoints } from 'src/app/core/enums/endpoints.enum';
import { TasksAndExamsQueryParams } from '../../../modules/main/qualifications/interfaces/tasks-and-exams-query-params.interface';
import { Task } from '../../interfaces/task.interface';
import { catchError, of } from 'rxjs';
import { UpdateTask } from '../../interfaces/update-task.interface';

@Injectable({
	providedIn: 'root',
})
export class TasksService {
	private api = inject(ApiService);

	public createTask(task: CreateTask) {
		return this.api.post<CreateTask>(Endpoints.TASKS, task).pipe(
			catchError(error => {
				console.error('Error en createTask:', error);

				return of(error);
			})
		);
	}

	public getTasks(tasksAndExamsQueryParams: TasksAndExamsQueryParams | null) {
		return tasksAndExamsQueryParams
			? this.api.get<Task[]>(Endpoints.TASKS, {
					params: tasksAndExamsQueryParams,
			  })
			: of([]);
	}

	public updateTask(task: UpdateTask, taskId: number) {
		return this.api
			.patch<UpdateTask>(`${Endpoints.TASKS}/${taskId}`, task)
			.pipe(
				catchError(error => {
					console.error('Error en updateTask:', error);

					return of(error);
				})
			);
	}
}
