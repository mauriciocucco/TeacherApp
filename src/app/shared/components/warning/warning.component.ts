import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'app-warning',
	templateUrl: './warning.component.html',
	styleUrls: ['./warning.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarningComponent {
	@Input() info = '';
}
