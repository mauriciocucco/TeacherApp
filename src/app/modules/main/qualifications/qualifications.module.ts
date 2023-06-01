import { NgModule } from '@angular/core';

import { QualificationsRoutingModule } from './qualifications-routing.module';
import { QualificationsComponent } from './qualifications.component';
import { SharedModule } from '../../../shared/shared.module';
import { StudentTaskPipe } from './pipes/student-task.pipe';
import { StudentExamPipe } from './pipes/student-exam.pipe';
import { ShiftPipe } from './pipes/shift.pipe';
import { CreateDialogComponent } from './create-dialog/create-dialog.component';

@NgModule({
	declarations: [
		QualificationsComponent,
		StudentTaskPipe,
		StudentExamPipe,
		ShiftPipe,
		CreateDialogComponent,
	],
	imports: [QualificationsRoutingModule, SharedModule],
})
export class QualificationsModule {}
