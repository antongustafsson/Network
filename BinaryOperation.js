class BinaryOperation {
  constructor(opId) {
    this.id = opId
  }

  apply(valueA, valueB){
    switch (this.id) {
      case 0:
        return valueA && valueB
        break;
      case 1:
        return valueA || valueB
        break;
      case 2:
        return valueA ? !valueB : valueB
        break;
      default:
      break;
    }
  }
}

define = (object, key, value) => {
  Object.defineProperty(object, key, {
    value: value,
    writable: false,
    enumerable: false,
    configurable: false
  })
}

const operations = {
  'AND': 0,
  'OR': 1,
  'XOR': 2
}

let keys = Object.keys(operations)

for (var i = 0; i < keys.length; i++) {
  define(BinaryOperation, keys[i], operations[keys[i]])
}