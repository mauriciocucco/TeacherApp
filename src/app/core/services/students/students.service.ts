import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Endpoints } from '../../enums/endpoints.enum';
import { Student } from '../../interfaces/student.interface';
import { StudentsParams } from '../../../modules/main/qualifications/interfaces/students-params.interface';

@Injectable({
	providedIn: 'root',
})
export class StudentsService {
	private api = inject(ApiService);

	public getStudents(studentsQueryParams: StudentsParams) {
		return this.api.get<Student[]>(Endpoints.STUDENTS, {
			params: studentsQueryParams,
		});
	}

	public getStudent(studentId: number) {
		return this.api.get<Student>(`${Endpoints.STUDENTS}/${studentId}`);
	}
}
