import {useEffect, useRef} from 'preact/hooks';
import type {VNode} from 'preact';
import render from 'preact-render-to-string';
import './RenderOnCanvas.css'

/**
 * Renders all the children passed to it as an image on a canvas.
 */
export function RenderOnCanvas({children}: {children: VNode}) {
  // a ref for our canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const {current: canvas} = canvasRef;

    if (canvas) {
      // getting the final html markup of all the children when rendered
      const htmlMarkup = render(children);

      // -------- generating the svg markup from the given html markup --------
      // **note**: the xml namespaces must **not** be switched for simplicity
      // ie, the **main** xmlns should be xhtml and not svg
      const namespaces = [
        `xmlns="http://www.w3.org/1999/xhtml"`,
        `xmlns:svg="http://www.w3.org/2000/svg"`,
      ];

      const svgMarkup = [
        `<svg:svg ${namespaces.join(` `)} height="500" width="500">`,
        // use `foreignObject` from the `svg` namespace
        // it allows us to use html inside svg, which can then be rendered on a
        // canvas
        `<svg:foreignObject height="500" width="500">`,
        // our html markup goes here
        htmlMarkup,
        `</svg:foreignObject>`,
        `</svg:svg>`,
      ].join(``);

      // -------- creating an image from the svg markup --------
      let image = new Image();
      const imageBlob = new Blob([svgMarkup], {
        type: `image/svg+xml;charset=utf-8`,
      });
      const imageSrc = URL.createObjectURL(imageBlob);
      // get canvas context
      const context = canvas.getContext('2d');

      function setCanvasBgColor(color: string) {
        if (context) {
          context.fillStyle = color;
          context.fillRect(0, 0, 500, 500);
        }
      }

      function clearCanvas() {
        if (context) {
          // clear the canvas
          context.clearRect(0, 0, 500, 500);
          // set the background color of the canvas to white
          setCanvasBgColor('white');
        }
      }

      // render the svg markup on the canvas when the image has loaded
      image.onload = async () => {
        if (context) {
          // clear the canvas
          clearCanvas();
          context.drawImage(image, 0, 0);

          // revoke the image url
          URL.revokeObjectURL(imageSrc);
        }
      };

      image.src = imageSrc;

      return function cleanup() {
        // since the component has been unmounted/remounted, clear the canvas
        clearCanvas();
        // revoke the image url
        URL.revokeObjectURL(imageSrc);
      };
    }
  }, [children]); // re-render if children change

  return (
    <>
      <canvas ref={canvasRef} />
    </>
  );
}
