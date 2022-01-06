module Util {

    export const enum STATIC_ID {
        MODAL = 'modal_pse_custom_modal'
    }

    export function debug(...data: any[]): void {
        console.debug('[SteamPenguiniEnhancement]', ...data);
    }

    export function injectScriptTag(innerHTML: string): void {
        let newScriptTag = document.createElement('script');

        newScriptTag.setAttribute('data-pse-tag', 'SteamPenguiniEnhancement IniScript');

        newScriptTag.innerHTML = innerHTML;

        document.getElementsByTagName('body')[0].append(newScriptTag);
    }

    export function initModal(): void {
        let div = document.createElement('div');

        div.setAttribute('id', STATIC_ID.MODAL);
        div.setAttribute('style', 'display: none; min-height: 100px; text-align: center; padding: 10px; background-color: #1b2838; border: 1px solid #101822; border-radius: 15px;');

        document.getElementsByTagName('body')[0].appendChild(div);

        function g_pse_showModal(content: string): void {
            g_pse_dismissModal();

            g_pse_currentModal = new CModal($J(`#${STATIC_ID.MODAL}`));

            document.querySelector(`#${STATIC_ID.MODAL}`).innerHTML = content;

            g_pse_currentModal.Show();
        }

        function g_pse_dismissModal(): void {
            if (g_pse_currentModal) {
                g_pse_currentModal.Dismiss();

                document.querySelector(`#${STATIC_ID.MODAL}`).innerHTML = '';

                g_pse_currentModal = null;
            }
        }

        Util.injectScriptTag(`
var g_pse_currentModal = null;

${g_pse_showModal.toString()}

${g_pse_dismissModal.toString()}
        `);
    }

}
