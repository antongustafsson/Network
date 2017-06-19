var svgLine = new SVGLine(new Line(new Point(0, 0), new Point(8, 8)))
svgLayer.draw(svgLine)

for (var i = 0; i < 64; i++) {
  var node = new Node()
  var margin = 40
  node.position = new Point(margin + Math.random() * (innerWidth - margin), margin + Math.random() * (innerHeight - margin))
  contentLayer.addNode(node)
}

for (var i = 0; i < 64; i++) {
  var randomNodeIndexA = Math.floor(Math.random() * contentLayer.nodes.length)
  var randomNodeIndexB = Math.floor(Math.random() * contentLayer.nodes.length)
  contentLayer.nodes[randomNodeIndexA].connect(contentLayer.nodes[randomNodeIndexB])
}

var nodeA = new Node()
nodeA.position = new Point(40, 40)
contentLayer.addNode(nodeA)

var nodeB = new Node()
nodeB.position = new Point(100, 120)
contentLayer.addNode(nodeB)

var nodeC = new Node()
nodeC.position = new Point(240, 220)
contentLayer.addNode(nodeC)

nodeA.connect(nodeB)
nodeA.connect(nodeC)