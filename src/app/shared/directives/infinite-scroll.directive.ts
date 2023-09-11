import {
	AfterViewInit,
	DestroyRef,
	Directive,
	ElementRef,
	inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged } from 'rxjs';
import { debounceTime, filter, fromEvent, map, throttleTime } from 'rxjs';

@Directive({
	selector: '[appInfiniteScroll]',
})
export class InfiniteScrollDirective implements AfterViewInit {
	private destroyRef = inject(DestroyRef);
	private scroll$: any = fromEvent(this.eleRef?.nativeElement, 'scroll').pipe(
		throttleTime(100),
		// debounceTime(100),
		distinctUntilChanged(),
		map((event: any) => event?.target?.scrollLeft),
		filter((scrollLeft: number) => {
			const remainingScroll =
				this.eleRef?.nativeElement?.scrollWidth -
				this.eleRef?.nativeElement?.clientWidth +
				scrollLeft;

			return remainingScroll <=
				this.eleRef.nativeElement?.scrollWidth * 0.2
				? true
				: false;
		}),
		takeUntilDestroyed(this.destroyRef)
	);

	constructor(private eleRef: ElementRef) {}

	ngAfterViewInit(): void {
		//Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
		//Add 'implements AfterViewInit' to the class.
		this.scroll$.subscribe((value: number) =>
			console.log('EMITIOOOOOOOOO', value)
		);
	}
}
