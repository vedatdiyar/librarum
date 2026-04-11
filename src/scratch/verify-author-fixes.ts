
import { normalizeText } from "../lib/shared";

// Minimal mock of the logic in author-identity.ts for verification
function levenshteinDistance(left: string, right: string) {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));
  for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
  for (let col = 0; col < cols; col += 1) matrix[0][col] = col;
  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const substitutionCost = left[row - 1] === right[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + substitutionCost
      );
    }
  }
  return matrix[rows - 1][cols - 1];
}

function normalizeAuthorNameKey(name: string) {
  return normalizeText(name.toLocaleLowerCase("tr-TR"));
}

function isAutoMergeMatch(leftName: string, rightName: string) {
  if (leftName === rightName) return true;
  const leftTokens = leftName.split(" ").filter(Boolean);
  const rightTokens = rightName.split(" ").filter(Boolean);
  if (leftTokens.length === 0 || rightTokens.length === 0) return false;
  if (Math.abs(leftTokens.length - rightTokens.length) > 1) return false;
  const isInitialMatch = (t1: string, t2: string) => {
    if (t1 === t2) return true;
    if (t1.length === 1 && t2.startsWith(t1)) return true;
    if (t2.length === 1 && t1.startsWith(t2)) return true;
    return false;
  };
  if (leftTokens.length === rightTokens.length) {
    let totalDistance = 0;
    for (let index = 0; index < leftTokens.length; index += 1) {
      const l = leftTokens[index];
      const r = rightTokens[index];
      if (isInitialMatch(l, r)) continue;
      const distance = levenshteinDistance(l, r);
      if (distance > 2) return false;
      totalDistance += distance;
    }
    return totalDistance <= Math.max(2, leftTokens.length);
  }
  const [shorter, longer] = leftTokens.length < rightTokens.length ? [leftTokens, rightTokens] : [rightTokens, leftTokens];
  if (!isInitialMatch(shorter[0], longer[0]) || !isInitialMatch(shorter[shorter.length - 1], longer[longer.length - 1])) return false;
  let longerIdx = 0;
  let matches = 0;
  for (const sToken of shorter) {
    while (longerIdx < longer.length) {
      if (isInitialMatch(sToken, longer[longerIdx])) {
        matches += 1;
        longerIdx += 1;
        break;
      }
      longerIdx += 1;
    }
  }
  return matches === shorter.length;
}

const testCases = [
  { n1: "Fyodor Mihaylovic Dostoyevski", n2: "Fyodor M. Dostoyevski", expected: true },
  { n1: "FYODOR MİHAYLOVİC DOSTOYEVSKİ", n2: "Fyodor M. Dostoyevski", expected: true },
  { n1: "Fyodor Dostoyevski", n2: "Fyodor M. Dostoyevski", expected: true },
  { n1: "Victor Hugo", n2: "V. Hugo", expected: true },
  { n1: "Lev Tolstoy", n2: "L. N. Tolstoy", expected: true },
  { n1: "Gabriel Garcia Marquez", n2: "Gabriel G. Marquez", expected: true },
  { n1: "Albert Camus", n2: "Albertt Camus", expected: true }, // typo
  { n1: "Stefan Zweig", n2: "S. Zweıg", expected: true }, // Turkish dotless i
];

console.log("Running Author Match Tests...\n");

let allPassed = true;
testCases.forEach(({ n1, n2, expected }) => {
  const norm1 = normalizeAuthorNameKey(n1);
  const norm2 = normalizeAuthorNameKey(n2);
  const result = isAutoMergeMatch(norm1, norm2);
  const passed = result === expected;
  if (!passed) allPassed = false;
  console.log(`${passed ? "✅" : "❌"} [${n1}] vs [${n2}]`);
  console.log(`   Result: ${result}, Expected: ${expected}`);
  console.log(`   Norm1: ${norm1}`);
  console.log(`   Norm2: ${norm2}\n`);
});

if (allPassed) {
  console.log("SUCCESS: All test cases passed!");
} else {
  console.log("FAILURE: Some test cases failed.");
  process.exit(1);
}
