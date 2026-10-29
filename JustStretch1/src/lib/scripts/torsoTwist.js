// Standing torso twist. No reference file yet, so the steps are spoken and timed.
export default {
  exercise: 'torso_twist',
  steps: [
    {
      id: 'stance',
      text: 'Stand with your feet slightly wider than hip width, and your arms relaxed.',
      advance: 'spoken',
      pauseMs: 1000,
    },
    {
      id: 'fighting-stance',
      text: 'Raise both arms to shoulder height in a fighting stance.',
      advance: 'spoken',
      pauseMs: 1000,
    },
    {
      id: 'turn-right',
      text: 'Turn your upper body to the right. Let your arms swing along with the turn, and hold.',
      advance: 'timer',
      durationMs: 3000,
      pauseMs: 500,
    },
    {
      id: 'return-center',
      text: 'Return to the center.',
      advance: 'spoken',
      pauseMs: 1000,
    },
    {
      id: 'turn-left',
      text: 'Repeat on the left side, at a slow, steady pace. Turn your upper body to the left, and hold.',
      advance: 'timer',
      durationMs: 3000,
      pauseMs: 500,
    },
    { id: 'finish', text: 'Return to the center.', advance: 'spoken' },
  ],
}
