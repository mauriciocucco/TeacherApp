import { Subject } from './subject.interface';

export interface Exam {
	id: number;
	name: string;
	description: string;
	date: string;
	subject: Subject;
}
