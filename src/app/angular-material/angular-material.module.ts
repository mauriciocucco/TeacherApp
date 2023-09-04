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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

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
		MatProgressBarModule,
		MatMenuModule,
		MatListModule,
		MatToolbarModule,
		MatExpansionModule,
		MatButtonToggleModule,
	],
	providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-AR' }],
})
export class AngularMaterialModule {}
