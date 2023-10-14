import { Injectable } from '@angular/core';
import { Observable, of, timer } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';

import { PreloadingStrategy, Route } from '@angular/router';

@Injectable()
export class CustomPreloadingStrategy implements PreloadingStrategy {
	preload(route: Route, loadMe: () => Observable<any>): Observable<any> {
		if (route.data && route.data['preload']) {
			console.log('preload called on ' + route.path);
			return loadMe();
		} else {
			console.log('no preload for the path ' + route.path);
			return of(null);
		}
	}
}
