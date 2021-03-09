/**
 * Imports everything and renders the app using Preact.
 */
const callPreact = async () => {
  const {render} = await import('react');
  const {App} = await import('./app');
  await import('./index.css');

  render(<App />, document.getElementById('app')!);
};

if (import.meta.env.DEV) {
  (async () => {
    // we're in dev mode!!
    // that means we have to import preact devtools

    try {
      // try to import preact devtools
      await import('preact/devtools');
      callPreact();
    } catch (error) {
      // uh oh
      // we encountered an error :(
      const {render} = await import('react');

      render(
        <>
          <code>
            <b>ERROR:</b> <br />
            {error.message}
          </code>
        </>,
        document.getElementById('app')!,
      );
    }
  })();
} else if (import.meta.env.PROD) {
  // we're in production mode!!
  // no need to import preact devtools
  // so we're rendering directly
  callPreact();
}
