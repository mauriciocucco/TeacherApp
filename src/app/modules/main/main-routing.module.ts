import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main.component';

const routes: Routes = [
	{
		path: '',
		component: MainComponent,
		children: [
			{
				path: 'calificaciones',
				loadChildren: () =>
					import('./qualifications/qualifications.module').then(
						m => m.QualificationsModule
					),
			},
			{
				path: 'progreso',
				loadChildren: () =>
					import('./performance/performance.module').then(
						m => m.PerformanceModule
					),
			},
			{
				path: '**',
				pathMatch: 'full',
				redirectTo: 'calificaciones',
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
export class MainRoutingModule {}
