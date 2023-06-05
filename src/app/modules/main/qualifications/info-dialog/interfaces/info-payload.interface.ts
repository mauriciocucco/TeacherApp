import { Work } from '../../../../../core/enums/work.enum';
export interface InfoPayload {
	name: string;
	date: string;
	description?: string;
	workId: number;
	workType: Work;
}
