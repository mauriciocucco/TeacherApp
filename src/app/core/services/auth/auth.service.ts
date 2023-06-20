import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ApiService } from '../api/api.service';
import { Login } from '../../interfaces/auth/login.interface';
import { LoginResponse } from '../../interfaces/auth/login-response.interface';
import { ProfileResponse } from '../../interfaces/auth/profile-response.interface';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	private baseUrl = 'auth';

	constructor(private api: ApiService) {}

	public login(login: Login): Observable<boolean> {
		return this.api
			.post<LoginResponse>(`${this.baseUrl}/login`, login)
			.pipe(
				tap(({ access_token }) => {
					if (access_token) {
						localStorage.setItem('token', access_token);
					}
				}),
				map(() => true),
				catchError(() => of(false))
			);
	}

	public verifyAuth(): Observable<boolean> {
		const route = `${this.baseUrl}/profile`;
		const accessToken = localStorage.getItem('token');

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
		return localStorage.getItem('token');
	}
}
