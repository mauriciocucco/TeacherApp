import { NgModule } from '@angular/core';

import { QualificationsRoutingModule } from './qualifications-routing.module';
import { QualificationsComponent } from './qualifications.component';
import { SharedModule } from '../../../shared/shared.module';
import { StudentRelationPipe } from './pipes/student-relation.pipe';
import { AlphabetComponent } from './components/alphabet/alphabet.component';
import { FilterComponent } from './components/filter/filter.component';

@NgModule({
	declarations: [QualificationsComponent, StudentRelationPipe, FilterComponent],
	imports: [QualificationsRoutingModule, SharedModule, AlphabetComponent],
})
export class QualificationsModule {}
