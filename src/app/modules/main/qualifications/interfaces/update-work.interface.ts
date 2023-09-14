import { ToggleEditElements } from './toggle-edit.interface';

export interface UpdateWorkElements extends Partial<ToggleEditElements> {
	cardContent?: HTMLElement;
	cardLoading?: HTMLDivElement;
}
