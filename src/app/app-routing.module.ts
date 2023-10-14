import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { CustomPreloadingStrategy } from './core/services/preload/custom-preloading-strategy.service';

const routes: Routes = [
	{
		path: 'auth',
		loadChildren: () =>
			import('./modules/auth/auth.module').then(m => m.AuthModule),
	},
	{
		path: 'principal',
		loadChildren: () =>
			import('./modules/main/main.module').then(m => m.MainModule),
		canMatch: [authGuard],
	},
	{
		path: '**',
		pathMatch: 'full',
		redirectTo: 'principal',
	},
];

@NgModule({
	imports: [
		RouterModule.forRoot(routes, {
			anchorScrolling: 'enabled',
			scrollOffset: [0, 60],
			bindToComponentInputs: true,
			preloadingStrategy: CustomPreloadingStrategy,
		}),
	],
	exports: [RouterModule],
})
export class AppRoutingModule {}
