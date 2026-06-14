import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api/api.service';
import { catchError, of } from 'rxjs';
import { Endpoints } from '../../enums/endpoints.enum';
import { WorkI } from '../../interfaces/work.interface';
import { UpdateWork } from '../../interfaces/update-work.interface';
import { CreateWork } from '../../interfaces/create-work.interface';
import { WorksQueryParams } from '../../../modules/main/qualifications/interfaces/works-query-params.interface';

@Injectable({
	providedIn: 'root',
})
export class WorksService {
	private api = inject(ApiService);

	public getWorks(params: WorksQueryParams | null) {
		return this.api
			.get<WorkI[]>(Endpoints.WORKS, {
				params,
			})
			.pipe(
				catchError(error => {
					console.error('Error en getWorks:', error);

					return of(error);
				})
			);
	}

	public createWork(newWork: CreateWork) {
		return this.api.post<WorkI>(Endpoints.WORKS, newWork).pipe(
			catchError(error => {
				console.error('Error en createWork:', error);

				return of(error);
			})
		);
	}

	public updateWork(payload: UpdateWork, workId: number) {
		return this.api
			.patch<WorkI>(`${Endpoints.WORKS}/${workId}`, payload)
			.pipe(
				catchError(error => {
					console.error('Error en updateWork:', error);

					return of(error);
				})
			);
	}

	public deleteWork(workId: number) {
		return this.api.delete(`${Endpoints.WORKS}/${workId}`).pipe(
			catchError(error => {
				console.error('Error en deleteWork:', error);

				return of(error);
			})
		);
	}
}
