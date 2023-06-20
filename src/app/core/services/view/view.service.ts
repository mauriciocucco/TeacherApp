import { Injectable, signal, WritableSignal } from '@angular/core';
import { ScreenType } from '../../enums/screen-type.enum';

@Injectable({
	providedIn: 'root',
})
export class ViewService {
	public screenType: WritableSignal<ScreenType> = signal(ScreenType.DESKTOP);

	public setScreenType(): void {
		window.innerWidth <= 1024
			? this.screenType.set(ScreenType.MOBILE)
			: this.screenType.set(ScreenType.DESKTOP);
	}
}
