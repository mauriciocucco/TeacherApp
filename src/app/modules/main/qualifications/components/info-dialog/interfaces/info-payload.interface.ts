import { Subject } from '../../../../../../core/interfaces/subject.interface';
export interface InfoPayload {
	name: string;
	date: string;
	description?: string;
	id: number;
	subject: Subject;
}
