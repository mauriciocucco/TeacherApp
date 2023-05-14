import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
	{
		path: 'principal',
		loadChildren: () =>
			import('./modules/main/main.module').then(m => m.MainModule),
	},
	{
		path: '**',
		pathMatch: 'full',
		redirectTo: 'principal',
	},
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule],
})
export class AppRoutingModule {}
