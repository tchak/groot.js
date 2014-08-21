export default function (app, collection, block, elseBlock) {
  if (collection && collection.count()) {
    return collection.map(block);
  } else if (elseBlock) {
    return elseBlock();
  }
}
