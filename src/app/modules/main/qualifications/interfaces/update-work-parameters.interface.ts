import { MatIconButton } from '@angular/material/button';
import { MatSelect } from '@angular/material/select';
import { Work } from '../../../../core/enums/work.enum';

export interface UpdateWorkParameters {
	controlElement: MatSelect | HTMLInputElement;
	textArea: HTMLTextAreaElement;
	student: number;
	workId: number;
	cardContent: HTMLElement;
	cardLoading: HTMLDivElement;
	editButton: MatIconButton;
	confirmDiv: HTMLDivElement;
	deleteButton: MatIconButton;
	workType?: Work;
}
