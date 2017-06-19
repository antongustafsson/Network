class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
  }
}

class Color {
  constructor(options) {
    if(options.rgb || options.rgba){
      this.r = options.rgb.r
      this.g = options.rgb.g
      this.b = options.rgb.b
      this.a = options.rgb.a || 255
    }else if (options.hex) {
      var length = options.hex.toString().length
      this.r = options.hex >> 16 & 0xFF
      this.g = options.hex >> 8 & 0xFF
      this.b = options.hex & 0xFF
      this.a = options.alpha || 255
    }
  }

  toString(){
    if(this.a == 255){
      return (`rgb(${this.r}, ${this.g}, ${this.b})`)
    }else{
      return (`rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`)
    }
  }
}

class NodeConnection {
  constructor(nodeA, nodeB, lineId) {
    this.nodeA = nodeA
    this.nodeB = nodeB
    this.lineId = lineId
  }
}

class Node {
  constructor(properties) {
    this.contentLayer = null
    this.element = document.createElement('div')
    this.element.classList.add('node')
    this.element.setAttribute('tabindex', 0)
    this.element.style.top = '0px'
    this.element.style.left = '0px'
    this.connections = []
    this.element.node = this
    this.element.innerHTML = ''
    this.removable = true
    this.properties = {}
    if(properties){
      var keys = Object.keys(properties)
      for (var i = 0; i < keys.length; i++) {
        this.properties[keys[i]] = properties[keys[i]]
      }
    }
    this.element.addEventListener('click', (e) => {
      this.focus()
    })
    this.id = uuid()
  }

  get position(){
    return new Point(parseFloat(this.element.style.left) + 64, parseFloat(this.element.style.top) + 16)
  }

  set position(val) {
    this.element.style.left = (val.x - 64) + 'px'
    this.element.style.top = (val.y - 16) + 'px'
    for (var i = 0; i < this.connections.length; i++) {
      this.contentLayer.svgLayer.objects[this.connections[i].lineId].pointA = this.connections[i].nodeA.position
      this.contentLayer.svgLayer.objects[this.connections[i].lineId].pointB = this.connections[i].nodeB.position
    }
  }

  set value(val) {
    this.element.innerHTML = val
  }

  get value(){
    return this.element.innerHTML
  }

  connect(node){
    if(this.contentLayer.nodes.indexOf(this) > -1 && this.contentLayer.nodes.indexOf(node) > -1){
      var svgLine = new SVGLine(
        new Line(
          this.position, node.position
        )
      )
      var connection = new NodeConnection(this,
        node,
        this.contentLayer.svgLayer.draw(svgLine)
      )
      this.connections.push(connection)
      node.connections.push(connection)
    }
  }

  remove(){
    if(this.removable){
      this.deselect()
      this.element.remove()
      for (var i = 0; i < this.connections.length; i++) {
        this.contentLayer.svgLayer.objects[this.connections[i].lineId].element.remove()
      }
      this.contentLayer.nodes.splice(this.contentLayer.nodes.indexOf(this), 1)
      delete this
      if(this.contentLayer.nodes[1]){
        this.contentLayer.nodes[1].focus()
      }
    }
  }

  focus(){
    this.contentLayer.deselectAll()
    if(this.contentLayer.selectedNode != this){
      this.element.focus()
      this.element.classList.toggle('node-selected', true)
    }
    this.contentLayer.selectedNode = this
  }

  deselect(){
    this.element.classList.remove('node-selected')
    this.contentLayer.selectedNode = null
  }

  receive(message){
    var operation = new BinaryOperation(this.properties.operation)
    var byteA = new Byte(message)
    var byteB = new Byte(this.properties.byteValue)
    var bytePair = new BytePair(byteA, byteB)
    this.value = message.value
    this.transmit(bytePair.applyOperation(operation).toRawValue(), message.source)
  }

  transmit(value, from){
    for (var i = 0; i < this.connections.length; i++) {
      if(((this.connections[i].nodeA != from && this.connections[i].nodeA != this) || (this.connections[i].nodeB != from && this.connections[i].nodeB != this))){
        if(this.connections[i].nodeA != this){
          this.connections[i].nodeA.receive(new Message(this, this.connections[i].nodeA, value))
        } else if(this.connections[i].nodeB != this){
          this.connections[i].nodeB.receive(new Message(this, this.connections[i].nodeB, value))
        }
      }
    }
  }

  update(){
    this.transmit(this.value, this)
  }

  evaluate(value){
    this.value = value
    this.transmit(value, this)
  }
}

class Message {
  constructor(source, target, value) {
    this.source = source
    this.target = target
    this.value = value
  }
}

class ContentLayer {
  constructor(element, svgLayer) {
    this.element = element
    this.nodes = []
    this.svgLayer = svgLayer || null
    this.moving = null
    this.sn = null
    this.handlers = {
      selectedchanged: []
    }
    addEventListener('mousemove', (e) => {
      if(this.moving){
        this.moving.position = new Point(e.x, e.y)
      }
    })
    addEventListener('mouseup', () => {
      this.moving = null
    })

    // addEventListener('mousedown', (e) => {
    //   if(e.target.className != 'node'){
    //     this.selectedNode = null
    //   }
    // })

    this.element.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Backspace':
          if(this.selectedNode){
            this.selectedNode.remove()
            this.selectedNode = null
          }
          break;
        default:

      }
    })
  }

  set selectedNode(val){
    this.sn = val
    this.triggerEvent('selectedchanged', this.sn)
  }

  get selectedNode(){
    return this.sn
  }

  on(event, handler){
    if(this.handlers[event]){
      this.handlers[event].push(handler)
    }
  }

  triggerEvent(event, args){
    for (var i = 0; i < this.handlers[event].length; i++) {
      this.handlers[event][i](args)
    }
  }

  addNode(node){
    if(this.nodes.indexOf(node) < 0){
      this.element.appendChild(node.element)
    }
    node.contentLayer = this
    node.element.addEventListener('mousedown', (e) => {
      if(e.target.classList.contains('node')){
        this.selectedNode = node
        this.moving = node
      }
    })
    node.focus()
    return this.nodes.push(node) - 1
  }

  deselectAll(){
    for (var i = 0; i < this.nodes.length; i++) {
      this.nodes[i].deselect()
    }
  }
}

class Line {
  constructor(pointA, pointB) {
    this.pointA = pointA
    this.pointB = pointB
  }
}

class SVGLayer {
  constructor(element) {
    this.element = element
    var style = getComputedStyle(this.element)
    var size = [parseFloat(style.width), parseFloat(style.height)]
    this.svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    this.svgContainer.setAttribute('width', size[0])
    this.svgContainer.setAttribute('height', size[1])
    this.objects = []
    this.element.appendChild(this.svgContainer)
  }

  draw(svgObject){
    if(this.objects.indexOf(svgObject) < 0){
      this.svgContainer.appendChild(svgObject.element)
      return this.objects.push(svgObject) - 1
    }
  }
}

class SVGObject {
  constructor() {
    this.element = null
  }
}

class SVGLine extends SVGObject {
  constructor(line, width, color) {
    super()
    this.element = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    this.element.setAttribute('x1', line.pointA.x)
    this.element.setAttribute('y1', line.pointA.y)
    this.element.setAttribute('x2', line.pointB.x)
    this.element.setAttribute('y2', line.pointB.y)
    this.element.style['stroke'] = (color || new Color({hex: 0xFF0000})).toString()
    this.element.style['stroke-width'] = width || 2
  }

  set pointA(val) {
    this.element.setAttribute('x1', val.x)
    this.element.setAttribute('y1', val.y)
  }

  set pointB(val) {
    this.element.setAttribute('x2', val.x)
    this.element.setAttribute('y2', val.y)
  }
}

class Controller {
  constructor(element) {
    this.element = element
    this.inputs = []
  }

  addInput(controllerInput){
    this.inputs.push(controllerInput)
    controllerInput.mount()
    this.element.appendChild(controllerInput.element)
  }

  set enabled(val) {
    this.element.classList.toggle('controller-disabled', !val)
  }

  get enabled() {
    return this.element.classList.indexOf('controller-disabled') < 0
  }

  getInputById(id){
    for (var i = 0; i < this.inputs.length; i++) {
      if(this.inputs[i].id == id){
        return this.inputs[i]
      }
    }
    return null
  }
}

class Alert {
  constructor(options) {
    options = options || {
      title: 'Message',
      text: 'Hello'
    }
    this.title = options.title
    this.textContent = options.text
    this.actions = []
    this.element = document.createElement('div')
    this.element.className = 'alert-window'
    this.element.setAttribute('tabindex', '0')
    this.element.addEventListener('keydown', (e) => {
      if(e.key == 'Enter'){
        this.actions[0].handler(this)
      }
    })

    var contentElement = document.createElement('div')
    contentElement.className = 'content'

    var titleElement = document.createElement('div')
    titleElement.className = 'alert-title'
    titleElement.innerHTML = this.title

    var textElement = document.createElement('div')
    textElement.className = 'alert-text'
    textElement.innerHTML = this.textContent

    this.actionBar = document.createElement('div')
    this.actionBar.className = 'alert-actionbar'

    contentElement.appendChild(titleElement)
    contentElement.appendChild(textElement)
    contentElement.appendChild(this.actionBar)
    this.element.appendChild(contentElement)
  }

  addAction(action){
    this.actions.push(action)
    var actionElement = document.createElement('div')
    actionElement.className = 'alert-action'
    actionElement.innerHTML = action.text
    actionElement.addEventListener('click', (e) => {
      action.handler(this)
    })
    this.actionBar.appendChild(actionElement)
  }

  show(){
    document.body.appendChild(this.element)
    this.element.focus()
    setTimeout(() => {
      this.element.classList.toggle('alert-window-shown', true)
    }, 10)
  }

  close(){
    this.element.classList.toggle('alert-window-shown', false)
    setTimeout(() => {
      this.element.remove()
      delete this
    }, 200)
  }
}

class AlertAction {
  constructor(text, handler) {
    this.text = text
    this.handler = handler
  }
}

class ControllerInput {
  constructor(options) {
    this.options = options || {
      title: 'Input',
      changeCallback: () => {},
      defaultValue: '',
      id: uuid()
    }
    this.defaultValue = options.defaultValue
    this.id = options.id || uuid()
    this.element = document.createElement('div')
    this.element.className = 'input'
    this.element.setAttribute('tabindex', 0)
    this.inputLabel = document.createElement('div')
    this.inputLabel.className = 'input-label'
    this.inputLabel.innerHTML = this.options.title

    this.inputElement = document.createElement('input')
    this.inputElement.className = 'value-input'
    this.inputElement.addEventListener('keydown', (e) => {
      if(e.key == 'Enter'){
        this.options.changeCallback(this.inputElement.value, this)
        this.inputElement.lastValue = this.inputElement.value
      }
    })

    this.inputElement.addEventListener('blur', (e) => {
      if(this.inputElement.value != this.inputElement.lastValue){
        this.options.changeCallback(this.inputElement.value, this)
        this.inputElement.lastValue = this.inputElement.value
      }
    })
    this.applyButton = document.createElement('div')
    this.applyButton.className = 'apply-button'
    this.applyButton.innerText = 'Verkställ'
    this.applyButton.addEventListener('click', (e) => {
      this.options.changeCallback(this.inputElement.value, this)
    })

    this.value = this.options.defaultValue || ''
  }

  set value(val){
    this.inputElement.value = val
  }

  get value(){
    return this.inputElement.value
  }

  mount(){
    this.element.appendChild(this.inputLabel)
    this.element.appendChild(this.inputElement)
    this.element.appendChild(this.applyButton)
  }
}

class OptionControllerInput extends ControllerInput {
  constructor(options) {
    super(options)
    this.options = options || {
      title: 'Input',
      changeCallback: () => {},
      defaultValue: ''
    }
    this.inputElement = document.createElement('select')
    this.inputElement.className = 'value-input'
    this.inputElement.addEventListener('change', () => {

    })
  }

  addOption(text){
    var optionElement = document.createElement('option')
    optionElement.innerHTML = text
    this.inputElement.appendChild(optionElement)
  }
}

var defaultProps = {
  operation: 0,
  byteValue: new Byte()
}

var svgLayer, contentLayer, controller, node
addEventListener('load', (e) => {
  var svgLayerElement = document.querySelector('.svglayer')
  var contentLayerElement = document.querySelector('.contentlayer')
  var controllerElement = document.querySelector('.controller')
  svgLayer = new SVGLayer(svgLayerElement)
  contentLayer = new ContentLayer(contentLayerElement, svgLayer)

  contentLayer.on('selectedchanged', (e) => {
    if(e){
      if(controller && e){
        var input = controller.getInputById('operation').inputElement
        input.options.selectedIndex = e.properties.operation
        var input = controller.getInputById('bytevalue').inputElement
        input.value = e.properties.byteValue.toRawValue()
      }
    }
  })

  node = new Node(defaultProps)

  node.removable = false
  node.position = new Point((innerWidth - 256) / 2, 64)
  contentLayer.addNode(node)
  node.focus()
  node.value = '00000000'

  controller = new Controller(controllerElement)

  var startValueInput = new ControllerInput({title: 'Startvärde', changeCallback: (value) => {
    if(value == ''){
      startValueInput.value = new Byte().toRawValue()
      value = new Byte().toRawValue()
      node.update()
    }
    if(!validateByte(value)){
      startValueInput.value = startValueInput.defaultValue
      var alert = new Alert({
        title: 'Meddelande',
        text: `Den angivna strängen "${value}" går inte att tolka till en Byte.`
      })
      alert.addAction(new AlertAction('Okej', (alert) => {
        controller.enabled = true
        alert.close()
      }))
      controller.enabled = false
      alert.show()
    }else{
      node.value = (startValueInput.value = value)
      node.update()
    }
  }, defaultValue: '00000000', id: 'startValue'})

  var valueInput = new ControllerInput({title: 'Meddelande', changeCallback: (value) => {
    var alert = new Alert({
      title: 'Meddelande',
      text: value
    })
    alert.addAction(new AlertAction('OK', (alert) => {
      controller.enabled = true
      alert.close()
    }))
    controller.enabled = false
    alert.show()
  }, defaultValue: 'Test', id: 'message'})

  var operationInput = new OptionControllerInput({title: 'Operation', changeCallback: (value, sender) => {
    contentLayer.selectedNode.properties.operation = sender.inputElement.options.selectedIndex
    node.update()
  }, id: 'operation'})
  var ops = Object.keys(operations)
  for (var i = 0; i < ops.length; i++) {
    operationInput.addOption(ops[i])
  }

  var byteInput = new ControllerInput({title: 'Muterare', changeCallback: (value) => {
    contentLayer.selectedNode.properties.byteValue = new Byte(value)
    node.update()
  }, defaultValue: '00000000', id: 'bytevalue'})
  controller.addInput(startValueInput)
  controller.addInput(valueInput)
  controller.addInput(byteInput)
  controller.addInput(operationInput)
})


addEventListener('click', (e) => {
  var sn = contentLayer.selectedNode || null
  if(!e.target.classList.contains('node') && e.path.indexOf(contentLayer.element) > -1){
    if(sn !== null){
      var node = new Node(defaultProps)
      node.position = new Point(e.x, e.y)
      contentLayer.addNode(node)
      node.connect(sn)
      node.focus()
      contentLayer.selectedNode = node
      contentLayer.nodes[0].update()
    }
  }
})

