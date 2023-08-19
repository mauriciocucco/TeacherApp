import { Component, Signal } from '@angular/core';
import { Course } from '../../../core/interfaces/course.interface';
import { QualificationsService } from '../../../core/services/qualifications/qualifications.service';

@Component({
	selector: 'app-performance',
	templateUrl: './performance.component.html',
	styleUrls: ['./performance.component.scss'],
})
export class PerformanceComponent {
	public courses: Signal<Course[]> = this.qs.courses;

	constructor(private qs: QualificationsService) {}
}
