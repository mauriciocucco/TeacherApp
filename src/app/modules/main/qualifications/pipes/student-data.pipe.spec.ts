import { StudentDataPipe } from './student-data.pipe';

describe('StudentDataPipe', () => {
  it('create an instance', () => {
    const pipe = new StudentDataPipe();
    expect(pipe).toBeTruthy();
  });
});
