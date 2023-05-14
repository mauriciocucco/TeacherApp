import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { ShortDatePipe } from './pipes/short-date.pipe';

@NgModule({
	declarations: [ShortDatePipe],
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
	],
})
export class SharedModule {}
