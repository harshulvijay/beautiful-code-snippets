import {useEffect, useRef} from 'preact/hooks';
import type {VNode} from 'preact';
import render from 'preact-render-to-string';
import styled from 'styled-components';

// ----------------   hooks   ----------------

/**
 * Generates SVG markup using the given HTML markup
 *
 * @param {string} htmlMarkup the html markup to wrap in svg `foreignObject`
 * @param {[number, number]} dimensions [height, width]
 * @returns {string} SVG markup
 */
function useSVGForeignObject(
  htmlMarkup: string,
  [width, height]: [number, number] = [150, 150],
): string {
  // -------- generating the svg markup from the given html markup --------
  // **note**: the xml namespaces must **not** be switched for simplicity
  // ie, the **main** xmlns should be xhtml and not svg
  const namespaces = [
    `xmlns="http://www.w3.org/1999/xhtml"`,
    `xmlns:svg="http://www.w3.org/2000/svg"`,
  ];

  const svgMarkup = [
    `<svg:svg ${namespaces.join(` `)} height="${height}" width="${width}">`,
    // use `foreignObject` from the `svg` namespace
    // it allows us to use html inside svg, which can then be rendered on a
    // canvas
    `<svg:foreignObject height="${height}" width="${width}">`,
    // our html markup goes here
    htmlMarkup,
    `</svg:foreignObject>`,
    `</svg:svg>`,
  ].join(``);

  return svgMarkup;
}

// ---------------- component ----------------

/**
 * Renders all the children passed to it as an image on a canvas.
 *
 * @param {VNode} children the children of this element
 * @param {number} height height of.. basically everything here
 * @param {number} width width of.. basically everything here
 * @param {any[]} props the rest of the props
 */
export function RenderOnCanvas({
  children,
  width = 150,
  height = 150,
  ...props
}: {
  // for all the other props
  [key: string]: any;

  // `children` **needs** to be of type `VNode` so that we don't get bad red
  // squiggles while retrieving the html markup using `preact-render-to-string`
  children: VNode;
  width?: number;
  height?: number;
}) {
  // a ref for our canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const {current: canvas} = canvasRef;

    if (canvas) {
      // getting the final html markup of all the children when rendered
      const htmlMarkup = render(children);
      const svgMarkup = useSVGForeignObject(htmlMarkup, [width, height]);

      // -------- creating an image from the svg markup --------
      let image = new Image();
      // encode the svg markup to base64
      const base64SvgMarkup = btoa(svgMarkup);
      // the image src
      const imageSrc = `data:image/svg+xml;base64,${base64SvgMarkup}`;
      // get canvas context
      const context = canvas.getContext('2d');

      function setCanvasBgColor(color: string) {
        if (context) {
          context.fillStyle = color;
          context.fillRect(0, 0, width, height);
        }
      }

      function clearCanvas() {
        if (context) {
          // clear the canvas
          context.clearRect(0, 0, width, height);
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
        }
      };

      image.src = imageSrc;

      return function cleanup() {
        // since the component has been unmounted/remounted, clear the canvas
        clearCanvas();
      };
    }
  }, [children]); // re-render if children change

  return (
    <>
      {/* pass all the other props to the canvas */}
      <Canvas ref={canvasRef} {...props} />
    </>
  );
}

// ----------------  styling  ----------------

const Canvas = styled.canvas`
  background: white;
`;
