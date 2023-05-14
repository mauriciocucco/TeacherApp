import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QualificationsComponent } from './qualifications.component';

const routes: Routes = [
	{
		path: '',
		component: QualificationsComponent,
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class QualificationsRoutingModule {}
