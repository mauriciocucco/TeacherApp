import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'app-menu-button',
	templateUrl: './menu-button.component.html',
	styleUrls: ['./menu-button.component.scss'],
	changeDetection: ChangeDetectionStrategy.Eager,
	standalone: false,
})
export class MenuButtonComponent {
	@Input() title = '';
	@Input() icon = '';
}
