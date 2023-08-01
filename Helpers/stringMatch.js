export function findClosestMatch(commandName, commandList) {
console.log(commandName, commandList)
  let closestMatch = null;
  let closestMatchDistance = Infinity;

  for (const cmd of commandList) {
    const distance = levenshteinDistance(commandName, cmd.name);
    if (distance < closestMatchDistance) {
      closestMatch = cmd.name;
      closestMatchDistance = distance;
    }
    for (const alias of cmd.aliases) {
      const aliasDistance = levenshteinDistance(commandName, alias);
      if (aliasDistance < closestMatchDistance) {
        closestMatch = cmd.name;
        closestMatchDistance = aliasDistance;
      }
    }
  }

  return closestMatch;
}

function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  matrix[0] = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}
