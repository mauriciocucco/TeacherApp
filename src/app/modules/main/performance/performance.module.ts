import { NgModule } from '@angular/core';

import { PerformanceRoutingModule } from './performance-routing.module';
import { PerformanceComponent } from './performance.component';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
	declarations: [PerformanceComponent],
	imports: [PerformanceRoutingModule, SharedModule],
})
export class PerformanceModule {}
