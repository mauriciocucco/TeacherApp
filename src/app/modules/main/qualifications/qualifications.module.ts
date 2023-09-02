import { NgModule } from '@angular/core';

import { QualificationsRoutingModule } from './qualifications-routing.module';
import { QualificationsComponent } from './qualifications.component';
import { SharedModule } from '../../../shared/shared.module';
import { StudentRelationPipe } from './pipes/student-relation.pipe';
import { AlphabetComponent } from './components/alphabet/alphabet.component';
import { FiltersComponent } from './components/filters/filters.component';
import { WorkCardComponent } from './components/work-card/work-card.component';

@NgModule({
	declarations: [
		QualificationsComponent,
		StudentRelationPipe,
		FiltersComponent,
		WorkCardComponent,
	],
	imports: [QualificationsRoutingModule, SharedModule, AlphabetComponent],
})
export class QualificationsModule {}
