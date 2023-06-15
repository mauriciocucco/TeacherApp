import { Injectable } from '@angular/core';
import {
	HttpRequest,
	HttpHandler,
	HttpEvent,
	HttpInterceptor,
	HttpErrorResponse,
} from '@angular/common/http';
import {
	Observable,
	Subject,
	catchError,
	throttleTime,
	throwError,
} from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class UnauthorizedInterceptor implements HttpInterceptor {
	private throttleLogout = new Subject();

	constructor(private router: Router, private _snackBar: MatSnackBar) {
		this.throttleLogout.pipe(throttleTime(5000)).subscribe(() => {
			this._snackBar.open(
				'Usted no posee acceso o su token ha expirado.',
				'',
				{ duration: 4000 }
			);
			this.router.navigate(['/auth/login']);
		});
	}

	intercept(
		request: HttpRequest<unknown>,
		next: HttpHandler
	): Observable<HttpEvent<unknown>> {
		return next.handle(request).pipe(
			catchError((response: HttpErrorResponse) => {
				if (response.status === 401) {
					this.throttleLogout.next(true);
				}

				return throwError(() => new Error(response.message));
			})
		);
	}
}
