import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PerformanceComponent } from './performance.component';
import { StudentPerformanceComponent } from './components/student-performance/student-performance.component';

const routes: Routes = [
	{
		path: '',
		component: PerformanceComponent,
		children: [
			{
				path: ':id',
				component: StudentPerformanceComponent,
			},
		],
	},
	{
		path: '**',
		pathMatch: 'full',
		redirectTo: '',
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class PerformanceRoutingModule {}
