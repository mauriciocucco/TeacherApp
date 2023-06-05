import { MatIconButton } from '@angular/material/button';
import { MatSelect } from '@angular/material/select';

export interface ToggleEditElements {
	controlElement: MatSelect | HTMLInputElement;
	textArea: HTMLTextAreaElement;
	editButton: MatIconButton;
	confirmDiv: HTMLDivElement;
	deleteButton: MatIconButton;
}
