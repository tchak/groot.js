export default function (app, condition, block, elseBlock) {
  if (condition) {
    return block();
  } else if (elseBlock) {
    return elseBlock();
  }
  return [];
}
