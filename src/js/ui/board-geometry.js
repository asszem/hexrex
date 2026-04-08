export function pointInHexagon(clientX, clientY, svg, polygon) {
  const svgPoint = svg.createSVGPoint();
  svgPoint.x = clientX;
  svgPoint.y = clientY;
  const transformed = svgPoint.matrixTransform(svg.getScreenCTM().inverse());
  return polygon.isPointInFill(transformed);
}
