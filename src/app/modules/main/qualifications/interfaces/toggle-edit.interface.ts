import { MatIconButton } from '@angular/material/button';
import { MatSelect } from '@angular/material/select';
import { Work } from '../../../../core/enums/work.enum';

export interface ToggleEditElements {
	controlElement: MatSelect | HTMLInputElement;
	textArea: HTMLTextAreaElement;
	editButton: MatIconButton;
	confirmDiv: HTMLDivElement;
	deleteButton: MatIconButton;
}

export interface ToggleEditInfo {
	workId: number;
	studentId: number;
	workType: Work;
}
