// Standing windmill arms. No reference file yet, so the steps are spoken and timed.
// Step 4 said "right" for both arms in the original text. It now says "left arm reaches".
export default {
  exercise: 'windmill_arms',
  steps: [
    { id: 'stand', text: 'Stand tall with your feet hip width apart.', advance: 'spoken', pauseMs: 1000 },
    {
      id: 'left-side',
      text: 'Swing your left arm up and back in a smooth half circle motion, while your right arm reaches towards the floor. As you do this motion, stretch your left hip towards your right hip.',
      advance: 'timer',
      durationMs: 4000,
      pauseMs: 500,
    },
    { id: 'opposite-side', text: 'Now do this on the opposite side.', advance: 'spoken', pauseMs: 500 },
    {
      id: 'right-side',
      text: 'Swing your right arm up and back in a smooth half circle motion, while your left arm reaches towards the floor. As you do this motion, stretch your right hip towards your left hip.',
      advance: 'timer',
      durationMs: 4000,
    },
  ],
}
