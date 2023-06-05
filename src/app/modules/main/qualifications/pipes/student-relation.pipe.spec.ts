import { StudentRelationPipe } from './student-relation.pipe';

describe('StudentTaskPipe', () => {
	it('create an instance', () => {
		const pipe = new StudentRelationPipe();
		expect(pipe).toBeTruthy();
	});
});
