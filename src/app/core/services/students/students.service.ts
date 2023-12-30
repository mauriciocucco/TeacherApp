import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Endpoints } from '../../enums/endpoints.enum';
import { Student } from '../../interfaces/student.interface';
import { StudentPerformance } from '../../../modules/main/performance/interfaces/student-performance.interface';
import { of } from 'rxjs';
import { WorksQueryParams } from 'src/app/modules/main/qualifications/interfaces/works-query-params.interface';

@Injectable({
	providedIn: 'root',
})
export class StudentsService {
	private api = inject(ApiService);

	public getStudents(studentsQueryParams: WorksQueryParams | null) {
		return studentsQueryParams
			? this.api.get<Student[]>(Endpoints.STUDENTS, {
					params: studentsQueryParams,
			  })
			: of([]);
	}

	public getStudent(studentId: number) {
		return this.api.get<Student>(`${Endpoints.STUDENTS}/${studentId}`);
	}

	public getStudentPerformance(studentId: number) {
		return this.api.get<StudentPerformance[]>(
			`${Endpoints.STUDENTS}/${studentId}/performance`
		);
	}
}
