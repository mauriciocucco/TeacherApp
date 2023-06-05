import { MatIconButton } from '@angular/material/button';
import { MatSelect } from '@angular/material/select';
import { Work } from '../../../../core/enums/work.enum';

export interface UpdateWorkParameters {
	controlElement: MatSelect | HTMLInputElement;
	textArea: HTMLTextAreaElement;
	studentId: number;
	workId: number;
	cardContent: HTMLElement;
	cardLoading: HTMLDivElement;
	cancelEditButton: MatIconButton;
	workType?: Work;
}
