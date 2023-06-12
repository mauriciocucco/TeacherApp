import { Injectable, signal } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class ViewService {
	public screenType = signal('DESKTOP');

	public setScreenType(): void {
		window.innerWidth <= 1024
			? this.screenType.set('MOBILE')
			: this.screenType.set('DESKTOP');
	}
}
