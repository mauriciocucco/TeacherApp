import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api/api.service';
import { of } from 'rxjs';
import { Endpoints } from '../../enums/endpoints.enum';
import { Student } from '../../interfaces/student.interface';
import { StudentsParams } from '../../../modules/main/qualifications/interfaces/students-params.interface';

@Injectable({
	providedIn: 'root',
})
export class StudentsService {
	private api = inject(ApiService);

	public getStudents(studentsQueryParams: StudentsParams | null) {
		return studentsQueryParams
			? this.api.get<Student[]>(Endpoints.STUDENTS, {
					params: studentsQueryParams,
			  })
			: of([]);
	}
}
