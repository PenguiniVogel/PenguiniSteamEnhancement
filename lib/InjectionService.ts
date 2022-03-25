/**
 *
 * @author Felix Vogel
 */
/** */
module InjectionServiceLib {

    const ISL_READY = 'EVENT_ISL_READY';

    let injectionsPending: number = 0;
    let readyRetry: number = 0;
    let ready: boolean = false;
    let cspMeta: boolean = false;

    export let encode_content: boolean = true;
    export let append_on_document: boolean = false;

    export function onReady(callback: () => void): void {
        if (ready) {
            callback();
        } else {
            injectionsPending ++;
            window.addEventListener(ISL_READY, () => callback());
        }
    }

    /**
     * CAUTION - This is really, really dangerous! <br>
     * Please for the love of god never ever use this unless you really have to.
     *
     * @param csp
     */
    export function injectCSPMeta(csp: string = `default-src 'self'; style-src 'self' 'unsafe-inline'; media-src *; img-src *; script-src 'self' 'unsafe-eval' 'unsafe-inline' 'sha256-0e/McRxwYjvJoKF1YBMVz5l6AJO3gnkqTbMYg/B2Kp8='`): void {
        onReady(() => {
            let meta = document.createElement('meta');

            meta.setAttribute('data-isl', 'injected-meta');
            meta.setAttribute('http-equiv', 'Content-Security-Policy');
            meta.setAttribute('content', csp);

            document.querySelector('head').appendChild(meta);

            cspMeta = true;
        });
    }

    /**
     * Inject code <br>
     * This will add a new script tag to the document
     *
     * @param code The code to append
     * @param appendOn Where to append, head or body (head is default)
     */
    export function injectCode(code: string, appendOn: 'head' | 'body' = 'head'): void {
        onReady(() => {
            if (cspMeta) {
                let s = document.createElement('script');

                s.setAttribute('data-isl', 'injected-script');

                s.innerHTML = code;

                document.querySelector(appendOn).appendChild(s);
            } else {
                let a = document.createElement('a');

                let inner = `s.innerHTML=\`${code}\``;
                if (encode_content) {
                    code = btoa(encodeURIComponent(code));
                    inner = `s.innerHTML=decodeURIComponent(atob('${code}'))`;
                }

                a.setAttribute('style', 'display: none !important;');
                a.setAttribute('onclick', `(function() { let s = document.createElement('script');s.setAttribute('data-isl', 'injected-script');${inner};document.querySelector('${appendOn}').appendChild(s); })();`);

                if (append_on_document) document.querySelector('head').appendChild(a);

                a.click();
                a.remove();
            }
        });
    }

    /**
     * Inject css <br>
     * Appends css to the head in a new style tag
     *
     * @param css The css to append
     */
    export function injectCSS(css: string): void {
        onReady(() => {
            let a = document.createElement('a');

            let inner = `s.innerHTML=\`${css}\``;
            if (encode_content) {
                css = btoa(encodeURIComponent(css));
                inner = `s.innerHTML=decodeURIComponent(atob('${css}'))`;
            }

            a.setAttribute('style', 'display: none !important;');
            a.setAttribute('onclick', `(function() { let s = document.createElement('style');s.setAttribute('data-isl', 'injected-style');${inner};document.querySelector('head').appendChild(s); })();`);

            if (append_on_document) document.querySelector('head').appendChild(a);

            a.click();
            a.remove();
        });
    }

    // Check if ISL can execute, if used with document_start

    function checkReady(): void {
        if (!!document.querySelector('head')) {
            ready = true;
            console.debug(`[InjectionService] Ready (took x${readyRetry}), injecting x${injectionsPending}`);
            window.dispatchEvent(new CustomEvent(ISL_READY));
        } else {
            readyRetry ++;
            setTimeout(() => checkReady(), 10);
        }
    }

    checkReady();

}
