class Byte {
  constructor(string) {
    this.bits = new Array(8)
    if(string && string.length == 8){
      for (var i = 0; i < string.length; i++) {
        this.bits[i] = string[i] == 1
      }
    }else{
      this.bits.fill(false)
    }
  }

  get(index){
    return this.bits[index]
  }

  set(index, value){
    if(index >= 0 && index < 8){
      if(typeof value == "boolean"){
        this.bits[index] = value
      }else{
        console.log(typeof value);
        throw new Error("Value needs to be of type Boolean")
      }
    }else{
      throw new Error(`Index ${index} is out of range (0-8)`)
    }
  }

  forEach(iterator){
    for (var i = 0; i < 8; i++) {
      this.bits[i] = iterator(this.bits[i]) || this.bits[i]
    }
  }

  toString(){
    var string = 'Byte{ '
    for (var i = 0; i < 8; i++) {
      string += (i == 0 ? '' : i == 4 ? '  ' : ' ') + (this.bits[i] ? 1 : 0)
    }
    string += ' }'
    return string
  }

  toRawValue(){
    var string = ''
    for (var i = 0; i < this.bits.length; i++) {
      string += this.bits[i] ? 1 : 0
    }
    return string
  }
}

class BytePair {
  constructor(byteA, byteB) {
    this.byteA = byteA
    this.byteB = byteB
  }

  applyOperation(operation){
    var outputByte = new Byte()
    console.log(this.byteB.bits);
    for (var i = 0; i < 8; i++) {
      outputByte.set(i, operation.apply(this.byteA.bits[i], this.byteB.bits[i]))
    }
    return outputByte
  }

  toString(){
    var string = 'BytePair{\n '
    for (var i = 0; i < 8; i++) {
      string += (i == 0 ? '' : i == 4 ? '  ' : ' ') + (this.byteA.bits[i] ? 1 : 0)
    }
    string += '\n '
    for (var i = 0; i < 8; i++) {
      string += (i == 0 ? '' : i == 4 ? '  ' : ' ') + (this.byteB.bits[i] ? 1 : 0)
    }
    string += '\n}'
    return string
  }
}

function validateByte(string){
  if(string.length == 8){
    var valid = false
    for (var i = 0; i < string.length; i++) {
      if(string[i] == '0' || string[i] == '1'){
        valid = true
      }else{
        return false
      }
    }
  }else{
    return false
  }
  return valid
}