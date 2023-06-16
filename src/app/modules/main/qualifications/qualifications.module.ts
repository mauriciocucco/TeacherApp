import { NgModule } from '@angular/core';

import { QualificationsRoutingModule } from './qualifications-routing.module';
import { QualificationsComponent } from './qualifications.component';
import { SharedModule } from '../../../shared/shared.module';
import { StudentRelationPipe } from './pipes/student-relation.pipe';
import { ShiftPipe } from './pipes/shift.pipe';

@NgModule({
	declarations: [QualificationsComponent, StudentRelationPipe, ShiftPipe],
	imports: [QualificationsRoutingModule, SharedModule],
})
export class QualificationsModule {}
