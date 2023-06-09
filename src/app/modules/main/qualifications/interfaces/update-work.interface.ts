import { ToggleEditElements } from './toggle-edit.interface';

export interface UpdateWorkElements extends ToggleEditElements {
	cardContent: HTMLElement;
	cardLoading: HTMLDivElement;
}
