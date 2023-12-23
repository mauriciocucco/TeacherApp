import { NgModule } from '@angular/core';

import { QualificationsRoutingModule } from './qualifications-routing.module';
import { QualificationsComponent } from './qualifications.component';
import { SharedModule } from '../../../shared/shared.module';
import { AlphabetComponent } from './components/alphabet/alphabet.component';
import { FiltersComponent } from './components/filters/filters.component';
import { StudentCardComponent } from './components/student-card/student-card.component';

@NgModule({
	declarations: [QualificationsComponent, FiltersComponent],
	imports: [
		QualificationsRoutingModule,
		SharedModule,
		AlphabetComponent,
		StudentCardComponent,
	],
})
export class QualificationsModule {}
