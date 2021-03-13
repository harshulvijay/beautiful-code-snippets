import {useEffect, useRef} from 'preact/hooks';
import type {VNode} from 'preact';
import render from 'preact-render-to-string';
import styled from 'styled-components';
import {Base64} from 'js-base64';

// ---------------- constants ----------------

// default height and width in case one isn't specified
const defaultHeight = 150;
const defaultWidth = 150;

// ----------------   hooks   ----------------

/**
 * Generates SVG markup using the given HTML markup
 *
 * @param {string} htmlMarkup the html markup to wrap in svg `foreignObject`
 * @param {[number, number]} dimensions [height, width]
 * @returns {string} SVG markup
 */
function useSvgForeignObject(
  htmlMarkup: string,
  [width, height]: [number, number] = [defaultWidth, defaultHeight],
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

/**
 * Creates an `HTMLImageElement` with `src` as an inline, Base64-encoded SVG
 * string
 *
 * @param {string} svgMarkup the svg markup to use
 * @returns {HTMLImageElement} the generated `HTMLImageElement` object
 */
function useSvgAsImageSrc(svgMarkup: string): HTMLImageElement {
  // -------- creating an image from the svg markup --------
  const image = new Image();
  // encode the svg markup to base64
  // **note**: the `js-base64` library supports unicode and is hence used
  const base64SvgMarkup = Base64.encode(svgMarkup);
  // the image src
  const imageSrc = `data:image/svg+xml;base64,${base64SvgMarkup}`;

  image.src = imageSrc;

  return image;
}

// ------------- other functions -------------

interface CanvasOptions {
  /**
   * 2D context of the canvas
   */
  context: CanvasRenderingContext2D;
  height: number;
  width: number;
}

/**
 * Paints the canvas with the given background color
 *
 * @param {CanvasOptions} options canvas options
 * @param {string} color the color to use
 */
function setCanvasBgColor(
  {context, width, height}: CanvasOptions,
  color: string,
) {
  if (context) {
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
  }
}

/**
 * Clears the canvas
 *
 * @param {CanvasOptions} options canvas options
 */
function clearCanvas({context, width, height}: CanvasOptions) {
  if (context) {
    // clear the canvas
    context.clearRect(0, 0, width, height);
    // set the background color of the canvas to white
    setCanvasBgColor({context, width, height}, 'white');
  }
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
  width = defaultWidth,
  height = defaultHeight,
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
      const svgMarkup = useSvgForeignObject(htmlMarkup, [width, height]);
      const image = useSvgAsImageSrc(svgMarkup);
      // get canvas context
      const context = canvas.getContext('2d');

      // render the svg markup on the canvas when the image has loaded
      image.onload = async () => {
        if (context) {
          // clear the canvas
          clearCanvas({context, width, height});
          context.drawImage(image, 0, 0);
        }
      };

      return function cleanup() {
        if (context) {
          // since the component has been unmounted/remounted, clear the canvas
          clearCanvas({context, width, height});
        }
      };
    }
  }, [children]); // re-render if children change

  return (
    <>
      {/* pass all the other props to the canvas */}
      <Canvas ref={canvasRef} {...props} height={height} width={width} />
    </>
  );
}

// ----------------  styling  ----------------

const Canvas = styled.canvas`
  background: white;
`;
