
// Direct implementation of normalizeText to avoid imports
function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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
  return false;
}

const n1 = normalizeAuthorNameKey("FYODOR MİHAYLOVİC DOSTOYEVSKİ");
const n2 = normalizeAuthorNameKey("Fyodor M. Dostoyevski");

console.log("N1:", n1);
console.log("N2:", n2);
console.log("Auto Match:", isAutoMergeMatch(n1, n2));
