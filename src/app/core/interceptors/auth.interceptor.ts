import { Injectable } from '@angular/core';
import {
	HttpRequest,
	HttpHandler,
	HttpEvent,
	HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
	constructor(private auth: AuthService) {}

	intercept(
		request: HttpRequest<unknown>,
		next: HttpHandler
	): Observable<HttpEvent<unknown>> {
		// Get the auth token from the service.
		const authToken = this.auth.getAuthorizationToken();

		// Clone the request and replace the original headers with
		// cloned headers, updated with the authorization.
		// const authReq = request.clone({
		// 	headers: request.headers.set(
		// 		'Authorization',
		// 		`Bearer ${authToken}`
		// 	),
		// });

		// Clone the request and set the new header in one step.
		const authReq = request.clone({
			setHeaders: { Authorization: `Bearer ${authToken}` },
		});

		console.log('SETEANDO EL HEADER: ', authReq);

		// send cloned request with header to the next handler.
		return next.handle(authReq);
	}
}