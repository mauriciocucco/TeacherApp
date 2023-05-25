import { Subject } from './subject.interface';

export interface Task {
	id: number;
	name: string;
	description: string;
	date: string;
	subject: Subject;
}
