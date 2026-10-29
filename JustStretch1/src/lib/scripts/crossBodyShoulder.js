// Cross body shoulder. Both 30-second holds are timed, not camera-checked, for now.
// Once the joint names are confirmed against the reference JSON, the holds can use 'reach'.
export default {
  exercise: 'cross_body_shoulder',
  steps: [
    { id: 'raise-1', text: 'Raise both arms to shoulder height, forward.', advance: 'spoken', pauseMs: 1000 },
    {
      id: 'left-v-1',
      text: 'Your left arm makes a V shape, with the fist facing your left shoulder, while still facing forward.',
      advance: 'spoken',
      pauseMs: 1000,
    },
    {
      id: 'right-inside-1',
      text: 'For your right arm, stack your right arm inside the V shape of your left arm.',
      advance: 'spoken',
      pauseMs: 1000,
    },
    {
      id: 'pull-1',
      text: 'Pull your left arm towards you. You will feel the stretch towards your right tricep.',
      advance: 'spoken',
      pauseMs: 1000,
    },
    { id: 'hold-1', text: 'Now hold for 30 seconds.', advance: 'timer', durationMs: 30000, pauseMs: 1000 },
    { id: 'release-1', text: 'Release both arms.', advance: 'spoken', pauseMs: 1000 },
    { id: 'switch-sides', text: 'Now do this for the opposite arm.', advance: 'spoken', pauseMs: 1000 },
    { id: 'raise-2', text: 'Raise both arms to shoulder height, forward.', advance: 'spoken', pauseMs: 1000 },
    {
      id: 'right-v-2',
      text: 'Your right arm makes a V shape, with the fist facing your right shoulder, while still facing forward.',
      advance: 'spoken',
      pauseMs: 1000,
    },
    {
      id: 'left-inside-2',
      text: 'For your left arm, stack your left arm inside the V shape of your right arm.',
      advance: 'spoken',
      pauseMs: 1000,
    },
    {
      id: 'pull-2',
      text: 'Pull your right arm towards you. You will feel the stretch towards your left tricep.',
      advance: 'spoken',
      pauseMs: 1000,
    },
    { id: 'hold-2', text: 'Now hold for 30 seconds.', advance: 'timer', durationMs: 30000, pauseMs: 1000 },
    {
      id: 'finish',
      text: 'Release both arms. Congratulations, you have successfully done the cross body shoulder exercise.',
      advance: 'spoken',
    },
  ],
}
