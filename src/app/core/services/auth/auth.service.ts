import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ApiService } from '../api/api.service';
import { Login } from '../../interfaces/auth/login.interface';
import { LoginResponse } from '../../interfaces/auth/login-response.interface';
import { ProfileResponse } from '../../interfaces/auth/profile-response.interface';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	private baseUrl = 'auth';

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		private api: ApiService
	) {}

	public login(login: Login): Observable<boolean> {
		return this.api
			.post<LoginResponse>(`${this.baseUrl}/login`, login)
			.pipe(
				tap(({ access_token }) => {
					if (access_token) {
						isPlatformBrowser(this.platformId)
							? localStorage.setItem('token', access_token)
							: null;
					}
				}),
				map(() => true),
				catchError(() => of(false))
			);
	}

	public verifyAuth(): Observable<boolean> {
		const route = `${this.baseUrl}/profile`;
		const accessToken = isPlatformBrowser(this.platformId)
			? localStorage.getItem('token')
			: null;

		if (!accessToken) {
			return of(false);
		}

		return this.api
			.get<ProfileResponse>(route, {
				headers: {
					authorization: `Bearer ${accessToken}`,
				},
			})
			.pipe(
				map(() => {
					return true;
				}),
				catchError(() => {
					return of(false);
				})
			);
	}

	public getAuthorizationToken() {
		return isPlatformBrowser(this.platformId)
			? localStorage.getItem('token')
			: null;
	}
}
