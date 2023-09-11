import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { ShortDatePipe } from './pipes/short-date.pipe';
import { ScrollComponent } from './components/scroll/scroll.component';
import { HeaderComponent } from './layout/header/header.component';
import { ShiftPipe } from './pipes/shift.pipe';
import { WarningComponent } from './components/warning/warning.component';
import { MenuButtonComponent } from './components/menu-button/menu-button.component';
import { InfiniteScrollDirective } from './directives/infinite-scroll.directive';

@NgModule({
	declarations: [
		ShortDatePipe,
		ScrollComponent,
		HeaderComponent,
		ShiftPipe,
		WarningComponent,
		MenuButtonComponent,
		InfiniteScrollDirective,
	],
	imports: [
		CommonModule,
		FormsModule,
		RouterModule,
		ReactiveFormsModule,
		AngularMaterialModule,
	],
	exports: [
		CommonModule,
		FormsModule,
		RouterModule,
		ReactiveFormsModule,
		AngularMaterialModule,
		ShortDatePipe,
		ScrollComponent,
		HeaderComponent,
		ShiftPipe,
		WarningComponent,
		MenuButtonComponent,
		InfiniteScrollDirective,
	],
})
export class SharedModule {}
