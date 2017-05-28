const abbreviations = require('../../routes/abbreviations');

describe('abbreviations', () => {
  const scenarios = [
    {
      input: 'a few seconds',
      output: 'seconds'
    },
    {
      input: '2 hours',
      output: '2 hrs'
    },
    {
      input: 'an hour',
      output: '1 hr'
    },
    {
      input: 'a minute',
      output: '1 min'
    },
    {
      input: '2 minutes',
      output: '2 mins'
    },
    {
      input: '10 days',
      output: '10 days'
    }
  ];

  scenarios.forEach((scenario) => {
    test(`"${scenario.input}" => "${scenario.output}"`, () => {
      expect(abbreviations(scenario.input)).toEqual(scenario.output);
    });
  });
});
