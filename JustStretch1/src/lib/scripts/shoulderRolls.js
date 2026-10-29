// Shoulder rolls. No reference file yet, so every step is spoken and paused on a timer.
export default {
  exercise: 'shoulder_rolls',
  steps: [
    { id: 'arms-relax', text: 'Let your arms relax on both sides.', advance: 'spoken', pauseMs: 2000 },
    { id: 'roll-up-forward', text: 'Roll your shoulders up, forward towards your ears.', advance: 'spoken', pauseMs: 2000 },
    {
      id: 'roll-back-down',
      text: 'Now roll them back and down, while squeezing your shoulder blades together.',
      advance: 'spoken',
      pauseMs: 2000,
    },
    { id: 'up-forward-again', text: 'Again, shoulders up, round them forward.', advance: 'spoken', pauseMs: 2000 },
    { id: 'roll-back-down-again', text: 'Roll back and down again.', advance: 'spoken', pauseMs: 2000 },
    { id: 'settle', text: 'Let them settle. Release any tension.', advance: 'spoken' },
  ],
}
