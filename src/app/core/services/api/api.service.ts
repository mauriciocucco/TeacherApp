import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
	providedIn: 'root',
})
export class ApiService {
	constructor(private httpClient: HttpClient) {}

	public get<T>(endpoint: string, options = {}): Observable<T> {
		return this.httpClient.get<T>(environment.apiUrl + endpoint, options);
	}

	public post<T>(endpoint: string, data: unknown): Observable<T> {
		return this.httpClient.post<T>(environment.apiUrl + endpoint, data);
	}

	public put<T>(endpoint: string, data: unknown): Observable<T> {
		return this.httpClient.put<T>(environment.apiUrl + endpoint, data);
	}

	public patch<T>(endpoint: string, data: unknown): Observable<T> {
		return this.httpClient.patch<T>(environment.apiUrl + endpoint, data);
	}

	public delete<T>(endpoint: string): Observable<T> {
		return this.httpClient.delete<T>(environment.apiUrl + endpoint);
	}
}
