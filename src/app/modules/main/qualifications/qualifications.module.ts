import { NgModule } from '@angular/core';

import { QualificationsRoutingModule } from './qualifications-routing.module';
import { QualificationsComponent } from './qualifications.component';
import { SharedModule } from '../../../shared/shared.module';
import { StudentDataPipe } from './pipes/student-data.pipe';

@NgModule({
	declarations: [QualificationsComponent, StudentDataPipe],
	imports: [QualificationsRoutingModule, SharedModule],
})
export class QualificationsModule {}
