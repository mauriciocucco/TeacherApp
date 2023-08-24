import { NgModule } from '@angular/core';

import { PerformanceRoutingModule } from './performance-routing.module';
import { PerformanceComponent } from './performance.component';
import { SharedModule } from '../../../shared/shared.module';
import { StudentPerformanceComponent } from './components/student-performance/student-performance.component';

@NgModule({
	declarations: [PerformanceComponent, StudentPerformanceComponent],
	imports: [PerformanceRoutingModule, SharedModule],
})
export class PerformanceModule {}
