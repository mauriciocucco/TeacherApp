import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	inject,
	signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
	NavigationCancel,
	NavigationEnd,
	NavigationError,
	NavigationStart,
	Router,
	Event,
} from '@angular/router';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
	public showMainProgressBar = signal(false);
	private destroyRef = inject(DestroyRef);

	constructor(private router: Router) {
		this.router.events
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(event => {
				this.navigationInterceptor(event as Event);
			});
	}

	private navigationInterceptor(event: Event): void {
		if (event instanceof NavigationStart) {
			this.showMainProgressBar.set(true);
		}
		if (event instanceof NavigationEnd) {
			this.showMainProgressBar.set(false);
		}
		if (event instanceof NavigationCancel) {
			this.showMainProgressBar.set(false);
		}
		if (event instanceof NavigationError) {
			this.showMainProgressBar.set(false);
		}
	}
}
