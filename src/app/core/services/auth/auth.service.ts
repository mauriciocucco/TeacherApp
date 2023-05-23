import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ApiService } from '../api/api.service';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	private baseUrl = 'auth';

	constructor(private api: ApiService) {}

	//TODO: agregar interfaces
	public login(login: any): Observable<boolean> {
		return this.api.post<any>('login', login).pipe(
			tap(resp => {
				if (resp.access_token) {
					localStorage.setItem('token', resp.access_token);
				}
			}),
			map(resp => true),
			catchError(err => of(false))
		);
	}

	//TODO: agregar interfaces
	public verifyAuth(): Observable<boolean> {
		const route = `${this.baseUrl}/user`;

		if (!localStorage.getItem('token')) {
			return of(false);
		}

		return this.api.get<any>(route).pipe(
			// tap((resp: any) => {
			//   if (resp) {
			//     this.setUserState(resp);
			//   }
			// }),
			map(resp => {
				return true;
			}),
			catchError(err => {
				return of(false);
			})
		);
	}
}
