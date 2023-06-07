import { ToggleEditElements, ToggleEditInfo } from './toggle-edit.interface';

export interface UpdateWorkElements extends ToggleEditElements {
	cardContent: HTMLElement;
	cardLoading: HTMLDivElement;
}

export type UpdateWorkInfo = ToggleEditInfo;
