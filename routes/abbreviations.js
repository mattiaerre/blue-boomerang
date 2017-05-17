const abbreviations = input => (
  input
    .replace('a few ', '')
    .replace('hours', 'hrs')
    .replace('hour', 'hr')
    .replace('minutes', 'mins')
    .replace('minute', 'min')
    .replace('an', '1')
    .replace('a', '1')
);

module.exports = abbreviations;
