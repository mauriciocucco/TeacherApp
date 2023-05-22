import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
// import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatRadioModule } from '@angular/material/radio';

@NgModule({
	declarations: [],
	exports: [
		MatCardModule,
		MatInputModule,
		MatSelectModule,
		// MatTableModule,
		MatDatepickerModule,
		MatNativeDateModule,
		MatTabsModule,
		MatAutocompleteModule,
		MatRadioModule,
	],
})
export class AngularMaterialModule {}
