import { Component } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
	selector: 'app-alphabet',
	standalone: true,
	imports: [SharedModule],
	templateUrl: './alphabet.component.html',
	styleUrls: ['./alphabet.component.scss'],
})
export class AlphabetComponent {
	private alpha = Array.from(Array(26)).map((e, i) => i + 65);
	public alphabet = this.alpha.map(x => String.fromCharCode(x));
}
