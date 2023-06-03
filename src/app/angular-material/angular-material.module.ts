import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@NgModule({
	declarations: [],
	exports: [
		MatCardModule,
		MatInputModule,
		MatSelectModule,
		MatDatepickerModule,
		MatNativeDateModule,
		MatTabsModule,
		MatAutocompleteModule,
		MatRadioModule,
		MatButtonModule,
		MatIconModule,
		MatProgressSpinnerModule,
		MatDialogModule,
		MatSnackBarModule,
	],
	providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-AR' }],
})
export class AngularMaterialModule {}
